import { topicChangeActiveTextEditor } from "../dispatcher";
import { logger } from "../logger";
import {
    IMarkerChangeMessage,
    MarkerItem,
    MarkerMngr,
    topicMarkerAdd,
    topicMarkerRemove,
    topicMarkerReset,
} from "../marker";
import { InMemoryMessageQueue } from "../mq";
import * as vscode from "vscode";
import { VscodeUtils } from "../utils";

const MarkerDecorateOption = {
    name: "Bright Pink",
    backgroundColor: "#FF007F",
    color: "#FFFFFF",
};

interface DecorationItem {
    decorationType: vscode.TextEditorDecorationType;
}

export class MarkerDecorator {
    private mq: InMemoryMessageQueue;
    private decoratedItems: Map<string, DecorationItem>;
    private mmngr: MarkerMngr;

    private currentUri: string;

    constructor(mq: InMemoryMessageQueue, mmngr: MarkerMngr) {
        this.mmngr = mmngr;
        this.decoratedItems = new Map<string, DecorationItem>();
        this.currentUri = "";

        this.mq = mq;
        this.mq.subscribe(topicMarkerAdd, async (msg) => {
            const { uri, markers } = msg.payload as IMarkerChangeMessage;
            const marker = markers[0];

            logger.info(`add marker decorator for ${marker.uniqueKey()}`);

            this.decorateMarker(uri, marker);
            msg.commit();
        });

        this.mq.subscribe(topicMarkerRemove, async (msg) => {
            const { uri, markers } = msg.payload as IMarkerChangeMessage;
            const marker = markers[0];

            logger.info(`remove marker decorator for ${marker.uniqueKey()}`);

            const key = this.uniqueKey(marker);
            if (this.decoratedItems.has(key)) {
                const item = this.decoratedItems.get(key);
                item?.decorationType.dispose() &&
                    this.decoratedItems.delete(key);
            }

            msg.commit();
        });

        this.mq.subscribe(topicMarkerReset, this.handleReset.bind(this));
        this.mq.subscribe(topicChangeActiveTextEditor, this.handleReset.bind(this));
    }

    private async handleReset(msg: any) {
        const uri = vscode.window.activeTextEditor?.document.uri.toString();
        if (!uri || !VscodeUtils.isFileUri(uri) || uri === this.currentUri) {
            logger.debug(`marker decorator ignore reset`);
            return;
        }

        this.currentUri = uri;

        logger.info(`marker decorator reset all.`);
        this.decoratedItems.clear();

        this.mmngr.__markers.forEach((val, uri) => {
            if (this.currentUri !== uri) {
                return;
            }
            for (let cur = val.next; cur; cur = cur.next) {
                const item = cur.data;
                this.decorateMarker(uri, item);
            }
        });

        msg.commit();
    }

    private decorateMarker(uri: string, item: MarkerItem): void {
        if (this.currentUri !== uri) {
            return;
        }

        const decorationType = vscode.window.createTextEditorDecorationType({
            after: {
                contentText: `__${item.token}__`,
                backgroundColor: MarkerDecorateOption.backgroundColor,
                color: MarkerDecorateOption.color,
            },
        });

        vscode.window.activeTextEditor?.setDecorations(decorationType, [
            new vscode.Range(item.position, item.position),
        ]);

        this.decoratedItems.set(this.uniqueKey(item), { decorationType });
    }

    private uniqueKey(item: MarkerItem): string {
        return `${JSON.stringify(item.position)}+${item.uniqueKey()}`;
    }
}
