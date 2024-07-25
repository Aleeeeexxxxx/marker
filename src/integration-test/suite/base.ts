import { SearchViewProvider } from "../../explorer/search";
import { createComponents } from "../../extension";
import {
    getVSCodeExtensionCommands,
    IVScodeCommand,
    registerVSCodeExtensionCommands,
} from "../../commands";

import * as vscode from "vscode";
import * as assert from "assert";

export const {
    mq,
    dispatcher,
    mmngr,
    mExplorer,
    hmngr,
    hExplorer,
    hDecorator,
    mDecorator,
} = createComponents();

const searchView = new SearchViewProvider(mq);

export interface IIntegrationTestStep {
    run(): Promise<boolean>;
}

export class StepOpenTextDocument implements IIntegrationTestStep {
    private file: string;

    constructor(file: string) {
        this.file = file;
    }

    async run(): Promise<boolean> {
        const document = await vscode.workspace.openTextDocument(this.file);
        await vscode.window.showTextDocument(document);
        return true;
    }
}

export class StepSelectInTextDocument implements IIntegrationTestStep {
    private start: number;
    private end: number;

    constructor(start: number, end: number) {
        this.start = start;
        this.end = end;
    }

    async run(): Promise<boolean> {
        const editor = vscode.window.activeTextEditor!;
        editor.selection = new vscode.Selection(
            editor.document.positionAt(this.start),
            editor.document.positionAt(this.end)
        );
        return true;
    }
}

export class StepExecuteCommand implements IIntegrationTestStep {
    static commands: IVScodeCommand[] | undefined;
    private command: string;

    constructor(command: string) {
        this.command = command;
    }

    async run(): Promise<boolean> {
        const command = this.search();
        await command.handler();
        return true;
    }

    private search(): IVScodeCommand {
        if (!StepExecuteCommand.commands) {
            StepExecuteCommand.commands = getVSCodeExtensionCommands(
                mmngr,
                hmngr
            );
        }

        for (var i = 0; i < StepExecuteCommand.commands.length; i++) {
            const command = StepExecuteCommand.commands[i];
            if (command.command === this.command) {
                return command;
            }
        }

        throw new Error(`invalid command: ${this.command}`);
    }
}

export class StepValidateHighlightItemIfExist implements IIntegrationTestStep {
    private token: string;

    constructor(token: string) {
        this.token = token;
    }
    async run(): Promise<boolean> {
        let exist = false;
        (hExplorer.getChildren() as vscode.TreeItem[]).forEach(
            (item) =>
                (exist =
                    exist ||
                    (item.label as vscode.TreeItemLabel).label === this.token)
        );

        return exist;
    }
}
