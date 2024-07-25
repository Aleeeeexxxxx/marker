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
import { MarkerDecorator } from "./decorator/marker";
import { SearchViewProvider } from "./explorer/search";

export function createComponents(): {
    mq: InMemoryMessageQueue;
    dispatcher: VscodeEventDispatcher;
    mmngr: MarkerMngr;
    mExplorer: MarkerExplorer;
    hmngr: HighlightMngr;
    hExplorer: HighlightExplorer;
    hDecorator: Decorator;
    mDecorator: MarkerDecorator;
} {
    const mq = new InMemoryMessageQueue();

    const dispatcher = new VscodeEventDispatcher(mq);

    const mmngr = new MarkerMngr(mq);
    const mExplorer = new MarkerExplorer(mq, mmngr);

    const hmngr = new HighlightMngr(mq);
    const hExplorer = new HighlightExplorer(mq);

    const hDecorator = new Decorator(mq, hmngr);
    const mDecorator = new MarkerDecorator(mq, mmngr);

    return {
        mq,
        dispatcher,
        mmngr,
        mExplorer,
        hmngr,
        hExplorer,
        hDecorator,
        mDecorator,
    };
}

export function activate(context: vscode.ExtensionContext) {
    configExtension();
    createOutputChannel();

    const {
        mq,
        dispatcher,
        mmngr,
        mExplorer,
        hmngr,
        hExplorer,
        hDecorator,
        mDecorator,
    } = createComponents();

    const persister = new Persister(context.workspaceState, mq, mmngr, hmngr);
    mmngr.deserialize(persister.getMarkers());
    hmngr.deserialize(persister.getHighlights());

    registerVSCodeExtensionCommands(mmngr, hmngr, context);

    context.subscriptions.push(
        vscode.window.onDidChangeActiveTextEditor(
            dispatcher.onDidChangeActiveTextEditor.bind(dispatcher)
        ),
        vscode.workspace.onDidChangeTextDocument(
            dispatcher.onDidChangeTextDocument.bind(dispatcher)
        ),
        vscode.workspace.onDidChangeConfiguration(onConfigChange),

        vscode.window.registerWebviewViewProvider(
            "searchView",
            new SearchViewProvider(mq)
        )
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
