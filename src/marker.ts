import * as vscode from "vscode";
import { logger } from "./logger";
import { OrderedLinkedList, OrderedLinkedListHead } from "./utils";
import { InMemoryMessageQueue } from "./mq";
import { topicChangeTextDocument } from "./dispatcher";

export interface IMarkerChangeMessage {}

export const topicMarkerChange = "marker.marker.change";

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
            // insert something just before token
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

function debugPrintLastNCharacter(
    doc: vscode.TextDocument,
    pos: vscode.Position,
    msg?: string,
    n: number = 3
) {
    const s = doc.getText(
        new vscode.Range(new vscode.Position(pos.line, 0), pos)
    );
    logger.debug(
        `[ ${msg}] last ${n} charater of: ${s.substring(s.length - 3)}`
    );
}

export function getDocumentChange(
    document: vscode.TextDocument,
    change: vscode.TextDocumentContentChangeEvent
): IDocumentChange {
    debugPrintLastNCharacter(
        document,
        change.range.start,
        "textBeforeChangeStart"
    );

    debugPrintLastNCharacter(document, change.range.end, "textBeforeChangeEnd");

    const start = document.offsetAt(change.range.start);
    const end = document.offsetAt(change.range.end);
    const changed = change.text.length - (end - start);
    logger.debug(`changed, start=${start},end=${end},changed=${changed}`);

    return { range: { start, end, changed }, document };
}

export class MarkerMngr {
    // file uri -> markers
    public __markers: Map<string, OrderedLinkedList<MarkerItem>>;

    private mq: InMemoryMessageQueue;

    constructor(mq: InMemoryMessageQueue) {
        this.__markers = new Map();
        this.mq = mq;
        this.mq.subscribe(topicChangeTextDocument, async (msg) => {
            const { event } = msg.payload as {
                event: vscode.TextDocumentChangeEvent;
            };
            const somethingChanged = this.onTextDocumentChange(event);
            if (somethingChanged) {
                this.mq.publish(topicMarkerChange, {});
            }
            msg.commit();
        });
    }

    static key(document: vscode.TextDocument): string {
        return document.uri.toString();
    }

    onTextDocumentChange(event: vscode.TextDocumentChangeEvent): boolean {
        const { document } = event;
        const markers = this.__markers.get(MarkerMngr.key(document));
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
        if (token.length <= 0) {
            return;
        }

        debugPrintLastNCharacter(
            document,
            selection.anchor,
            "textBeforeSelection"
        );

        this.__add(
            MarkerMngr.key(document),
            new MarkerItem(
                token,
                document.offsetAt(selection.anchor),
                selection.anchor
            )
        );
        this.mq.publish(topicMarkerChange, {});
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
            this.mq.publish(topicMarkerChange, {});
        }
    }

    private __add(key: string, item: MarkerItem) {
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
