import * as vscode from "vscode";
import { ActivityBar } from "./plugin/activityBar";
import { Decorator } from "./plugin/decorator";
import { LogLevel, extensionOutputChannel, logger } from "./logger";
import { registerVSCodeExtensionCommands } from "./commands";
import { MarkerManager } from "./markerMngr";
import { DelayRunner } from "./utils";

export function activate(context: vscode.ExtensionContext) {
    logger.setLogLevel(LogLevel.DEBUG);
    extensionOutputChannel.show();

    logger.info("extension activited!");

    const mngr = new MarkerManager();
    const activityBarProvider = new ActivityBar();
    const onDidChangeRunner = new DelayRunner(500, mngr.reset.bind(mngr));

    mngr.register(new Decorator(mngr), activityBarProvider);

    registerVSCodeExtensionCommands(context, mngr);

    vscode.window.registerTreeDataProvider(
        "marker_activitybar_explorer",
        activityBarProvider
    );

    context.subscriptions.push(
        vscode.window.onDidChangeActiveTextEditor((editor) => {
            const uri = editor?.document.uri;
            // ignore the change of output channel
            if (uri === undefined || !isFileURI(uri)) {
                return;
            }
            if (!mngr.compareUriOrSet(uri)) {
                logger.info(`editor changed, current=${uri.toString()}`);
                mngr.reset(editor);
            }
        }),

        vscode.workspace.onDidChangeTextDocument((event) => {
            // ignore the change of output channel
            if (!isFileURI(event?.document.uri)) {
                return;
            }

            const editor = vscode.window.activeTextEditor;
            if (event.document.uri !== editor?.document.uri) {
                return;
            }

            onDidChangeRunner.run();
        })
    );
}

// This method is called when your extension is deactivated
export function deactivate() {}

function isFileURI(uri: vscode.Uri | undefined): boolean {
    if (uri === undefined) {
        return false;
    }
    return uri.toString().startsWith("file://");
}
