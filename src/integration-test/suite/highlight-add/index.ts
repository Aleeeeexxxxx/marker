import {
    IIntegrationTestStep,
    StepExecuteCommand,
    StepOpenTextDocument,
    StepSelectInTextDocument,
    StepValidateHighlightItemIfExist,
} from "../base";
import * as path from "path";

export const steps: IIntegrationTestStep[] = [
    new StepOpenTextDocument(path.join(__dirname, "./test.txt")),
    new StepSelectInTextDocument(3, 5),
    new StepExecuteCommand("marker.editor.menu.mark.highlight"),
    new StepValidateHighlightItemIfExist("addd"),
];
