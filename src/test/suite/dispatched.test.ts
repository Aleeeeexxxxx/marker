import * as assert from "assert";
import * as vscode from "vscode";
import { InMemoryMessageQueue } from "../../mq";
import { VscodeEventDispatcher } from "../../dispatcher";
import { HighlightMngr, topicHighlightReset } from "../../highlight";
import { getWorkspaceFolder } from "./base";
import { WaitGroup } from "../../utils";

suite("dispatcher-highlight", () => {
    const mq = new InMemoryMessageQueue();
    const dispatcher = new VscodeEventDispatcher(mq);

    vscode.window.onDidChangeActiveTextEditor(
        dispatcher.onDidChangeActiveTextEditor.bind(dispatcher)
    );
    vscode.workspace.onDidChangeTextDocument(
        dispatcher.onDidChangeTextDocument.bind(dispatcher)
    );

    const token = "highlight";
    const hmngr = new HighlightMngr(mq);
    hmngr.add(token);

    test("onDidChangeActiveTextEditor", async () => {
        const wg = new WaitGroup();
        wg.add();

        const document = await vscode.workspace.openTextDocument(
            `${getWorkspaceFolder()}/dispatcher-highlight.txt`
        );
        await vscode.window.showTextDocument(document);

        const sub = mq.subscribe(topicHighlightReset, async (msg) => {
            msg.commit();
            wg.done();
        });

        await wg.wait();
        sub.close();

        assert.strictEqual(1, hmngr.highlights.size);
        assert.strictEqual(3, hmngr.highlights.get(token)?.length);
    });

    test("onDidChangeTextDocument", async () => {
        const wg = new WaitGroup();
        wg.add();

        const sub = mq.subscribe(topicHighlightReset, async (msg) => {
            msg.commit();
            wg.done();
        });

        const editor = vscode.window.activeTextEditor!;
        editor.edit((editBuilder) => {
            const document = editor.document;
            editBuilder.delete(new vscode.Range(document.positionAt(17), document.positionAt(47)));
        });

        await wg.wait();
        sub.close();

        assert.strictEqual(1, hmngr.highlights.size);
        assert.strictEqual(1, hmngr.highlights.get(token)?.length);
    });
});
