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
import * as vscode from "vscode";

const testFilePath = path.join(__dirname, "./test.txt");
const fileForSwitchPath = path.join(__dirname, "./switch.txt");

export const steps: IIntegrationTestStep[] = [
    new StepOpenTextDocument(testFilePath),
    new StepAddMarker("123", 3),
    new StepEditCurrentOpenDocument((editor, document) => {
        editor.insert(document.positionAt(1), "12");
    }),
    new StepEditCurrentOpenDocument((editor, document) => {
        editor.delete(
            new vscode.Range(document.positionAt(1), document.positionAt(2))
        );
    }),
    new StepOpenTextDocument(fileForSwitchPath),
    new StepOpenTextDocument(testFilePath),
    new StepExecuteCommand(cmdGoToLineInFile, [
        `file://${testFilePath}`,
        "123",
    ]),
    new StepCheckCursorPosition(5),
];
