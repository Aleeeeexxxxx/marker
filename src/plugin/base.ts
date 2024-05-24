import { logger } from "../logger";
import {
    IMarkerEventPayload,
    MarkerEvent,
    MarkerEventType,
    MarkerPlugin,
} from "../markerMngr";

export abstract class IPluginBase implements MarkerPlugin {
    abstract name(): string;

    handleEvent(event: MarkerEvent): void {
        if (this.preCheck(event)) {
            try {
                const payload = event.payload;
                switch (payload.event) {
                    case MarkerEventType.POST_ADD:
                        this.postAdd(payload);
                        break;
                    case MarkerEventType.POST_REMOVE:
                        this.postRemove(payload);
                        break;
                    case MarkerEventType.RESET:
                        this.reset(payload);
                        break;
                    default:
                        logger.warn(`unknown event, type=${payload.event}`);
                        return;
                }
            } catch (e) {
                logger.error(e as Error);
            }
        }
    }

    abstract preCheck(event: MarkerEvent): boolean;

    abstract reset(event: IMarkerEventPayload): void;
    abstract postAdd(event: IMarkerEventPayload): void;
    abstract postRemove(event: IMarkerEventPayload): void;
}
