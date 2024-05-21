import { IPlugin, TokenManager } from "../token";
import * as vscode from "vscode";

/**
 * Decorator,  highlight selected words
 */
export class Decorator implements IPlugin {
    constructor(private mngr: TokenManager) {}

    private decoratedItems: Map<string, vscode.TextEditorDecorationType> =
        new Map<string, vscode.TextEditorDecorationType>();

    postRemove(token: string): void {
        vscode.window.activeTextEditor?.setDecorations(
            this.getTextEditorDecorationType(),
            []
        );
    }
    postAdd(token: string): void {
        vscode.window.activeTextEditor?.setDecorations(
            this.getTextEditorDecorationType(),
            this.mngr.tokens.get(token) || []
        );
    }

    private getTextEditorDecorationType(): vscode.TextEditorDecorationType {
        return vscode.window.createTextEditorDecorationType({
            rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed,
            backgroundColor: "rgba(255, 255, 0, 0.3)",
            // color: "",
        });
    }
}
