import * as vscode from "vscode";
import {
    IMarkerEventPayload,
    MarkerEvent,
    MarkerEventType,
    MarkerPlugin,
} from "../markerMngr";
import { logger } from "../logger";

/**
 * ActivityBar
 */
export class ActivityBar
    implements MarkerPlugin, vscode.TreeDataProvider<vscode.TreeItem>
{
    private highlights: Set<string> = new Set<string>();
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
        const array = new Array<vscode.TreeItem>();
        this.highlights.forEach((val) => array.push(new vscode.TreeItem(val)));
        return array;
    }

    /**
     * Implement MarkerPlguin
     */

    name(): string {
        return "Activity Bar";
    }

    handleEvent(event: MarkerEvent): void {
        const payload = event.payload;
        switch (payload.event) {
            case MarkerEventType.POST_ADD:
                this.highlights.add(payload.marker as string);
                break;
            case MarkerEventType.POST_REMOVE:
                this.highlights.delete(payload.marker as string);
                break;
            default:
                logger.warn(`ignore event, type=${payload.event}`);
                return;
        }

        this.refresh();
    }

    refresh() {
        this._onDidChangeTreeData.fire(undefined);
    }
}
