import { HighlightMngr } from "./highlight";
import { logger } from "./logger";
import * as vscode from "vscode";
import { MarkerMngr } from "./marker";

export const cmdGoToLineInFile = "marker.base.gotoLineInFile";

interface IVScodeCommand {
    command: string;
    handler: (...args: any) => void;
}

export function registerVSCodeExtensionCommands(
    context: vscode.ExtensionContext,
    mmngr: MarkerMngr,
    hmngr: HighlightMngr
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
                hmngr.add(selected);
            },
        },
        {
            command: "marker.editor.menu.mark.mark",
            handler: async () => {
                if (!vscode.window.activeTextEditor) {
                    return;
                }

                mmngr.add(vscode.window.activeTextEditor);
            },
        },
        {
            command: "marker.editor.menu.mark.remove",
            handler: () => {
                if (!vscode.window.activeTextEditor) {
                    return;
                }
                const { document, selection } = vscode.window.activeTextEditor;
                hmngr.remove(document.getText(selection));
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
                const { label } = args[0][0] as { label: vscode.TreeItemLabel };
                hmngr.remove(label.label);
            },
        },
        {
            command: "marker.activitybar.marker.remove",
            handler: (...args) => {
                logger.debug(
                    `args for marker.activitybar.marker.remove: ${JSON.stringify(
                        args
                    )}`
                );
                const { token, uri } = args[0][0] as {
                    token: string;
                    uri: string;
                };
                mmngr.remove(token, uri);
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
