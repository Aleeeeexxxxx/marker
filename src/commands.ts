import { logger } from "./logger";
import { MarkerManager } from "./mngr";
import * as vscode from "vscode";

export const cmdGoToLineInFile = "marker.base.gotoLineInFile";

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
                    vscode.window.showInformationMessage(
                        "Highlight requires selection."
                    );
                    return;
                }
                mngr.addHighlight(selected);
            },
        },
        {
            command: "marker.editor.menu.mark.mark",
            handler: mngr.addMarker.bind(mngr),
        },
        {
            command: "marker.editor.menu.mark.remove",
            handler: () => {
                if (!vscode.window.activeTextEditor) {
                    return;
                }
                const { document, selection } = vscode.window.activeTextEditor;
                mngr.removeHighlight(document.getText(selection));
            },
        },
        {
            command: "marker.activitybar.highlight.remove",
            handler: (...args) => {
                logger.debug(
                    `args for marker.activitybar.highlight.remove: ${JSON.stringify(
                        args
                    )}`
                );
                const { label } = args[0][0] as { label: string };
                mngr.removeHighlight(label);
            },
        },
        {
            command: "marker.activitybar.marker.remove",
            handler: (...args) => {
                logger.debug(
                    `args for marker.activitybar.highlight.remove: ${JSON.stringify(
                        args
                    )}`
                );
                const { token, uri } = args[0][0] as {
                    token: string;
                    uri: string;
                };
                mngr.removeMarker(token, uri);
            },
        },
        {
            command: cmdGoToLineInFile,
            handler: async (...args) => {
                // passed by src/plugin/markerExploer.ts#98
                const file = args[0][0] as string;
                const position = args[0][1] as vscode.Position;

                const document = await vscode.workspace.openTextDocument(file);
                const editor = await vscode.window.showTextDocument(document);
                editor.selection = new vscode.Selection(position, position);
                editor.revealRange(new vscode.Range(position, position));
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
