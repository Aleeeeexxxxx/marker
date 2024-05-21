import { logger } from "../logger";
import { IMarkerEvent, MarkerEventType, MarkerPlugin } from "../markerMngr";
import { PluginEventContext } from "../plugin";

export abstract class IPluginBase implements MarkerPlugin {
    handle(context: PluginEventContext<IMarkerEvent>): void {
        const event = context.getEvent();

        switch (event.eventType) {
            case MarkerEventType.POST_ADD:
                this.postAdd(context);
                break;
            case MarkerEventType.POST_REMOVE:
                this.postRemove(context);
                break;
            case MarkerEventType.RESET:
                this.reset(context);
                break;
            default:
                logger.warn(`unknown event, type=${event.eventType}`);
                return;
        }
    }
    abstract reset(context: PluginEventContext<IMarkerEvent>): void;
    abstract postAdd(context: PluginEventContext<IMarkerEvent>): void;
    abstract postRemove(context: PluginEventContext<IMarkerEvent>): void;
}
