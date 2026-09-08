import { readFileSync } from 'fs';
import { join } from 'path';
import * as vscode from 'vscode';
import { activate } from '../extension';

// The real 'vscode' module only exists inside VS Code; provide just what activate() touches.
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
        commands: { registerCommand: jest.fn(() => ({ dispose: jest.fn() })) },
        window: { activeTextEditor: undefined },
    };
}, { virtual: true });

interface FakeEditor {
    document: { getText(range: vscode.Range): string };
    selections: vscode.Selection[];
    edit(callback: (builder: Pick<vscode.TextEditorEdit, 'replace'>) => void): Promise<boolean>;
    replacements: Array<Parameters<vscode.TextEditorEdit['replace']>>;
}

function selection(startCharacter: number, endCharacter: number, reversed = false): vscode.Selection {
    const start = new vscode.Position(0, startCharacter);
    const end = new vscode.Position(0, endCharacter);
    return reversed ? new vscode.Selection(end, start) : new vscode.Selection(start, end);
}

function fakeEditor(texts: Map<vscode.Selection, string>, editSucceeds = true): FakeEditor {
    const editor: FakeEditor = {
        document: { getText: range => texts.get(range as vscode.Selection) ?? '' },
        selections: [...texts.keys()],
        replacements: [],
        edit: callback => {
            callback({ replace: (range, text) => { editor.replacements.push([range, text]); } });
            return Promise.resolve(editSucceeds);
        },
    };
    return editor;
}

function registeredCommand(): [string, () => Promise<void>] {
    const [command, callback] = jest.mocked(vscode.commands).registerCommand.mock.calls[0];
    return [command, callback as () => Promise<void>];
}

describe('activate', () => {
    const subscriptions: vscode.Disposable[] = [];

    beforeEach(() => {
        jest.clearAllMocks();
        subscriptions.length = 0;
        Object.assign(vscode.window, { activeTextEditor: undefined });
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
        Object.assign(vscode.window, { activeTextEditor: editor });

        const [, run] = registeredCommand();
        await run();

        expect(editor.replacements).toEqual([[forward, 'bold'], [backward, 'italic']]);
        expect(editor.selections.map(s => [s.anchor, s.active])).toEqual([
            [forward.active, forward.active],
            [backward.active, backward.active],
        ]);
    });

    test('keeps the selection when the edit is rejected', async () => {
        const original = selection(0, 10);
        const editor = fakeEditor(new Map([[original, '<b>bold</b>']]), false);
        Object.assign(vscode.window, { activeTextEditor: editor });

        const [, run] = registeredCommand();
        await run();

        expect(editor.selections).toEqual([original]);
    });

    test('does nothing without an active editor', async () => {
        const [, run] = registeredCommand();
        await expect(run()).resolves.toBeUndefined();
    });
});
