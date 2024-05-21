import * as vscode from "vscode";
import { IPlugin } from "../token";

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
  postAdd(token: string): void {
    this.tokens.add(token);
    this._onDidChangeTreeData.fire(undefined);
  }

  postRemove(token: string): void {}
}
