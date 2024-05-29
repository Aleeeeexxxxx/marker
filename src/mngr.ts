import { IPlugin, IPluginEvent, PluginManager } from "./plugin";
import * as vscode from "vscode";
import { logger } from "./logger";
import { DelayRunner } from "./utils";
import { HighlightImpl } from "./impl/highlight";
import { MarkerImpl } from "./impl/marker";

export enum MarkerEventType {
    POST_ADD,
    POST_REMOVE,
    RESET,

    POST_ADD_MARKER,
    POST_RESET_MARKER,
    POST_DELETE_MARKER,
}

export interface IMarkerEventPayload {
    marker?: string;
    event: MarkerEventType;
}
export type MarkerEvent = IPluginEvent<IMarkerEventPayload>;

export type MarkerPlugin = IPlugin<IMarkerEventPayload>;

export class MarkerManager extends PluginManager<IMarkerEventPayload> {
    public highlight: HighlightImpl;
    public marker: MarkerImpl;
    private onDidChangeDelayRunner: DelayRunner;

    constructor() {
        super();
        this.onDidChangeDelayRunner = new DelayRunner(
            500,
            this._onTextDocumentChange.bind(this)
        );
        this.highlight = new HighlightImpl();
        this.marker = new MarkerImpl();
    }

    addMarker() {
        if (!vscode.window.activeTextEditor) {
            return;
        }

        this.marker.add(vscode.window.activeTextEditor);
        this.publish({ event: MarkerEventType.POST_ADD_MARKER });
    }

    removeMarker(token: string, uri: string) {
        this.marker.remove(token, uri);
        this.publish({ event: MarkerEventType.POST_DELETE_MARKER });
    }

    addHighlight(token: string) {
        if (this.highlight.add(token)) {
            this.publish({ marker: token, event: MarkerEventType.POST_ADD });
        }
    }

    removeHighlight(token: string) {
        if (this.highlight.remove(token)) {
            this.publish({
                marker: token,
                event: MarkerEventType.POST_REMOVE,
            });
        }
    }

    onActiveEditorChange(editor?: vscode.TextEditor) {
        if (!editor) {
            return;
        }
        if (!this.isFileURI(editor.document.uri)) {
            return;
        }

        this.highlight.reset();
        this.publish({ event: MarkerEventType.RESET });
    }

    onTextDocumentChange(event: vscode.TextDocumentChangeEvent) {
        // ignore the change of output channel
        if (!this.isFileURI(event?.document.uri)) {
            return;
        }

        if (this.marker.onTextDocumentChange(event)) {
            this.publish({ event: MarkerEventType.POST_RESET_MARKER });
        }

        const editor = vscode.window.activeTextEditor;
        if (event.document.uri !== editor?.document.uri) {
            return;
        }

        logger.debug(`text document change: ${JSON.stringify(event)}`);
        this.onDidChangeDelayRunner.run();
    }

    _onTextDocumentChange() {
        if (this.highlight.reset()) {
            this.publish({ event: MarkerEventType.RESET });
        }
    }

    isFileURI(uri: vscode.Uri | undefined): boolean {
        if (uri === undefined) {
            return false;
        }
        return uri.toString().startsWith("file://");
    }
}
