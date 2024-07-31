import { HighlightMngr } from "./highlight";
import { logger } from "./logger";
import * as vscode from "vscode";
import { MarkerMngr } from "./marker";
import { MarkerExplorerItem } from "./explorer/marker";
import { VscodeUtils } from "./utils";

export const cmdGoToLineInFile = "marker.base.gotoLineInFile";

export interface IVScodeCommand {
    command: string;
    handler: (...args: any) => Promise<void>;
}

export function getVSCodeExtensionCommands(
    mmngr: MarkerMngr,
    hmngr: HighlightMngr
): IVScodeCommand[] {
    return [
        {
            command: "marker.editor.menu.mark.highlight",
            handler: async () => {
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
            handler: async () => {
                if (!vscode.window.activeTextEditor) {
                    return;
                }
                const { document, selection } = vscode.window.activeTextEditor;
                hmngr.remove(document.getText(selection));
            },
        },
        {
            command: "marker.activitybar.highlight.remove",
            handler: async (...args) => {
                logger.debug(
                    `args for marker.activitybar.highlight.remove: ${JSON.stringify(
                        args
                    )}`
                );
                const { label } = args[0][0] as vscode.TreeItem;
                hmngr.remove((label as vscode.TreeItemLabel).label);
            },
        },
        {
            command: "marker.activitybar.marker.remove",
            handler: async (...args) => {
                logger.debug(
                    `args for marker.activitybar.marker.remove: ${JSON.stringify(
                        args
                    )}`
                );
                const { token, uri } = args[0][0] as MarkerExplorerItem;
                mmngr.remove(token, uri);
            },
        },
        {
            command: cmdGoToLineInFile,
            handler: async (...args) => {
                // passed by src/plugin/markerExploer.ts#98
                const uri = args[0][0] as string;
                const token = args[0][1] as string;

                const document = await vscode.workspace.openTextDocument(
                    VscodeUtils.getFileAbsolutePath(uri)
                );
                const editor = await vscode.window.showTextDocument(document);
                const tokenStartAt = mmngr.getPosition(uri, token);
                logger.error(`no such token, ${uri}, ${token}`);

                if (tokenStartAt) {
                    const position = document.positionAt(tokenStartAt);
                    editor.selection = new vscode.Selection(position, position);
                    editor.revealRange(new vscode.Range(position, position));
                }
            },
        },
    ];
}

export function registerVSCodeExtensionCommands(
    mmngr: MarkerMngr,
    hmngr: HighlightMngr,
    context?: vscode.ExtensionContext
) {
    const commands = getVSCodeExtensionCommands(mmngr, hmngr);
    commands.forEach((cmd) => {
        const disposable = vscode.commands.registerCommand(
            cmd.command,
            (...args: any[]) => {
                logger.debug(`command triggered, ${cmd.command}`);
                cmd.handler(args);
            }
        );
        context?.subscriptions.push(disposable);
    });
}
