// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { TokenManager } from "./token";

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  const tokenMngr = new TokenManager();

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "remarker.editor.menu.mark.highlight",
      () => {
        if (!vscode.window.activeTextEditor) {
          return;
        }
        const { document, selection } = vscode.window.activeTextEditor;
        tokenMngr.add(document.getText(selection));
      }
    ),

    vscode.commands.registerCommand("remarker.editor.menu.mark.remove", () => {
      if (!vscode.window.activeTextEditor) {
        return;
      }
      const { document, selection } = vscode.window.activeTextEditor;
      tokenMngr.remove(document.getText(selection));
    }),

    vscode.window.onDidChangeActiveTextEditor((editor) => {
      if (editor) {
        console.log("Active editor changed to: ", editor.document.fileName);
      }
    }),

    vscode.workspace.onDidChangeTextDocument((event) => {
      console.log(`event: ${JSON.stringify(event)}`);
    })
  );
}

// This method is called when your extension is deactivated
export function deactivate() {}
