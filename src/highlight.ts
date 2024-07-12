import * as vscode from "vscode";
import { logger } from "./logger";
import { InMemoryMessageQueue } from "./mq";
import {
    IChangeActiveTextEditorMessage,
    topicChangeActiveTextEditor,
    topicChangeTextDocument,
} from "./dispatcher";
import { DelayRunner, KMP } from "./utils";

const MAX_ITEMS = 10;

export interface IHighlightResetMessage {
    version: number;
}
export const topicHighlightReset = "marker.highlight.reset";

export interface IHighlightChangeMessage {
    version: number;
    marker: string;
}
export const topicHighlightAdd = "marker.highlight.add";
export const topicHighlightRemove = "marker.highlight.remove";

export class HighlightMngr {
    public highlights: Map<string, Array<vscode.Range>>;

    private currentOpenFileURI: string | undefined;
    private mq: InMemoryMessageQueue;

    private reseter: DelayRunner;

    private version: number;

    constructor(mq: InMemoryMessageQueue) {
        this.version = 0;
        this.highlights = new Map<string, Array<vscode.Range>>();
        this.reseter = new DelayRunner(500, this.reset.bind(this));

        this.mq = mq;
        this.mq.subscribe(topicChangeActiveTextEditor, async (msg) => {
            this.reseter.run();
            msg.commit();
        });
        this.mq.subscribe(topicChangeTextDocument, async (msg) => {
            this.reseter.run();
            msg.commit();
        });
    }

    getCurrentVersion() {
        return this.version;
    }

    compareAndSetCurrentUri(uri: vscode.Uri): boolean {
        const current = uri.toString();
        if (this.currentOpenFileURI === current) {
            return false;
        }
        this.currentOpenFileURI = current;
        return true;
    }

    add(marker: string) {
        if (this.highlights.size >= MAX_ITEMS) {
            vscode.window.showInformationMessage(
                "The number of markers exceeds the limit."
            );
        }

        if (this.highlights.has(marker)) {
            logger.warn(`duplicated marker added, marker=${marker}`);
            return;
        }
        this.highlights.set(marker, this.search(marker));

        const version = ++this.version;
        this.mq.publish(topicHighlightAdd, {
            marker,
            version,
        } as IHighlightChangeMessage);
    }

    remove(marker: string) {
        const ranges = this.highlights.get(marker);
        if (!ranges) {
            logger.info(`remove an non-existing marker, marker=${marker}`);
        }

        this.highlights.delete(marker);

        const version = ++this.version;
        this.mq.publish(topicHighlightRemove, {
            marker,
            version,
        } as IHighlightChangeMessage);
    }

    reset() {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            for (const key of this.highlights.keys()) {
                this.highlights.set(key, this.search(key));
            }

            const version = ++this.version;
            this.mq.publish(topicHighlightReset, {
                version,
            } as IHighlightResetMessage);
        }
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
        return KMP.searchAll(text, token, KMP.getNext(token));
    }

    deserialize(rawdata: string) {
        if (typeof rawdata === "object") {
            rawdata = "";
        }
        if (rawdata.length <= 0) {
            return;
        }
        this.highlights = new Map();

        rawdata.split("__marker_internal__").forEach((h) => {
          this.add(h);
        });

    }

    serialize(): string {
        const highlights: string[] = [];
        this.highlights.forEach((val, key) => {
            highlights.push(key);
        });

        return highlights.join("__marker_internal__");
    }
}
