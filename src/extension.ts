import * as vscode from "vscode";
import { TokenManager } from "./token";
import { ActivityBar } from "./plugin/activityBar";
import { Decorator } from "./plugin/decorator";

export function activate(context: vscode.ExtensionContext) {
  const tokenMngr = new TokenManager();
  const activityBarProvider = new ActivityBar();

  tokenMngr.register(new Decorator(tokenMngr)).register(activityBarProvider);

  vscode.window.registerTreeDataProvider(
    "marker_activitybar_explorer",
    activityBarProvider
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "marker.editor.menu.mark.highlight",
      () => {
        if (!vscode.window.activeTextEditor) {
          return;
        }
        const { document, selection } = vscode.window.activeTextEditor;
        tokenMngr.add(document.getText(selection));
      }
    ),

    vscode.commands.registerCommand("marker.editor.menu.mark.remove", () => {
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
