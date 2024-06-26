import { logger } from "../logger";
import {
    IMarkerEventPayload,
    MarkerEvent,
    MarkerEventType,
    MarkerManager,
    MarkerPlugin,
} from "../mngr";
import * as vscode from "vscode";
import { OrderedLinkedList, OrderedLinkedListHead } from "../utils";
import { PluginBase } from "./base";

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
export class Decorator extends PluginBase implements MarkerPlugin {
    private avaiable: OrderedLinkedList<RenderOption> =
        new OrderedLinkedListHead<RenderOption>(() => true);

    constructor(private mngr: MarkerManager) {
        super();

        defaultRenderOptions.forEach((op) => this.avaiable.insert(op));

        this.__registerEventHandler(
            MarkerEventType.POST_ADD_HIGHLIGHT,
            this.postAdd.bind(this)
        );
        this.__registerEventHandler(
            MarkerEventType.POST_REMOVE_HIGHLIGHT,
            this.postRemove.bind(this)
        );
        this.__registerEventHandler(
            MarkerEventType.RESET_HIGHLIGHT,
            this.reset.bind(this)
        );
    }

    private decoratedItems: Map<string, DecorationItem> = new Map<
        string,
        DecorationItem
    >();

    name(): string {
        return "Decorator";
    }

    private __registerEventHandler(
        _type: MarkerEventType,
        handler: (payload: IMarkerEventPayload) => void
    ) {
        const precheck = this.preCheck.bind(this);
        this.registerTypeHandler(_type, (event) => {
            precheck(event) ? handler(event.payload) : null;
        });
    }

    preCheck(event: MarkerEvent): boolean {
        return this.mngr.getCurrentVersion() === event.version;
    }

    postAdd(event: IMarkerEventPayload): void {
        const nn = this.avaiable.popFront();
        if (!nn) {
            return;
        }

        const renderOp = nn.data;
        const marker = event.marker as string;
        this.decorateMarker(marker, renderOp);
        logger.info(`decorate [${renderOp.name}] for ${marker}`);
    }

    postRemove(event: IMarkerEventPayload): void {
        const marker = event.marker as string;
        const item = this.decoratedItems.get(marker);
        if (!item) {
            return;
        }

        item.decorationType.dispose();
        this.avaiable.insert(item.renderOp);
    }

    reset(event: IMarkerEventPayload): void {
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
            this.mngr.highlight.highlights.get(marker) || []
        );

        this.decoratedItems.set(marker, { renderOp, decorationType });
    }
}
