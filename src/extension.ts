import * as vscode from "vscode";
import { HighlightExplorer } from "./plugin/highlightExplorer";
import { Decorator } from "./plugin/decorator";
import { LogLevel, logger } from "./logger";
import { registerVSCodeExtensionCommands } from "./commands";
import { MarkerManager } from "./markerMngr";
import { DelayRunner } from "./utils";

export function activate(context: vscode.ExtensionContext) {
    const extensionOutputChannel =
        vscode.window.createOutputChannel("Easy Marker");
    extensionOutputChannel.show();

    logger.setLogLevel(LogLevel.DEBUG);
    logger.setOutput(
        extensionOutputChannel.appendLine.bind(extensionOutputChannel)
    );

    const mngr = new MarkerManager();
    const activityBarProvider = new HighlightExplorer();

    mngr.register(new Decorator(mngr), activityBarProvider);

    registerVSCodeExtensionCommands(context, mngr);
    registerEventHandlers(context, mngr);

    vscode.window.registerTreeDataProvider(
        "activitybar_highlight_explorer",
        activityBarProvider
    );

    logger.info("extension activited!");
}

// This method is called when your extension is deactivated
export function deactivate() {}

function isFileURI(uri: vscode.Uri | undefined): boolean {
    if (uri === undefined) {
        return false;
    }
    return uri.toString().startsWith("file://");
}

function registerEventHandlers(
    context: vscode.ExtensionContext,
    mngr: MarkerManager
) {
    const changeEditorHandler = vscode.window.onDidChangeActiveTextEditor(
        (editor) => {
            const uri = editor?.document.uri;
            // ignore the change of output channel
            if (uri === undefined || !isFileURI(uri)) {
                return;
            }
            if (!mngr.compareUriOrSet(uri)) {
                logger.info(`editor changed, current=${uri.toString()}`);
                mngr.resetHighlight(editor);
            }
        }
    );

    const onDidChangeRunner = new DelayRunner(500, mngr.resetHighlight.bind(mngr));
    const changeTextHandler = vscode.workspace.onDidChangeTextDocument(
        (event) => {
            // ignore the change of output channel
            if (!isFileURI(event?.document.uri)) {
                return;
            }

            const editor = vscode.window.activeTextEditor;
            if (event.document.uri !== editor?.document.uri) {
                return;
            }

            onDidChangeRunner.run();
        }
    );
    context.subscriptions.push(changeEditorHandler, changeTextHandler);
}
