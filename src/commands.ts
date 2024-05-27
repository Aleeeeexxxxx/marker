import { logger } from "./logger";
import { MarkerManager } from "./markerMngr";
import * as vscode from "vscode";

interface IVScodeCommand {
    command: string;
    handler: (...args: any) => void;
}

export function registerVSCodeExtensionCommands(
    context: vscode.ExtensionContext,
    mngr: MarkerManager
) {
    const commands: IVScodeCommand[] = [
        {
            command: "marker.editor.menu.mark.highlight",
            handler: () => {
                if (!vscode.window.activeTextEditor) {
                    return;
                }
                const { document, selection } = vscode.window.activeTextEditor;
                const selected = document.getText(selection);
                if (selected.length === 0) {
                    vscode.window.showInformationMessage("Highlight requires selection.");
                    return;
                }
                mngr.add(selected);
            },
        },
        {
            command: "marker.editor.menu.mark.remove",
            handler: () => {
                if (!vscode.window.activeTextEditor) {
                    return;
                }
                const { document, selection } = vscode.window.activeTextEditor;
                mngr.remove(document.getText(selection));
            },
        },
        {
            command: "marker.activitybar.remove",
            handler: (...args) => {
                logger.debug(
                    `args for marker.activitybar.remove: ${JSON.stringify(
                        args
                    )}`
                );
                const { label } = args[0][0] as { label: string };
                mngr.remove(label);
            },
        },
    ];

    commands.forEach((cmd) => {
        context.subscriptions.push(
            vscode.commands.registerCommand(cmd.command, (...args: any[]) => {
                logger.debug(`command triggered, ${cmd.command}`);
                cmd.handler(args);
            })
        );
    });
}
