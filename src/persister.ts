import * as vscode from "vscode";
import { InMemoryMessageQueue } from "./mq";
import {
    HighlightMngr,
    IHighlightChangeMessage,
    topicHighlightAdd,
    topicHighlightRemove,
} from "./highlight";
import { MarkerMngr, topicMarkerChange } from "./marker";

const highlightKey = "marker.persister.highlight";
const markerKey = "marker.persister.marker";

export class Persister {
    private store: vscode.Memento;
    private mq: InMemoryMessageQueue;

    private mmngr: MarkerMngr;
    private hmngr: HighlightMngr;

    constructor(
        store: vscode.Memento,
        mq: InMemoryMessageQueue,
        mmngr: MarkerMngr,
        hmngr: HighlightMngr
    ) {
        this.store = store;
        this.mmngr = mmngr;
        this.hmngr = hmngr;

        this.mq = mq;
        this.mq.subscribe(topicHighlightAdd, async (msg) => {
            this.store.update(highlightKey, this.hmngr.serialize());
            msg.commit();
        });

        this.mq.subscribe(topicHighlightRemove, async (msg) => {
            this.store.update(highlightKey, this.hmngr.serialize());
            msg.commit();
        });

        this.mq.subscribe(topicMarkerChange, async (msg) => {
            this.store.update(markerKey, this.mmngr.serialize());
            msg.commit();
        });
    }

    getHighlights(): string {
        const markers = this.store.get<string>(highlightKey) ;
        return markers ? markers : "";
    }

    getMarkers(): string {
        const markers = this.store.get<string>(markerKey);
        return markers ? markers : "";
    }
}
