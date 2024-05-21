
export interface IPlugin<T> {
    handle(context: PluginEventContext<T>): void;
}

export class PluginEventContext<T> {
    private aborted: boolean;

    constructor(private event: T, private plugins: IPlugin<T>[]) {
        this.aborted = false;
    }

    getEvent(): T {
        return this.event;
    }

    abort() {
        this.aborted = true;
    }

    run(): void {
        for (let i = 0; i < this.plugins.length; i++) {
            const plugin = this.plugins[i];
            plugin.handle(this);

            if (this.aborted) {
                return;
            }
        }
    }
}

export class PluginManager<T> {
    private plugins: IPlugin<T>[] = [];

    register(...plugin: IPlugin<T>[]): PluginManager<T> {
        this.plugins = this.plugins.concat(plugin);
        return this;
    }

    publish(event: T) {
        const context = new PluginEventContext<T>(event, this.plugins);
        context.run();
    }
}
