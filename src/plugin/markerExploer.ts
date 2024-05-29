import * as vscode from "vscode";
import {
    MarkerEvent,
    MarkerEventType,
    MarkerManager,
    MarkerPlugin,
} from "../mngr";
import { logger } from "../logger";
import { cmdGoToLineInFile } from "../commands";

/**
 * HighlightExplorer
 */
export class MarkerExplorer
    implements MarkerPlugin, vscode.TreeDataProvider<MarkerItem>
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
        element: MarkerItem
    ): vscode.TreeItem | Thenable<vscode.TreeItem> {
        return element;
    }

    getChildren(
        element?: MarkerItem | undefined
    ): vscode.ProviderResult<MarkerItem[]> {
        const array = new Array<MarkerItem>();
        this.mngr.marker.__markers.forEach((val, uri) => {
            val.forEach((item) => {
                if (!item.broken) {
                    array.push(
                        new MarkerItem(
                            item.token +
                                " \r\n " +
                                getFileName(uri) +
                                "#" +
                                item.position.line,
                            uri,
                            item.position.line,
                            item.token
                        )
                    );
                }
            });
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

class MarkerItem extends vscode.TreeItem {
    // should equal to when clause of acitivity bar
    static contextValue = "marker_item";

    public uri: string;
    public token: string;

    constructor(label: string, uri: string, line: number, token: string) {
        super(label);

        this.contextValue = MarkerItem.contextValue;
        this.tooltip = label;
        this.id = `${token}##${uri}`;
        this.uri = uri;
        this.token = token;

        this.command = {
            title: "open file",
            command: cmdGoToLineInFile,
            arguments: [uri.substring("file://".length), line],
        };
    }
}

function getFileName(uri: string): string {
    const items = uri.split("/");
    return items.at(items.length - 1) as string;
}
