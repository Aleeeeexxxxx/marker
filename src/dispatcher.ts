import * as vscode from "vscode";
import { VscodeUtils } from "./utils";
import { InMemoryMessageQueue } from "./mq";
import { logger } from "./logger";

export const topicChangeActiveTextEditor =
    "marker.dispatcher.changeActiveTextEditor";
export interface IChangeActiveTextEditorMessage {
    uri: string;
}

export const topicChangeTextDocument = "marker.dispatcher.changeTextDocument";
export interface IChangeRange {
    start: number;
    end: number;
    changed: number;
}
export interface IChangeTextDocumentMessage {
    event: vscode.TextDocumentChangeEvent;
}

export class VscodeEventDispatcher {
    private mq: InMemoryMessageQueue;

    constructor(mq: InMemoryMessageQueue) {
        this.mq = mq;
    }

    onDidChangeActiveTextEditor(editor?: vscode.TextEditor) {
        const uri = editor ? editor.document.uri.toString() : "";
        logger.debug(`editor changed, new=${uri}.`);

        if (!editor || !VscodeUtils.isFileUri(uri)) {
            logger.debug(`editor change event ignored.`);
            return;
        }

        this.mq.publish(topicChangeActiveTextEditor, {
            uri,
        } as IChangeActiveTextEditorMessage);
    }

    onDidChangeTextDocument(event: vscode.TextDocumentChangeEvent) {
        if (VscodeUtils.isFileUri(event.document.uri.toString())) {
            logger.debug(`text document change: ${JSON.stringify(event)}`);
            this.mq.publish(topicChangeTextDocument, { event });
        }
    }
}
