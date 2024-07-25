import * as vscode from "vscode";
import * as assert from "assert";
import * as fs from "fs";
import { dispatcher, IIntegrationTestStep } from "./base";

suite("integration-test", () => {
    vscode.window.onDidChangeActiveTextEditor(
        dispatcher.onDidChangeActiveTextEditor.bind(dispatcher)
    );
    vscode.workspace.onDidChangeTextDocument(
        dispatcher.onDidChangeTextDocument.bind(dispatcher)
    );

    fs.readdirSync(__dirname, { withFileTypes: true })
        .filter((item) => item.isDirectory())
        .forEach((item) => {
            test(`${item.name}`, async () => {
                const module = await import(`./${item.name}/index.js`);
                const steps = module.steps as IIntegrationTestStep[];

                console.log(`run ${item.name} now, step length: ${steps.length}`);

                for (var i = 0; i < steps.length; i++) {
                    const step = steps[i];
                    console.log(`run step ${step.constructor.name}`);

                    const result = await step.run();

                    console.log(`result of step ${step.constructor.name}: ${result}`);
                    assert.strictEqual(true, result);
                }
            });
        });
});
