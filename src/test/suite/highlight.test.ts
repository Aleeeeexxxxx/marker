import * as assert from "assert";
import * as vscode from "vscode";
import { InMemoryMessageQueue } from "../../mq";
import {
    HighlightMngr,
    IHighlightChangeMessage,
    topicHighlightAdd,
} from "../../highlight";
import { WaitGroup } from "../../utils";

function getWorkspaceFolder(): string {
    return vscode.workspace.workspaceFolders![0].uri.path;
}

suite("highlight", () => {
    const mq = new InMemoryMessageQueue();
    const hmngr = new HighlightMngr(mq);

    test("add", async () => {
        const document = await vscode.workspace.openTextDocument(
            `${getWorkspaceFolder()}/highlight-add.txt`
        );
        await vscode.window.showTextDocument(document);

        const token = "highlight";
        const wg = new WaitGroup();
        wg.add();

        const sub = mq.subscribe(topicHighlightAdd, async (msg) => {
            const payload = msg.payload as IHighlightChangeMessage;
            assert.strictEqual(token, payload.marker);
            msg.commit();
            wg.done();
        });

        hmngr.add(token);

        assert.strictEqual(1, hmngr.highlights.size);
        assert.strictEqual(3, hmngr.highlights.get(token)?.length);

        wg.wait();
        sub.close();
    });
});
