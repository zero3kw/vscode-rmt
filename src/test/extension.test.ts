import { readFileSync } from 'fs';
import { join } from 'path';
import * as vscode from 'vscode';
import { activate } from '../extension';

// The real 'vscode' module only exists inside VS Code; provide only what activate() uses.
jest.mock('vscode', () => {
    class Position {
        constructor(readonly line: number, readonly character: number) {}
    }
    class Selection {
        constructor(readonly anchor: Position, readonly active: Position) {}
    }
    return {
        Position,
        Selection,
        EndOfLine: { LF: 1, CRLF: 2 },
        commands: { registerCommand: jest.fn(() => ({ dispose: jest.fn() })) },
        window: { activeTextEditor: undefined },
        workspace: { getConfiguration: undefined },
    };
}, { virtual: true });

interface FakeEditor {
    document: { getText(range: vscode.Range): string; eol: vscode.EndOfLine };
    selections: vscode.Selection[];
    edit(callback: (builder: Pick<vscode.TextEditorEdit, 'replace'>) => void): Promise<boolean>;
    replacements: Array<Parameters<vscode.TextEditorEdit['replace']>>;
}

function selection(startCharacter: number, endCharacter: number, reversed = false): vscode.Selection {
    const start = new vscode.Position(0, startCharacter);
    const end = new vscode.Position(0, endCharacter);
    return reversed ? new vscode.Selection(end, start) : new vscode.Selection(start, end);
}

function fakeEditor(
    texts: Map<vscode.Selection, string>,
    { editSucceeds = true, eol = vscode.EndOfLine.LF }: { editSucceeds?: boolean; eol?: vscode.EndOfLine } = {},
): FakeEditor {
    const editor: FakeEditor = {
        document: { getText: range => texts.get(range as vscode.Selection) ?? '', eol },
        selections: [...texts.keys()],
        replacements: [],
        edit: callback => {
            callback({ replace: (range, text) => { editor.replacements.push([range, text]); } });
            return Promise.resolve(editSucceeds);
        },
    };
    return editor;
}

/** A workspace configuration that answers with the given overrides, or the caller's default. */
function configuration(overrides: Record<string, unknown> = {}) {
    return () => ({ get: (key: string, defaultValue: unknown) => overrides[key] ?? defaultValue });
}

function registeredCommand(): [string, () => Promise<void>] {
    const [command, callback] = jest.mocked(vscode.commands).registerCommand.mock.calls[0];
    return [command, callback as () => Promise<void>];
}

async function runOn(editor: FakeEditor): Promise<void> {
    Object.assign(vscode.window, { activeTextEditor: editor });
    const [, run] = registeredCommand();
    await run();
}

describe('activate', () => {
    const subscriptions: vscode.Disposable[] = [];

    beforeEach(() => {
        jest.clearAllMocks();
        subscriptions.length = 0;
        Object.assign(vscode.window, { activeTextEditor: undefined });
        Object.assign(vscode.workspace, { getConfiguration: configuration() });
        activate({ subscriptions } as vscode.ExtensionContext);
    });

    test('registers the command declared in package.json and disposes it with the extension', () => {
        const manifest = JSON.parse(readFileSync(join(__dirname, '..', '..', 'package.json'), 'utf8')) as {
            contributes: { commands: Array<{ command: string }> };
        };
        const [command] = registeredCommand();
        expect(manifest.contributes.commands.map(c => c.command)).toEqual([command]);
        expect(subscriptions).toHaveLength(1);
    });

    test('strips tags from every selection and collapses each selection to its cursor', async () => {
        const forward = selection(0, 10);
        const backward = selection(20, 30, true);
        const editor = fakeEditor(new Map([
            [forward, '<b>bold</b>'],
            [backward, '<i>italic</i>'],
        ]));

        await runOn(editor);

        expect(editor.replacements).toEqual([[forward, 'bold'], [backward, 'italic']]);
        expect(editor.selections.map(s => [s.anchor, s.active])).toEqual([
            [forward.active, forward.active],
            [backward.active, backward.active],
        ]);
    });

    test('applies the removeMarkupTags settings, defaulting to plain-text conversion', async () => {
        const input = '<script>x</script>&amp;<br>';
        const withDefaults = fakeEditor(new Map([[selection(0, 1), input]]));
        await runOn(withDefaults);
        expect(withDefaults.replacements.map(([, text]) => text)).toEqual(['&\n']);

        Object.assign(vscode.workspace, {
            getConfiguration: configuration({
                removeScriptAndStyleContent: false,
                decodeEntities: false,
                replaceLineBreaks: false,
            }),
        });
        const withSettingsOff = fakeEditor(new Map([[selection(0, 1), input]]));
        await runOn(withSettingsOff);
        expect(withSettingsOff.replacements.map(([, text]) => text)).toEqual(['x&amp;']);
    });

    test('uses the document\'s end-of-line sequence for <br>', async () => {
        const editor = fakeEditor(new Map([[selection(0, 1), 'a<br>b']]), { eol: vscode.EndOfLine.CRLF });
        await runOn(editor);
        expect(editor.replacements.map(([, text]) => text)).toEqual(['a\r\nb']);
    });

    test('keeps the selection when the edit is rejected', async () => {
        const original = selection(0, 10);
        const editor = fakeEditor(new Map([[original, '<b>bold</b>']]), { editSucceeds: false });

        await runOn(editor);

        expect(editor.selections).toEqual([original]);
    });

    test('does nothing without an active editor', async () => {
        const [, run] = registeredCommand();
        await expect(run()).resolves.toBeUndefined();
    });
});
