import * as vscode from "vscode";
import { IMarkerEvent, MarkerEventType, MarkerPlugin } from "../markerMngr";
import { PluginEventContext } from "../plugin";
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
    handle(context: PluginEventContext<IMarkerEvent>): void {
        const event = context.getEvent();

        switch (event.eventType) {
            case MarkerEventType.postAdd:
                this.highlights.add(event.marker);
                break;
            case MarkerEventType.postRemove:
                this.highlights.delete(event.marker);
                break;
            default:
                logger.warn(`unknown event, type=${event.eventType}`);
                return;
        }

        this.refresh();
    }

    refresh() {
        this._onDidChangeTreeData.fire(undefined);
    }
}
