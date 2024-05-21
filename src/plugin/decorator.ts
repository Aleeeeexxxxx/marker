import { logger } from "../logger";
import {
    IMarkerEvent,
    MarkerEventType,
    MarkerManager,
    MarkerPlugin,
} from "../markerMngr";
import { PluginEventContext } from "../plugin";
import * as vscode from "vscode";

/**
 * Decorator,  highlight selected words
 */
export class Decorator implements MarkerPlugin {
    constructor(private mngr: MarkerManager) {}

    private decoratedItems: Map<string, vscode.TextEditorDecorationType> =
        new Map<string, vscode.TextEditorDecorationType>();

    handle(context: PluginEventContext<IMarkerEvent>): void {
        const event = context.getEvent();

        switch (event.eventType) {
            case MarkerEventType.postAdd:
                vscode.window.activeTextEditor?.setDecorations(
                    this.getTextEditorDecorationType(),
                    this.mngr.highlights.get(event.marker) || []
                );
                break;
            case MarkerEventType.postRemove:
                break;
            default:
                logger.warn(`unknown event, type=${event.eventType}`);
                return;
        }
    }

    private getTextEditorDecorationType(): vscode.TextEditorDecorationType {
        return vscode.window.createTextEditorDecorationType({
            rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed,
            backgroundColor: "rgba(255, 255, 0, 0.3)",
            // color: "",
        });
    }
}
