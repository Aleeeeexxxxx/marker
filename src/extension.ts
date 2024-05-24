import * as vscode from "vscode";
import { ActivityBar } from "./plugin/activityBar";
import { Decorator } from "./plugin/decorator";
import { LogLevel, logger } from "./logger";
import { registerVSCodeExtensionCommands } from "./commands";
import { MarkerManager } from "./markerMngr";
import { DelayRunner } from "./utils";

export function activate(context: vscode.ExtensionContext) {
    logger.setLogLevel(LogLevel.DEBUG);

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
        vscode.window.onDidChangeActiveTextEditor((editor) => mngr.reset()),

        vscode.workspace.onDidChangeTextDocument((event) => {
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
