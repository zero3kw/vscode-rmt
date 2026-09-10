import * as vscode from 'vscode';
import { removeMarkupTags, type RemoveMarkupTagsOptions } from './removeMarkupTags';

export function activate(context: vscode.ExtensionContext): void {
    const disposable = vscode.commands.registerCommand('extension.removeMarkupTags', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return;
        }

        const { document, selections } = editor;
        const config = vscode.workspace.getConfiguration('removeMarkupTags', document);
        const eol = document.eol === vscode.EndOfLine.CRLF ? '\r\n' : '\n';
        const options: RemoveMarkupTagsOptions = {
            removeScriptAndStyleContent: config.get('removeScriptAndStyleContent', true),
            decodeEntities: config.get('decodeEntities', true),
            lineBreak: config.get('replaceLineBreaks', true) ? eol : null,
        };

        const applied = await editor.edit(editBuilder => {
            for (const selection of selections) {
                editBuilder.replace(selection, removeMarkupTags(document.getText(selection), options));
            }
        });

        if (applied) {
            // Collapse each selection to its cursor so the cleaned text is not left highlighted.
            editor.selections = editor.selections.map(s => new vscode.Selection(s.active, s.active));
        }
    });

    context.subscriptions.push(disposable);
}

export function deactivate(): void {}
