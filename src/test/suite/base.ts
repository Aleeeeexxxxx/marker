import * as vscode from "vscode";

export function getWorkspaceFolder(): string {
    return vscode.workspace.workspaceFolders![0].uri.path;
}