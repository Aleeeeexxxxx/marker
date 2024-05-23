import { EventEmitter } from "events";

const eventName = "__marker_plugin_event";

export interface IPluginEvent<T> {
    version: number;
    payload: T;
}

export interface IPlugin<T> {
    name(): string;
    handleEvent(event: IPluginEvent<T>): void;
}

export class PluginManager<T> {
    private emitter: EventEmitter = new EventEmitter();
    private version: number = 0;
    private plugins: Map<string, IPlugin<T>> = new Map();

    register(...plugins: IPlugin<T>[]): void {
        plugins.forEach((plugin) => {
            if (this.plugins.has(plugin.name())) {
                return;
            }
            this.emitter.addListener(eventName, plugin.handleEvent.bind(plugin));
            this.plugins.set(plugin.name(), plugin);
        });
    }

    publish(payload: T): void {
        const version = this.version++;
        this.emitter.emit(eventName, { version, payload });
    }
}
