import { IPlugin, PluginManager } from "./plugin";
import * as vscode from "vscode";
import { logger } from "./logger";

export enum MarkerEventType {
    POST_ADD,
    POST_REMOVE,
    RESET,
}

export interface IMarkerEvent {
    marker: string;
    eventType: MarkerEventType;
}

export type MarkerPlugin = IPlugin<IMarkerEvent>;

export class MarkerManager extends PluginManager<IMarkerEvent> {
    public highlights: Map<string, Array<vscode.Range>> = new Map<
        string,
        Array<vscode.Range>
    >();

    add(marker: string) {
        if (this.highlights.has(marker)) {
            logger.warn(`add an existing marker, ${marker}`);
            return;
        }
        this.highlights.set(marker, this.search(marker));
        logger.info(`marker added, ${marker}`);

        this.publish({ marker: marker, eventType: MarkerEventType.POST_ADD });
    }

    remove(marker: string) {
        const ranges = this.highlights.get(marker);
        if (!ranges) {
            logger.warn(`remove an non-existing marker, ${marker}`);
            return;
        }
        this.highlights.delete(marker);
        logger.info(`marker removed, ${marker}`);

        this.publish({
            marker: marker,
            eventType: MarkerEventType.POST_REMOVE,
        });
    }

    reset() {
        if (!vscode.window.activeTextEditor) {
            return;
        }

        for (const key of this.highlights.keys()) {
            this.highlights.set(key, this.search(key));
        }

        logger.info(
            `mngr reset for ${vscode.window.activeTextEditor?.document.uri}`
        );
        this.publish({ marker: "", eventType: MarkerEventType.RESET });
    }

    private search(token: string): Array<vscode.Range> {
        if (!vscode.window.activeTextEditor || token.length === 0) {
            return [];
        }

        const { document } = vscode.window.activeTextEditor;
        const text = document.getText();

        const matches = MarkerManager.__search(token, text);
        logger.debug(
            `token ${token} matches in ${document.uri.toString()}: ${matches.join(
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

    static __search(token: string, text: string): Array<number> {
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
