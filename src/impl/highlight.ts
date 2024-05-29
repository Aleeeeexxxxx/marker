import * as vscode from "vscode";
import { logger } from "../logger";

const MAX_ITEMS = 10;

export class HighlightImpl {
    public highlights: Map<string, Array<vscode.Range>> = new Map<
        string,
        Array<vscode.Range>
    >();

    private currentOpenFileURI: string | undefined;

    compareAndSetCurrentUri(uri: vscode.Uri): boolean {
        const current = uri.toString();
        if (this.currentOpenFileURI === current) {
            return true;
        }
        this.currentOpenFileURI = current;
        return false;
    }

    add(marker: string): boolean {
        if (this.highlights.size >= MAX_ITEMS) {
            vscode.window.showInformationMessage(
                "The number of markers exceeds the limit."
            );
            return false;
        }

        if (this.highlights.has(marker)) {
            logger.warn(`duplicated marker added, marker=${marker}`);
            return false;
        }
        this.highlights.set(marker, this.search(marker));
        return true;
    }

    remove(marker: string): boolean {
        const ranges = this.highlights.get(marker);
        if (!ranges) {
            logger.warn(`remove an non-existing marker, marker=${marker}`);
            return false;
        }
        this.highlights.delete(marker);
        return true;
    }

    reset(editor?: vscode.TextEditor): boolean {
        if (!vscode.window.activeTextEditor) {
            return false;
        }
        for (const key of this.highlights.keys()) {
            this.highlights.set(key, this.search(key));
        }
        return true;
    }

    private search(token: string): Array<vscode.Range> {
        if (!vscode.window.activeTextEditor || token.length === 0) {
            return [];
        }

        const { document } = vscode.window.activeTextEditor;
        const text = document.getText();

        const matches = this.__search(token, text);
        logger.debug(
            `token ${token} matches in ${document.uri.toString()}, start index=${matches.join(
                ","
            )}`
        );

        return matches.map((index) => {
            return new vscode.Range(
                document.positionAt(index),
                document.positionAt(index + token.length)
            );
        });
    }

    private __search(token: string, text: string): Array<number> {
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
