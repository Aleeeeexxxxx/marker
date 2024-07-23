import * as vscode from "vscode";
import { InMemoryMessageQueue } from "../mq";
import {
    IHighlightChangeMessage,
    topicHighlightAdd,
    topicHighlightRemove,
} from "../highlight";
import { ExplorerBase } from "./base";
import { SearchFilter } from "./filter";

/**
 * HighlightExplorer
 */
export class HighlightExplorer
    extends ExplorerBase
    implements vscode.TreeDataProvider<vscode.TreeItem>
{
    private mq: InMemoryMessageQueue;
    private highlights: Map<string, HighlightItem>;
    private filter: SearchFilter;

    constructor(mq: InMemoryMessageQueue) {
        super();
        this.highlights = new Map();
        this.filter = new SearchFilter(mq, this.fire.bind(this));

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
        return Array.from(this.highlights.values())
            .map(item => this.filter.filter(item))
            .filter((item) => item !== undefined) as vscode.TreeItem[];
    }
}

class HighlightItem extends vscode.TreeItem {
    // should equal to when clause of acitivity bar
    static contextValue = "highlight_item";

    constructor(name: string) {
        super({ label: name } as vscode.TreeItemLabel);

        this.contextValue = HighlightItem.contextValue;
        this.tooltip = name;
    }
}
