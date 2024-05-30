import * as vscode from "vscode";
import {
    MarkerEvent,
    MarkerEventType,
    MarkerManager,
    MarkerPlugin,
} from "../mngr";
import { logger } from "../logger";
import { cmdGoToLineInFile } from "../commands";
import { MarkerItem } from "../impl/marker";

/**
 * HighlightExplorer
 */
export class MarkerExplorer
    implements MarkerPlugin, vscode.TreeDataProvider<MarkerExplorerItem>
{
    private _onDidChangeTreeData: vscode.EventEmitter<undefined> =
        new vscode.EventEmitter<undefined>();

    constructor(private mngr: MarkerManager) {}

    /**
     * Implement vscode.TreeDataProvider
     */
    readonly onDidChangeTreeData: vscode.Event<undefined> =
        this._onDidChangeTreeData.event;

    getTreeItem(
        element: MarkerExplorerItem
    ): vscode.TreeItem | Thenable<vscode.TreeItem> {
        return element;
    }

    getChildren(
        element?: MarkerExplorerItem | undefined
    ): vscode.ProviderResult<MarkerExplorerItem[]> {
        const array = new Array<MarkerExplorerItem>();
        this.mngr.marker.__markers.forEach((val, uri) => {
            val.forEach((item) =>
                array.push(new MarkerExplorerItem(uri, item))
            );
        });
        return array;
    }

    /**
     * Implement MarkerPlguin
     */

    name(): string {
        return "Marker Explorer";
    }

    handleEvent(event: MarkerEvent): void {
        const payload = event.payload;
        const marker = payload.marker as string;
        switch (payload.event) {
            case MarkerEventType.POST_ADD_MARKER:
                break;
            case MarkerEventType.POST_RESET_MARKER:
                break;
            case MarkerEventType.POST_DELETE_MARKER:
                break;
            default:
                logger.debug(
                    `marker explorer ignore event, type=${payload.event}`
                );
                return;
        }

        this.refresh();
    }

    refresh() {
        this._onDidChangeTreeData.fire(undefined);
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
        return `${getFileAbsolutePath(uri)}#${item.position.line + 1}`;
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
