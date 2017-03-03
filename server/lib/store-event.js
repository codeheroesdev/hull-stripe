import getEventContext from "../lib/get-event-context";
import getEventProperties from "../lib/get-event-properties";

export default function storeEvent({ user, event, name, hull }) {
  const properties = getEventProperties(event);
  const context = getEventContext(event);

  // Only track if we support this event type
  if (name) {
    hull.logger.info("incoming.event", { name, properties, context, ...user });
    return hull.as(user).track(name, properties, context);
  }
  hull.logger.warn("event.skip", { name, context, ...user });
  return "";
}
