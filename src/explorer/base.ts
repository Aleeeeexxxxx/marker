import * as vscode from "vscode";

export class ExplorerBase {
    private _onDidChangeTreeData: vscode.EventEmitter<undefined> =
        new vscode.EventEmitter<undefined>();

    readonly onDidChangeTreeData: vscode.Event<undefined> =
        this._onDidChangeTreeData.event;

    fire() {
        this._onDidChangeTreeData.fire(undefined);
    }
}