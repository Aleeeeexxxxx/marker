import * as vscode from "vscode";
import { VscodeUtils } from "./utils";
import { InMemoryMessageQueue } from "./mq";
import { logger } from "./logger";

export const topicChangeActiveTextEditor =
    "marker.dispatcher.changeActiveTextEditor";
export interface IChangeActiveTextEditorMessage {}

export const topicChangeTextDocument = "marker.dispatcher.changeTextDocument";
export interface IChangeRange {
    start: number;
    end: number;
    changed: number;
}
export interface IChangeTextDocumentMessage {
    document: vscode.TextDocument;
    range: IChangeRange[];
}

export class VscodeEventDispatcher {
    private mq: InMemoryMessageQueue;

    constructor(mq: InMemoryMessageQueue) {
        this.mq = mq;
    }

    onDidChangeActiveTextEditor(editor?: vscode.TextEditor) {
        logger.debug(`editor changed, new=${editor?.document.uri.toString()}.`);

        if (!editor || VscodeUtils.isFileUri(editor.document.uri.toString())) {
            logger.debug(`editor changed event ignored.`);
            return;
        }

        this.mq.publish(
            topicChangeActiveTextEditor,
            {} as IChangeActiveTextEditorMessage
        );
    }

    onDidChangeTextDocument(event: vscode.TextDocumentChangeEvent) {
        logger.debug(`text document change: ${JSON.stringify(event)}`);

        const range: IChangeRange[] = [];
        const document = event.document;

        event.contentChanges.forEach((change) => {
            const start = document.offsetAt(change.range.start);
            const end = document.offsetAt(change.range.end);
            const changed = change.text.length - (end - start);

            range.push({ start, end, changed });
        });

        this.mq.publish(topicChangeTextDocument, { document, range });
    }
}
