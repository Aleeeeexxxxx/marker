import * as vscode from "vscode";
import {
    MarkerEvent,
    MarkerEventType,
    MarkerPlugin,
} from "../mngr";
import { logger } from "../logger";

/**
 * HighlightExplorer
 */
export class HighlightExplorer
    implements MarkerPlugin, vscode.TreeDataProvider<vscode.TreeItem>
{
    private highlights: Map<string, HighlightItem> = new Map();
    private _onDidChangeTreeData: vscode.EventEmitter<undefined> =
        new vscode.EventEmitter<undefined>();

    /**
     * Implement vscode.TreeDataProvider
     */
    readonly onDidChangeTreeData: vscode.Event<undefined> =
        this._onDidChangeTreeData.event;

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

    /**
     * Implement MarkerPlguin
     */

    name(): string {
        return "Activity Bar";
    }

    handleEvent(event: MarkerEvent): void {
        const payload = event.payload;
        const marker = payload.marker as string;
        switch (payload.event) {
            case MarkerEventType.POST_ADD:
                this.highlights.set(marker, new HighlightItem(marker));
                break;
            case MarkerEventType.POST_REMOVE:
                this.highlights.delete(marker);
                break;
            default:
                logger.debug(
                    `activity bar ignore event, type=${payload.event}`
                );
                return;
        }

        this.refresh();
    }

    refresh() {
        this._onDidChangeTreeData.fire(undefined);
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
