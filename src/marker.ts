import * as vscode from "vscode";
import { logger } from "./logger";
import { OrderedLinkedList, OrderedLinkedListHead } from "./utils";
import { InMemoryMessageQueue } from "./mq";
import { topicChangeTextDocument } from "./dispatcher";

export interface IMarkerChangeMessage {
    markers: MarkerItem[];
    uri: string;
}

export const topicMarkerChange = "marker.marker.change";
export const topicMarkerAdd = "marker.marker.add";
export const topicMarkerRemove = "marker.marker.remove";
export const topicMarkerReset = "marker.marker.reset";

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

    constructor(token: string, start: number, position: vscode.Position) {
        this.token = token;
        this.start = start;
        this.end = start + token.length;
        this.position = position;
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

        return true;
    }

    debugPrintToken(document: vscode.TextDocument) {
        logger.debug(
            `token changed, old=${this.token}, new=${document
                .getText()
                .substring(this.start, this.end)}`
        );
    }

    uniqueKey(): string {
        return `${this.token}+${this.start}`;
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
    const end = start + change.rangeLength;
    const changed = change.text.length - change.rangeLength;
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
            this.onTextDocumentChange(event);
            msg.commit();
        });
    }

    static key(document: vscode.TextDocument): string {
        return document.uri.toString();
    }

    onTextDocumentChange(event: vscode.TextDocumentChangeEvent): MarkerItem[] {
        const { document } = event;
        const markers = this.__markers.get(MarkerMngr.key(document));
        let changedItems: MarkerItem[] = [];
        const changedItemsSet = new Set();

        markers &&
            event.contentChanges.forEach((change) => {
                const docChange = getDocumentChange(document, change);
                markers.forEach((item) => {
                    const changed = item.onChange(docChange);
                    if (changed && !changedItemsSet.has(item.uniqueKey())) {
                        changedItemsSet.add(item.uniqueKey());
                        changedItems.push(item);
                    }
                });
            });
        return changedItems;
    }

    async add(editor: vscode.TextEditor, token?: string) {
        if (!token) {
            token = await vscode.window.showInputBox({
                prompt: "Please enter the token you want to marker here",
                placeHolder: "Type something here...",
            });
        }

        const { document, selection } = editor;

        if (!token || token.length <= 0) {
            const selectedTokens = document.getText(selection);
            if (selectedTokens.length > 0) {
                token = selectedTokens;
            } else {
                vscode.window.showErrorMessage(
                    "Please input/select at least one charater for marker"
                );
                return;
            }
        }

        debugPrintLastNCharacter(
            document,
            selection.anchor,
            "textBeforeSelection"
        );

        const marker = new MarkerItem(
            token,
            document.offsetAt(selection.anchor),
            selection.anchor
        );
        this.__add(MarkerMngr.key(document), marker);
        this.mq.publish(topicMarkerAdd, {
            uri: document.uri.toString(),
            markers: [marker],
        } as IMarkerChangeMessage);
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

            if (nn) {
                markers.remove(nn);
                this.mq.publish(topicMarkerRemove, {
                    uri,
                    markers: [nn.data],
                } as IMarkerChangeMessage);
            }
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

    serialize(): string {
        const ret: string[] = [];

        this.__markers.forEach((items, key) => {
            items.forEach((item) => {
                ret.push(`${key}==${JSON.stringify(item)}`);
            });
        });

        return ret.join("__marker_internal__");
    }

    deserialize(rawdata: string) {
        if (rawdata.length <= 0) {
            return;
        }

        this.__markers = new Map();

        rawdata.split("__marker_internal__").forEach((raw) => {
            const vals = raw.split("==");
            const item = JSON.parse(vals[1], (key, value) => {
                if (key === "") {
                    return new MarkerItem(
                        value.token,
                        value.start,
                        value.position
                    );
                }
                return value;
            });
            this.__add(vals[0], item);
        });

        this.mq.publish(topicMarkerReset, {});
    }

    getPosition(uri: string, token: string): number | undefined {
        const file = this.__markers.get(uri);
        if (!file) {
            logger.warn(`no such uri: ${uri} in marker mngr`);
            return undefined;
        }
        const t = file?.find((t) => {
            logger.debug(`walk through: ${t.token}`);
            if (t.token === token) {
                logger.debug(`${t.token} matched`);
                return { match: true, shouldContinue: false };
            }
            return { match: false, shouldContinue: true };
        });
        logger.debug(`result: ${JSON.stringify(t?.data.start)}`);
        return t?.data.start;
    }
}
