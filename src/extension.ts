import * as vscode from "vscode";
import { LogLevel, logger } from "./logger";
import { registerVSCodeExtensionCommands } from "./commands";
import { MarkerMngr } from "./marker";
import { InMemoryMessageQueue } from "./mq";
import { MarkerExplorer } from "./explorer/marker";
import { HighlightMngr } from "./highlight";
import { HighlightExplorer } from "./explorer/highlight";
import { VscodeEventDispatcher } from "./dispatcher";
import { Decorator } from "./decorator/highlight";
import { Persister } from "./persister";

export function activate(context: vscode.ExtensionContext) {
    configExtension();
    createOutputChannel();

    const mq = new InMemoryMessageQueue();

    const dispatcher = new VscodeEventDispatcher(mq);

    const mmngr = new MarkerMngr(mq);
    const mExplorer = new MarkerExplorer(mq, mmngr);

    const hmngr = new HighlightMngr(mq);
    const hExplorer = new HighlightExplorer(mq);

    const _ = new Decorator(mq, hmngr);

    const persister = new Persister(context.workspaceState, mq, mmngr, hmngr);
    mmngr.deserialize(persister.getMarkers());
    hmngr.deserialize(persister.getHighlights());

    registerVSCodeExtensionCommands(context, mmngr, hmngr);

    context.subscriptions.push(
        vscode.window.onDidChangeActiveTextEditor(
            dispatcher.onDidChangeActiveTextEditor.bind(dispatcher)
        ),
        vscode.workspace.onDidChangeTextDocument(
            dispatcher.onDidChangeTextDocument.bind(dispatcher)
        ),
        vscode.workspace.onDidChangeConfiguration(onConfigChange)
    );

    vscode.window.registerTreeDataProvider(
        "activitybar_highlight_explorer",
        hExplorer
    );
    vscode.window.registerTreeDataProvider(
        "activitybar_marker_explorer",
        mExplorer
    );

    logger.info("extension activited!");
}

function configExtension(): void {
    const config = vscode.workspace.getConfiguration("marker");
    logger.setLogLevel(config.get<{ level: string }>("log")?.level as string);
}

function createOutputChannel(): void {
    const extensionOutputChannel =
        vscode.window.createOutputChannel("Easy Marker");
    extensionOutputChannel.show();

    logger.setOutput(
        extensionOutputChannel.appendLine.bind(extensionOutputChannel)
    );
}

function onConfigChange(event: vscode.ConfigurationChangeEvent): void {
    if (event.affectsConfiguration("marker.log.level")) {
        configExtension();
    }
}

// This method is called when your extension is deactivated
export function deactivate() {}
