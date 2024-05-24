import { IPlugin, IPluginEvent, PluginManager } from "./plugin";
import * as vscode from "vscode";
import { logger } from "./logger";

const MAX_ITEMS = 10;

export enum MarkerEventType {
    POST_ADD,
    POST_REMOVE,
    RESET,
}

export interface IMarkerEventPayload {
    marker?: string;
    event: MarkerEventType;
}
export type MarkerEvent = IPluginEvent<IMarkerEventPayload>;

export type MarkerPlugin = IPlugin<IMarkerEventPayload>;

export class MarkerManager extends PluginManager<IMarkerEventPayload> {
    public highlights: Map<string, Array<vscode.Range>> = new Map<
        string,
        Array<vscode.Range>
    >();

    add(marker: string) {
        if (this.highlights.size >= MAX_ITEMS) {
            vscode.window.showInformationMessage(
                "The number of markers exceeds the limit."
            );
            return;
        }

        if (this.highlights.has(marker)) {
            logger.warn(`duplicated marker added, marker=${marker}`);
            return;
        }
        this.highlights.set(marker, this.search(marker));
        this.publish({ event: MarkerEventType.POST_ADD, marker });
    }

    remove(marker: string) {
        const ranges = this.highlights.get(marker);
        if (!ranges) {
            logger.warn(`remove an non-existing marker, marker=${marker}`);
            return;
        }
        this.highlights.delete(marker);
        this.publish({ event: MarkerEventType.POST_REMOVE, marker });
    }

    reset() {
        if (!vscode.window.activeTextEditor) {
            return;
        }
        for (const key of this.highlights.keys()) {
            this.highlights.set(key, this.search(key));
        }
        this.publish({ event: MarkerEventType.RESET });
    }

    private search(token: string): Array<vscode.Range> {
        if (!vscode.window.activeTextEditor || token.length === 0) {
            return [];
        }

        const { document } = vscode.window.activeTextEditor;
        const text = document.getText();

        const matches = this.__search(token, text);
        logger.debug(
            `token ${token} matches in ${document.uri.toString()}, start index=${matches.join(
                ","
            )}`
        );

        return matches.map((index) => {
            return new vscode.Range(
                document.positionAt(index),
                document.positionAt(index + token.length)
            );
        });
    }

    private __search(token: string, text: string): Array<number> {
        const matches = new Array<number>();
        let index = 0;
        while (true) {
            index = text.indexOf(token, index);
            if (index < 0) {
                break;
            }
            matches.push(index);
            index = index + token.length;
        }
        return matches;
    }
}
