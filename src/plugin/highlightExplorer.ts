import * as vscode from "vscode";
import { MarkerEvent, MarkerEventType, MarkerPlugin } from "../mngr";
import { ExplorerBase } from "./base";

/**
 * HighlightExplorer
 */
export class HighlightExplorer
    extends ExplorerBase
    implements MarkerPlugin, vscode.TreeDataProvider<vscode.TreeItem>
{
    private highlights: Map<string, HighlightItem> = new Map();

    /**
     * Implement vscode.TreeDataProvider
     */

    constructor() {
        super();

        this.registerTypeHandler(
            MarkerEventType.POST_ADD_HIGHLIGHT,
            this.onPostAddHighlight.bind(this)
        );
        this.registerTypeHandler(
            MarkerEventType.POST_REMOVE_HIGHLIGHT,
            this.onPostRemoveHighlight.bind(this)
        );
    }

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

    onPostAddHighlight(event: MarkerEvent) {
        const marker = event.payload.marker as string;
        this.highlights.set(marker, new HighlightItem(marker));
    }

    onPostRemoveHighlight(event: MarkerEvent) {
        const marker = event.payload.marker as string;
        this.highlights.delete(marker);
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
