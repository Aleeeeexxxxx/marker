import { UUID } from "crypto";
import MessageEmitter from "events";
import { logger } from "./logger";

export interface MessageQueueConfig {
    autoCommitTimeout?: number;
}

interface IMessageMetadata {
    index: number;

    createAt: number;
    topic: string;

    correlationID?: UUID;
}

interface IMessage extends IMessageMetadata {
    readonly payload: any;
}

export class Message implements IMessage {
    readonly payload: any;
    readonly index: number;
    readonly createAt: number;
    readonly topic: string;

    private readonly subscriber: Subscriber;
    private committed: boolean;
    private timeout: NodeJS.Timeout | undefined;

    constructor(msg: IMessage, sub: Subscriber) {
        this.payload = msg.payload;
        this.index = msg.index;
        this.createAt = msg.createAt;
        this.topic = msg.topic;

        this.subscriber = sub;
        this.committed = false;

        // auto commit
        if (this.subscriber.config.autoCommitTimeout) {
            this.timeout = setTimeout(() => {
                this.commit(true);
            }, this.subscriber.config.autoCommitTimeout);
        }
    }

    commit(triggerByTimer = false) {
        if (this.committed) {
            return;
        }
        if (!triggerByTimer) {
            clearTimeout(this.timeout);
        }

        this.committed = true;
        this.subscriber.commitLastMessage(this.index);
    }
}

export type MQCallbackFn = (msg: Message) => Promise<void>;

const INDEX_START_FROM = 0;

class Subscriber {
    static MESSAGE = "__internal.sub.message";

    readonly topic: Topic;
    private readonly callback: MQCallbackFn;
    readonly config: MessageQueueConfig;

    private lastCommitMessageIndex: number;
    private inProcessingMessageIndex: number;

    private emitter: MessageEmitter;

    constructor(
        topic: Topic,
        callback: MQCallbackFn,
        lastCommitMessageIndex: number,
        config: MessageQueueConfig
    ) {
        this.topic = topic;
        this.callback = callback;
        this.config = config;

        this.emitter = new MessageEmitter();
        this.emitter.addListener(Subscriber.MESSAGE, this.handle.bind(this));

        this.lastCommitMessageIndex = lastCommitMessageIndex;
        this.inProcessingMessageIndex = INDEX_START_FROM;
    }

    getLastCommitMessageIndex(): number {
        return this.lastCommitMessageIndex;
    }

    commitLastMessage(index: number) {
        this.lastCommitMessageIndex = index;

        if (this.inProcessingMessageIndex !== index) {
            throw new Error("");
        }

        this.inProcessingMessageIndex = INDEX_START_FROM;
        this.emit();
    }

    emit() {
        this.emitter.emit(Subscriber.MESSAGE);
    }

    async handle() {
        const ev = this.topic.fetchNextMessage(this.lastCommitMessageIndex);

        if (!ev || this.inProcessingMessageIndex !== INDEX_START_FROM) {
            return;
        }

        this.inProcessingMessageIndex = ev.index;

        const message = new Message(ev, this);
        try {
            await this.callback(message);
        } catch (err) {
            logger.error(err as Error);
            message.commit();
        }
    }

    close() {
        this.emitter.removeAllListeners();
        this.topic.removeSubscriber(this);
    }
}

// fanout
export class Topic {
    private readonly config: MessageQueueConfig;
    private readonly topic: string;
    private subscribers: Subscriber[] = [];

    private messages: IMessage[] = [];
    private lastMessageIndex: number = INDEX_START_FROM;

    constructor(topic: string, config: MessageQueueConfig) {
        this.topic = topic;
        this.config = config;
    }

    addSubscriber(fn: MQCallbackFn): Subscriber {
        const subscriber = new Subscriber(
            this,
            fn,
            this.lastMessageIndex,
            this.config
        );
        this.subscribers.push(subscriber);
        return subscriber;
    }

    publishMessage(msg: any) {
        const message = {
            createAt: Date.now(),
            topic: this.topic,
            index: this.incrLastMessageIndex(),

            payload: msg,
        };

        this.messages.push(message);

        this.cleanupOutdatedMessages();
        this.notifySubscribers();
    }

    getLastMessageIndex(): number {
        return this.lastMessageIndex;
    }

    fetchNextMessage(previous: number): IMessage | undefined {
        if (this.messages.length === 0) {
            return undefined;
        }

        for (let i = 0; i < this.messages.length; i++) {
            if (this.messages[i].index > previous) {
                return this.messages[i];
            }
        }

        return undefined;
    }

    private incrLastMessageIndex(): number {
        this.lastMessageIndex++;
        return this.lastMessageIndex;
    }

    private cleanupOutdatedMessages() {
        let minCommitted = this.lastMessageIndex;

        this.subscribers.forEach((sub) => {
            minCommitted = Math.min(
                minCommitted,
                sub.getLastCommitMessageIndex()
            );
        });

        let i = 0;
        for (; i < this.messages.length; i++) {
            if (this.messages[i].index >= minCommitted) {
                break;
            }
        }

        this.messages = this.messages.slice(i);
    }

    private notifySubscribers() {
        this.subscribers.forEach((sub) => sub.emit());
    }

    close() {
        this.subscribers.forEach((sub) => sub.close());
    }

    removeSubscriber(sub: Subscriber) {
       
    }

    undeliveryMessage(): number {
        return this.messages.length;
    }
}

export class InMemoryMessageQueue {
    private __topics: Map<string, Topic> = new Map();
    private readonly config: MessageQueueConfig = {
        autoCommitTimeout: 5 * 60 * 1000,
    };

    subscribe(topic: string, fn: MQCallbackFn): Subscriber {
        return this.getOrCreate(topic).addSubscriber(fn);
    }

    publish(topic: string, msg: any) {
        let __topic = this.__topics.get(topic);
        if (__topic) {
            __topic.publishMessage(msg);
        }
    }

    close() {
        this.__topics.forEach((__topic) => __topic.close());
    }

    static(topic: string): number {
        let __topic = this.__topics.get(topic);
        if (__topic) {
            return __topic.undeliveryMessage();
        }
        return -1;
    }

    private getOrCreate(topic: string): Topic {
        let __topic = this.__topics.get(topic);
        if (!__topic) {
            __topic = new Topic(topic, this.config);
            this.__topics.set(topic, __topic);
        }
        return __topic;
    }
}
