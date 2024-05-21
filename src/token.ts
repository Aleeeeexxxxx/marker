import * as vscode from "vscode";

export interface IPlugin {
  postAdd(token: string): void;
  postRemove(token: string): void;
}

export class TokenManager {
  public tokens: Map<string, Array<vscode.Range>> = new Map<
    string,
    Array<vscode.Range>
  >();

  private plugins: Array<IPlugin> = [];

  constructor() {}

  register(plugin: IPlugin): TokenManager {
    this.plugins.push(plugin);
    return this;
  }

  add(token: string) {
    if (this.tokens.has(token)) {
      return;
    }
    this.tokens.set(token, this.search(token));
    this.plugins.forEach((plugin) => plugin.postAdd(token));
  }

  remove(token: string) {
    const ranges = this.tokens.get(token);
    if (!ranges) {
      return;
    }

    this.tokens.delete(token);
    this.plugins.forEach((plugin) => plugin.postRemove(token));
  }

  private search(token: string): Array<vscode.Range> {
    if (!vscode.window.activeTextEditor || token.length === 0) {
      return [];
    }

    const { document } = vscode.window.activeTextEditor;
    const text = document.getText();

    const matches = TokenManager.__search(token, text);

    return matches.map((index) => {
      return new vscode.Range(
        document.positionAt(index),
        document.positionAt(index + token.length)
      );
    });
  }

  static __search(token: string, text: string): Array<number> {
    const matches = new Array<number>();
    let index = 0;
    while (true) {
      index = text.indexOf(token, index);
      if (index < 0) {
        break;
      }
      matches.push(index);
      index = index + token.length;
    }
    return matches;
  }
}
