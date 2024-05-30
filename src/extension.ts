import * as vscode from "vscode";
import { HighlightExplorer } from "./plugin/highlightExplorer";
import { Decorator } from "./plugin/decorator";
import { LogLevel, logger } from "./logger";
import { registerVSCodeExtensionCommands } from "./commands";
import { MarkerManager } from "./mngr";
import { MarkerExplorer } from "./plugin/markerExploer";

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
    const markerExplorer = new MarkerExplorer(mngr);

    mngr.register(new Decorator(mngr), activityBarProvider, markerExplorer);

    registerVSCodeExtensionCommands(context, mngr);
    
    context.subscriptions.push(
        vscode.window.onDidChangeActiveTextEditor((editor) =>
            mngr.onActiveEditorChange(editor)
        ),
        vscode.workspace.onDidChangeTextDocument((event) =>
            mngr.onTextDocumentChange(event)
        )
    );

    vscode.window.registerTreeDataProvider(
        "activitybar_highlight_explorer",
        activityBarProvider
    );
    vscode.window.registerTreeDataProvider(
        "activitybar_marker_explorer",
        markerExplorer
    );

    logger.info("extension activited!");
}

// This method is called when your extension is deactivated
export function deactivate() {}
