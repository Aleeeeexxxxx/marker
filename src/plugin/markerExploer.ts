import * as vscode from "vscode";
import {
    MarkerEventType,
    MarkerManager,
    MarkerPlugin,
} from "../mngr";
import { cmdGoToLineInFile } from "../commands";
import { MarkerItem } from "../impl/marker";
import { ExplorerBase } from "./base";

/**
 * HighlightExplorer
 */
export class MarkerExplorer
    extends ExplorerBase
    implements MarkerPlugin, vscode.TreeDataProvider<MarkerExplorerItem>
{
    constructor(private mngr: MarkerManager) {
        super();

        this.registerEmptyHandler(
            MarkerEventType.POST_ADD_MARKER,
            MarkerEventType.POST_DELETE_MARKER,
            MarkerEventType.POST_RESET_MARKER
        );
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

    private registerEmptyHandler(..._types: MarkerEventType[]) {
        _types.forEach((_type) => this.registerTypeHandler(_type, () => {}));
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
