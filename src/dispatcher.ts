import * as vscode from "vscode";
import { InMemoryMessageQueue } from "./mq";

export const topics = {
    changeActiveTextEditor: "marker.activeTextEditor.change",
    changeTextDocument: "marker.textDocument.change",
};

export interface IChangeActiveTextEditorMessage {}
export interface IChangeTextDocumentMessage {
    event: vscode.TextDocumentChangeEvent;
}

// dispatch vscode event
export class VscodeEventDispatcher {
    constructor(private mq: InMemoryMessageQueue) {}

    onDidChangeActiveTextEditor(editor?: vscode.TextEditor) {
        this.mq.publish(topics.changeActiveTextEditor, {});
    }

    onDidChangeTextDocument(event: vscode.TextDocumentChangeEvent) {
        this.mq.publish(topics.changeTextDocument, { event });
    }
}
