import { cmdGoToLineInFile } from "../../../commands";
import {
    IIntegrationTestStep,
    StepAddMarker,
    StepCheckCursorPosition,
    StepEditCurrentOpenDocument,
    StepExecuteCommand,
    StepOpenTextDocument,
} from "../base";
import * as path from "path";

export const steps: IIntegrationTestStep[] = [
    new StepOpenTextDocument(path.join(__dirname, "./test.txt")),
    new StepAddMarker("123", 3),
    new StepEditCurrentOpenDocument((editor, document) => {
        editor.insert(document.positionAt(1), "12");
    }),
    new StepOpenTextDocument(path.join(__dirname, "./switch.txt")),
    new StepOpenTextDocument(path.join(__dirname, "./test.txt")),
    new StepExecuteCommand(
        cmdGoToLineInFile,
        `file://${path.join(__dirname, "./test.txt")}`,
        "123"
    ),
    new StepCheckCursorPosition(5),
];
