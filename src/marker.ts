import * as vscode from "vscode";
import {
    DEBUG,
    LinkedListItem,
    OrderedLinkedList,
    OrderedLinkedListHead,
} from "./utils";

export class MarkerWatcher {
    highlights: Set<string> = new Set();
    // key: vscode file uri
    documents: Map<string, Document> = new Map();
}

interface IDocumentChange {
    document: vscode.TextDocument;
    range: {
        start: number;
        end: number;
        changed: number;
    };
}

class MarkerItem {
    start: any;
}

export class Document {
    readonly watcher: MarkerWatcher;
    readonly uri: vscode.Uri;

    markers: Map<string, LinkedListItem<MarkerItem>>;
    highlights: Map<string, LinkedListItem<MarkerItem>[]>;
    // highlights and markers
    all: OrderedLinkedList<MarkerItem>;

    constructor(uri: vscode.Uri, watcher: MarkerWatcher) {
        this.watcher = watcher;
        this.uri = uri;

        this.all = new OrderedLinkedListHead<MarkerItem>((nn, toBeInsert) => {
            return toBeInsert.start < nn.start;
        });
        this.markers = new Map();
        this.highlights = new Map();
    }

    onDocumentChange(change: IDocumentChange) {
        DEBUG.assert(change.document.uri.toString() === this.uri.toString(), "incorrect uri");

        
    }
}
