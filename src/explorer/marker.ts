import * as vscode from "vscode";
import { cmdGoToLineInFile } from "../commands";
import {
    IMarkerChangeMessage,
    MarkerItem,
    MarkerMngr,
    topicMarkerChange,
} from "../marker";
import { ExplorerBase } from "./base";
import { InMemoryMessageQueue } from "../mq";

/**
 * HighlightExplorer
 */
export class MarkerExplorer
    extends ExplorerBase
    implements vscode.TreeDataProvider<MarkerExplorerItem>
{
    private mq: InMemoryMessageQueue;
    private markers: MarkerExplorerItem[];
    private mngr: MarkerMngr;

    constructor(mq: InMemoryMessageQueue, marker: MarkerMngr) {
        super();
        this.markers = [];
        this.mngr = marker;

        this.mq = mq;
        this.mq.subscribe(topicMarkerChange, async (msg) => {
            const array = new Array<MarkerExplorerItem>();
            this.mngr.__markers.forEach((val, uri) => {
                val.forEach((item) =>
                    array.push(new MarkerExplorerItem(uri, item))
                );
            });
            this.markers = array;
            
            this.fire();
            msg.commit();
        });
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
        return this.markers;
    }
}

class MarkerExplorerItem extends vscode.TreeItem {
    // should equal to when clause of acitivity bar
    static contextValue = "marker_item";

    public uri: string;
    public token: string;

    constructor(uri: string, item: MarkerItem) {
        const label = item.broken
            ? {
                  label: `[BROKEN]${item.token}`,
                  highlights: [[0, 8]] as [number, number][],
              }
            : item.token;
        super(label);

        this.uri = uri;
        this.token = item.token;

        this.id = this.getID();
        this.contextValue = MarkerExplorerItem.contextValue;
        this.command = {
            title: "open file",
            command: cmdGoToLineInFile,
            arguments: [getFileAbsolutePath(uri), item.position],
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

function getFileAbsolutePath(uri: string): string {
    return uri.substring("file://".length);
}
