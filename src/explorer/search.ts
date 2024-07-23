import * as vscode from "vscode";
import { logger } from "../logger";
import { InMemoryMessageQueue } from "../mq";

const webviewCommands = {
    search: "search",
    cancel: "cancel",
};

const searchHtml = `
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Search</title>
    <style>
        .button-container {
            display: flex;
            justify-content: flex-start;
            gap: 10px;
            /* between button */
            margin-top: 10px;
        }
    </style>
</head>

<body>
    <input type="text" id="search" placeholder="Search..." />
    <div class="button-container">
        <button onclick="search()">Search</button>
        <button onclick="cancel()">Cancel</button>
    </div>
    <p> You can search for the existing markers/highlights here.</p>
    <p> The results will be shown in the explorer below.</p>
    <p> Click "Cancel" to cancel the searching.</p>

    <script>
        const vscode = acquireVsCodeApi();
        function search() {
            const searchText = document.getElementById('search').value;
            vscode.postMessage({
                command: '${webviewCommands.search}',
                text: searchText
            });
        }

        function cancel() {
            const searchText = document.getElementById('search').value;
            vscode.postMessage({
                command: '${webviewCommands.cancel}'
            });
        }
    </script>
</body>
</html>`;

export interface ISearchChangeMessage {
    pattern: string;
}
export const topicSearchChange = "marker.search.change";

export class SearchViewProvider implements vscode.WebviewViewProvider {
    private mq: InMemoryMessageQueue;
    constructor(mq: InMemoryMessageQueue) {
        this.mq = mq;
    }

    resolveWebviewView(webviewView: vscode.WebviewView) {
        webviewView.webview.options = {
            enableScripts: true,
        };

        webviewView.webview.html = this.getHtmlContent();
        webviewView.webview.onDidReceiveMessage((message) => {
            switch (message.command) {
                case webviewCommands.search:
                    logger.info(`searching for: ${message.text}`);
                    this.changeSearchPattern(message.text);
                    break;
                case webviewCommands.cancel:
                    logger.info(`cancel searching`);
                    this.changeSearchPattern("");
                    return;
            }
        });
    }

    private getHtmlContent() {
        return searchHtml;
    }

    private changeSearchPattern(pattern: string) {
        this.mq.publish(topicSearchChange, {
            pattern: pattern,
        } as ISearchChangeMessage);
    }
}
