import * as vscode from "vscode";
import { cmdGoToLineInFile } from "../commands";
import {
    MarkerItem,
    MarkerMngr,
    topicMarkerAdd,
    topicMarkerRemove,
    topicMarkerReset,
} from "../marker";
import { ExplorerBase } from "./base";
import { InMemoryMessageQueue } from "../mq";
import { SearchFilter } from "./filter";

/**
 * HighlightExplorer
 */
export class MarkerExplorer
    extends ExplorerBase
    implements vscode.TreeDataProvider<MarkerExplorerItem>
{
    private mq: InMemoryMessageQueue;
    private mngr: MarkerMngr;
    private filter: SearchFilter;

    constructor(mq: InMemoryMessageQueue, marker: MarkerMngr) {
        super();
        this.mngr = marker;
        this.filter = new SearchFilter(mq, this.fire.bind(this));

        this.mq = mq;
        this.mq.subscribe(topicMarkerReset, this.eventHandler.bind(this));

        this.mq.subscribe(topicMarkerAdd, this.eventHandler.bind(this));
        this.mq.subscribe(topicMarkerRemove, this.eventHandler.bind(this));
    }

    async eventHandler(msg: any) {
        this.fire();
        msg.commit();
    }

    /**
     * Implement vscode.TreeDataProvider
     */

    getTreeItem(
        element: MarkerExplorerItem
    ): vscode.TreeItem | Thenable<vscode.TreeItem> {
        return element;
    }

    getChildren(
        element?: MarkerExplorerItem | undefined
    ): vscode.ProviderResult<MarkerExplorerItem[]> {
        const array = new Array<MarkerExplorerItem>();
        this.mngr.__markers.forEach((val, uri) => {
            val.forEach((item) =>
                array.push(new MarkerExplorerItem(uri, item))
            );
        });

        return array
            .map((item) => this.filter.filter(item))
            .filter((item) => item !== undefined) as MarkerExplorerItem[];
    }
}

export class MarkerExplorerItem extends vscode.TreeItem {
    // should equal to when clause of acitivity bar
    static contextValue = "marker_item";

    public uri: string;
    public token: string;

    constructor(uri: string, item: MarkerItem) {
        const label = item.token;
        super({ label } as vscode.TreeItemLabel);

        this.uri = uri;
        this.token = item.token;

        this.id = this.getID();
        this.contextValue = MarkerExplorerItem.contextValue;
        this.command = {
            title: "open file",
            command: cmdGoToLineInFile,
            arguments: [uri, item.token],
        };
        this.description = MarkerExplorerItem.getLabel(uri, item);
    }

    static getLabel(uri: string, item: MarkerItem): string {
        return `${getFileName(uri)}#${item.position.line + 1}`;
    }

    getID(): string {
        return `${this.token}%%${this.uri}`;
    }
}

function getFileName(uri: string): string {
    const items = uri.split("/");
    return items.at(items.length - 1) as string;
}
