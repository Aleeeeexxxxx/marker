import * as vscode from "vscode";
import { logger } from "../logger";
import { OrderedLinkedList, OrderedLinkedListHead } from "../utils";

interface IDocumentChange {
    document: vscode.TextDocument;
    range: {
        start: number;
        end: number;
        changed: number;
    };
}

export class MarkerItem {
    token: string;

    start: number;
    end: number;
    position: vscode.Position;

    broken: boolean;

    constructor(token: string, start: number, position: vscode.Position) {
        this.token = token;
        this.start = start;
        this.end = start + token.length;
        this.position = position;
        this.broken = false;
    }

    onChange(change: IDocumentChange): boolean {
        if (this.end < change.range.start) {
            this.debugPrintToken(change.document);
            return false;
        }
        if (
            this.start > change.range.end ||
            // insert something before token
            (this.start === change.range.end &&
                change.range.end === change.range.start)
        ) {
            this.start += change.range.changed;
            this.end += change.range.changed;
            this.position = change.document.positionAt(this.start);

            this.debugPrintToken(change.document);
            return true;
        }

        this.broken = true;
        return true;
    }

    debugPrintToken(document: vscode.TextDocument) {
        logger.debug(
            `token changed, old=${this.token}, new=${document
                .getText()
                .substring(this.start, this.end)}`
        );
    }
}

function debugPrintLastNCharacter(s: string, msg?: string, n: number = 3) {
    logger.debug(
        `[ ${msg}] last ${n} charater of: ${s.substring(s.length - 3)}`
    );
}

export function getDocumentChange(
    document: vscode.TextDocument,
    change: vscode.TextDocumentContentChangeEvent
): IDocumentChange {
    const textBeforeChangeStart = document.getText(
        new vscode.Range(new vscode.Position(0, 0), change.range.start)
    );
    debugPrintLastNCharacter(textBeforeChangeStart, "textBeforeChangeStart");

    const textBeforeChangeEnd = document.getText(
        new vscode.Range(new vscode.Position(0, 0), change.range.end)
    );
    debugPrintLastNCharacter(textBeforeChangeEnd, "textBeforeChangeEnd");

    const start = textBeforeChangeStart.length;
    const end = textBeforeChangeStart.length;
    const changed = change.text.length - (end - start);
    logger.debug(`changed, start=${start},end=${end},changed=${changed}`);

    return { range: { start, end, changed }, document };
}

export class MarkerImpl {
    // file uri -> markers
    public __markers: Map<string, OrderedLinkedList<MarkerItem>> = new Map();

    static key(document: vscode.TextDocument): string {
        return document.uri.toString();
    }

    onTextDocumentChange(event: vscode.TextDocumentChangeEvent): boolean {
        const { document } = event;
        const markers = this.__markers.get(MarkerImpl.key(document));
        let changed = false;

        markers &&
            event.contentChanges.forEach((change) => {
                const docChange = getDocumentChange(document, change);
                markers.forEach((item) => {
                    if (!item.broken) {
                        changed = item.onChange(docChange);
                    }
                });
            });
        return changed;
    }

    add(editor: vscode.TextEditor) {
        const { document, selection } = editor;
        const token = document.getText(selection);
        const before = document.getText(
            new vscode.Range(new vscode.Position(0, 0), selection.anchor)
        );
        debugPrintLastNCharacter(before, "textBeforeSelection");

        this.__addMarkerItem(
            MarkerImpl.key(document),
            new MarkerItem(token, before.length, selection.anchor)
        );
    }

    remove(token: string, uri: string) {
        const markers = this.__markers.get(uri);
        if (markers) {
            const nn = markers.find((t) => {
                if (t.token === token) {
                    return { match: true, shouldContinue: false };
                } else {
                    return { match: false, shouldContinue: true };
                }
            });

            nn && markers.remove(nn);
        }
    }

    private __addMarkerItem(key: string, item: MarkerItem) {
        let markers = this.__markers.get(key);
        if (!markers) {
            markers = new OrderedLinkedListHead<MarkerItem>(
                (nn, toBeInsert) => {
                    return toBeInsert.start < nn.start;
                }
            );
            this.__markers.set(key, markers);
        }
        markers.insert(item);
    }
}
