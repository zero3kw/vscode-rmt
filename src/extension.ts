import * as vscode from 'vscode';
import { removeMarkupTags } from './removeMarkupTags';

export function activate(context: vscode.ExtensionContext): void {
    const disposable = vscode.commands.registerCommand('extension.removeMarkupTags', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return;
        }

        const { document, selections } = editor;
        await editor.edit(editBuilder => {
            for (const selection of selections) {
                editBuilder.replace(selection, removeMarkupTags(document.getText(selection)));
            }
        });
    });

    context.subscriptions.push(disposable);
}

export function deactivate(): void {}
