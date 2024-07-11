import { logger } from "../logger";
import * as vscode from "vscode";
import { OrderedLinkedList, OrderedLinkedListHead } from "../utils";
import { InMemoryMessageQueue } from "../mq";
import {
    HighlightMngr,
    IHighlightChangeMessage,
    topicHighlightAdd,
    topicHighlightRemove,
    topicHighlightReset,
} from "../highlight";

interface RenderOption {
    name: string;
    backgroundColor: string;
    color?: string; // font color
}

const defaultRenderOptions: RenderOption[] = [
    {
        name: "Dark Gray",
        backgroundColor: "#34495E",
        color: "#FFFFFF",
    },
    {
        name: "Red",
        backgroundColor: "#FF5733",
        color: "#FFFFFF",
    },
    {
        name: "Blue",
        backgroundColor: "#3498DB",
        color: "#FFFFFF",
    },
    {
        name: "Green",
        backgroundColor: "#27AE60",
        color: "#FFFFFF",
    },
    {
        name: "Yellow",
        backgroundColor: "#F1C40F",
        color: "#000000",
    },
    {
        name: "Purple",
        backgroundColor: "#9B59B6",
        color: "#FFFFFF",
    },
    {
        name: "Orange",
        backgroundColor: "#E74C3C",
        color: "#FFFFFF",
    },
    {
        name: "Turquoise",
        backgroundColor: "#2ECC71",
        color: "#FFFFFF",
    },
    {
        name: "Orange Yellow",
        backgroundColor: "#F39C12",
        color: "#000000",
    },
    {
        name: "Cyan",
        backgroundColor: "#1ABC9C",
        color: "#FFFFFF",
    },
];

interface DecorationItem {
    renderOp: RenderOption;
    decorationType: vscode.TextEditorDecorationType;
}
/**
 * Decorator,  highlight selected words
 */
export class Decorator {
    private avaiable: OrderedLinkedList<RenderOption> =
        new OrderedLinkedListHead<RenderOption>(() => true);

    private decoratedItems: Map<string, DecorationItem> = new Map<
        string,
        DecorationItem
    >();

    private mq: InMemoryMessageQueue;
    private mngr: HighlightMngr;

    constructor(mq: InMemoryMessageQueue, mngr: HighlightMngr) {
        defaultRenderOptions.forEach((op) => this.avaiable.insert(op));

        this.mngr = mngr;
        this.mq = mq;

        this.mq.subscribe(topicHighlightAdd, async (msg) => {
            this.add((msg.payload as IHighlightChangeMessage).marker);
            msg.commit();
        });
        this.mq.subscribe(topicHighlightRemove, async (msg) => {
            this.remove((msg.payload as IHighlightChangeMessage).marker);
            msg.commit();
        });
        this.mq.subscribe(topicHighlightReset, async (msg) => {
            this.reset();
            msg.commit();
        });
    }

    preCheck(version: number): boolean {
        return this.mngr.getCurrentVersion() === version;
    }

    add(token: string): void {
        const nn = this.avaiable.popFront();
        if (!nn) {
            return;
        }

        const renderOp = nn.data;
        this.decorateMarker(token, renderOp);
        logger.info(`decorate [${renderOp.name}] for ${token}`);
    }

    remove(token: string): void {
        const item = this.decoratedItems.get(token);
        if (!item) {
            return;
        }

        item.decorationType.dispose();
        this.avaiable.insert(item.renderOp);
    }

    reset(): void {
        this.decoratedItems.forEach((val, marker) => {
            val.decorationType.dispose();
            this.decorateMarker(marker, val.renderOp);
        });
    }

    private decorateMarker(marker: string, renderOp: RenderOption): void {
        const decorationType = vscode.window.createTextEditorDecorationType({
            rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed,
            backgroundColor: renderOp.backgroundColor,
            color: renderOp.color,
        });

        vscode.window.activeTextEditor?.setDecorations(
            decorationType,
            this.mngr.highlights.get(marker) || []
        );

        this.decoratedItems.set(marker, { renderOp, decorationType });
    }
}
