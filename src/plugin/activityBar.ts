import * as vscode from "vscode";
import { IPlugin } from "../token";
import { logger } from "../logger";

/**
 * ActivityBar
 */
export class ActivityBar
    implements IPlugin, vscode.TreeDataProvider<vscode.TreeItem>
{
    private tokens: Set<string> = new Set<string>();
    private _onDidChangeTreeData: vscode.EventEmitter<undefined> =
        new vscode.EventEmitter<undefined>();
    /**
     * Implement vscode.TreeDataProvider
     */
    readonly onDidChangeTreeData: vscode.Event<undefined> =
        this._onDidChangeTreeData.event;

    getTreeItem(
        element: vscode.TreeItem
    ): vscode.TreeItem | Thenable<vscode.TreeItem> {
        return element;
    }

    getChildren(
        element?: vscode.TreeItem | undefined
    ): vscode.ProviderResult<vscode.TreeItem[]> {
        const array = new Array<vscode.TreeItem>();
        this.tokens.forEach((val) => array.push(new vscode.TreeItem(val)));
        return array;
    }

    /**
     * Implement IPlugin
     */
    @ActivityBar.triggerVSCodeServer
    postAdd(token: string): void {
        this.tokens.add(token);
    }

    @ActivityBar.triggerVSCodeServer
    postRemove(token: string): void {
        this.tokens.delete(token);
    }

    triggerUpdate() {
        this._onDidChangeTreeData.fire(undefined);
    }

    static triggerVSCodeServer(
        target: any,
        key: string,
        descriptor: PropertyDescriptor
    ) {
        const originalMethod = descriptor.value;
        descriptor.value = function (...args: any[]) {
            const result = originalMethod.apply(this, args);
            target.triggerUpdate();
            return result;
        };
        return descriptor;
    }
}
