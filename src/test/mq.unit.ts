import { InMemoryMessageQueue, Message } from "../mq";
import { WaitGroup } from "../utils";
import { expect } from 'chai';

describe("InMemoryMessageQueue", async () => {
    const mq = new InMemoryMessageQueue();

    it("pub sub", async () => {
        const topic = "test.pubsub";

        let recieved = 0;
        const total = 10;
        const wg = new WaitGroup();

        wg.add();
        mq.subscribe(topic, async (msg: Message) => {
            expect(msg.payload as number).to.be.equal(recieved);

            recieved++;
            if (recieved === total) {
                wg.done();
            }

            msg.commit();
        });

        for (let i = 0; i < total; i++) {
            mq.publish(topic, i);
        }

        wg.wait();
        mq.cleanup(topic);

        expect(mq.static(topic)).to.be.equal(0);
    });

    it("pub, 2 sub", async () => {
        const topic = "test.pub2sub";

        let recieved_1 = 0;
        let recieved_2 = 0;
        const total = 10;
        const wg = new WaitGroup();

        wg.add(2);
        mq.subscribe(topic, async (msg: Message) => {
            expect(msg.payload as number).to.be.equal(recieved_1);

            recieved_1++;
            if (recieved_1 === total) {
                wg.done();
            }
            
            msg.commit();
        });
        mq.subscribe(topic, async (msg: Message) => {
            expect(msg.payload as number).to.be.equal(recieved_2);

            recieved_2++;
            if (recieved_2 === total) {
                wg.done();
            }
            msg.commit();
        });

        for (let i = 0; i < total; i++) {
            mq.publish(topic, i);
        }

        wg.wait();
        mq.cleanup(topic);

        expect(mq.static(topic)).to.be.equal(0);
    });
});
