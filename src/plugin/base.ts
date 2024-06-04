import { logger } from "../logger";
import { MarkerEvent, MarkerEventType } from "../mngr";
import * as vscode from "vscode";

export type EventHandler = (event: MarkerEvent) => void;

export class PluginBase {
    protected eventHandler: Map<MarkerEventType, EventHandler> = new Map();

    registerTypeHandler(_type: MarkerEventType, handler: EventHandler) {
        this.eventHandler.set(_type, handler);
    }

    handleEvent(event: MarkerEvent): void {
        const handler = this.eventHandler.get(event.payload.event);
        if (handler) {
            try {
                handler(event);
            } catch (e) {
                logger.error(e as Error);
            }
        }
    }
}

export class ExplorerBase extends PluginBase {
    private _onDidChangeTreeData: vscode.EventEmitter<undefined> =
        new vscode.EventEmitter<undefined>();

    readonly onDidChangeTreeData: vscode.Event<undefined> =
        this._onDidChangeTreeData.event;

    handleEvent(event: MarkerEvent): void {
        super.handleEvent(event);
        this._onDidChangeTreeData.fire(undefined);
    }
}
