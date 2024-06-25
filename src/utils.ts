/*
 * LinkedList, Single, Ordered
 */
export class LinkedListItem<T> {
    constructor(public data: T, public next: undefined | LinkedListItem<T>) {}
}

export class OrderedLinkedListHead<T> {
    public next: undefined | LinkedListItem<T>;
    //
    constructor(private shouldInsertBefore: (nn: T, toBeInsert: T) => boolean) {
        this.next = undefined;
    }

    insert(data: T) {
        let pre = this;
        let nn = this.next;

        for (; nn !== undefined; ) {
            if (this.shouldInsertBefore(nn.data, data)) {
                break;
            }
            // @ts-ignore
            pre = nn;
            nn = nn.next;
        }
        pre.next = new LinkedListItem<T>(data, nn);
    }

    popFront(): LinkedListItem<T> | undefined {
        const nn = this.next;
        nn === undefined ? null : this.remove(nn);
        return nn;
    }

    forEach(callback: (item: T) => void) {
        for (let nn = this.next; nn !== undefined; nn = nn.next) {
            callback(nn.data);
        }
    }

    find(
        cmp: (t: T) => { match: boolean; shouldContinue: boolean }
    ): LinkedListItem<T> | undefined {
        for (let nn = this.next; nn !== undefined; nn = nn.next) {
            const { match, shouldContinue } = cmp(nn.data);
            if (match) {
                return nn;
            }
            if (!shouldContinue) {
                return undefined;
            }
        }
        return undefined;
    }

    remove(cur: LinkedListItem<T>) {
        let pre = this;
        let nn = this.next;
        for (; nn !== undefined; ) {
            if (cur === nn) {
                pre.next = nn.next;
                return;
            }
            // @ts-ignore
            pre = nn;
            nn = nn.next;
        }
    }

    clear() {
        this.next = undefined;
    }
}

export type OrderedLinkedList<T> = OrderedLinkedListHead<T>;

/*
 * Singleton
 */

export class Singleton<T> {
    private static instance: Singleton<any> | null = null;
    private singleton: T | undefined;

    private constructor() {}

    static getInstance<T>(): Singleton<T> {
        if (!Singleton.instance) {
            Singleton.instance = new Singleton<T>();
        }
        return Singleton.instance;
    }

    getInstanceValue(): T | undefined {
        return this.singleton;
    }
}

/**
 * Delayer
 */

export class DelayRunner {
    private timer: NodeJS.Timeout | undefined;

    constructor(private ms: number, private handler: () => void) {}

    run() {
        if (this.timer === undefined) {
            this.timer = setTimeout(this.handler, this.ms);
        } else {
            this.timer.refresh();
        }
    }
}


export class WaitGroup {
    private counter: number;
    private promise: Promise<any>;
    private __resolve: (args: any) => void;

    constructor() {
      this.counter = 0;
      this.__resolve = () => void {};
      this.promise = new Promise((resolve) => {
        this.__resolve = resolve;
      });
    }
  
    add(count = 1) {
      this.counter += count;
    }
  
    done() {
      this.counter -= 1;
      if (this.counter === 0) {
        this.__resolve(1);
      }
    }
  
    async wait() {
      if (this.counter === 0) {
        return Promise.resolve();
      }
      return this.promise;
    }
  }