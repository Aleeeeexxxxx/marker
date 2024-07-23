import { InMemoryMessageQueue } from "../mq";
import { KMP } from "../utils";
import { ISearchChangeMessage, topicSearchChange } from "./search";
import * as vscode from "vscode";

export class SearchFilter {
    private mq: InMemoryMessageQueue;
    private onFilterChange: () => void;

    private pattern: string;
    private next: number[];

    constructor(mq: InMemoryMessageQueue, onFilterChange: () => void) {
        this.onFilterChange = onFilterChange;
        this.pattern = "";
        this.next = [];

        this.mq = mq;
        this.mq.subscribe(topicSearchChange, async (msg) => {
            const pattern = (msg.payload as ISearchChangeMessage).pattern;
            if (this.pattern !== pattern) {
                this.pattern = pattern;
                this.next =
                    this.pattern.length > 0 ? KMP.getNext(this.pattern) : [];

                this.onFilterChange();
            }
            msg.commit();
        });
    }

    filter(item: vscode.TreeItem): vscode.TreeItem | undefined {
        const label = item.label as vscode.TreeItemLabel;
        if (this.pattern.length > 0) {
            const pos = KMP.searchAll(label.label, this.pattern, this.next);
            if (pos.length > 0) {
                label.highlights = [[pos[0], pos[0] + this.pattern.length]];
            } else {
                return undefined;
            }
        } else {
            label.highlights = [];
        }
        item.label = label;
        return item;
    }
}
