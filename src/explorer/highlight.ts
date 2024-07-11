import * as vscode from "vscode";
import { InMemoryMessageQueue } from "../mq";
import {
    IHighlightChangeMessage,
    topicHighlightAdd,
    topicHighlightRemove,
} from "../highlight";
import { ExplorerBase } from "./base";

/**
 * HighlightExplorer
 */
export class HighlightExplorer
    extends ExplorerBase
    implements vscode.TreeDataProvider<vscode.TreeItem>
{
    private mq: InMemoryMessageQueue;
    private highlights: Map<string, HighlightItem>;

    constructor(mq: InMemoryMessageQueue) {
        super();
        this.highlights = new Map();

        this.mq = mq;
        this.mq.subscribe(topicHighlightAdd, async (msg) => {
            const marker = (msg.payload as IHighlightChangeMessage).marker;
            this.highlights.set(marker, new HighlightItem(marker));
            this.fire();
            msg.commit();
        });
        this.mq.subscribe(topicHighlightRemove, async (msg) => {
            const marker = (msg.payload as IHighlightChangeMessage).marker;
            this.highlights.delete(marker);
            this.fire();
            msg.commit();
        });
    }

    /**
     * Implement vscode.TreeDataProvider
     */

    getTreeItem(
        element: vscode.TreeItem
    ): vscode.TreeItem | Thenable<vscode.TreeItem> {
        return element;
    }

    getChildren(
        element?: vscode.TreeItem | undefined
    ): vscode.ProviderResult<vscode.TreeItem[]> {
        return Array.from(this.highlights.values());
    }
}

class HighlightItem extends vscode.TreeItem {
    // should equal to when clause of acitivity bar
    static contextValue = "highlight_item";

    constructor(name: string) {
        super(name);

        this.contextValue = HighlightItem.contextValue;
        this.tooltip = name;
    }
}
