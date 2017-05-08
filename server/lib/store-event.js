/* @flow */
import getEventContext from "../lib/get-event-context";
import getEventProperties from "../lib/get-event-properties";

export default function storeEvent({ user, event, name, client }: any) {
  const properties = getEventProperties(event);
  const context = getEventContext(event);

  // Only track if we support this event type
  if (name) {
    client.logger.info("incoming.event", { name, properties, context, ...user });
    return client.asUser(user).track(name, properties, context);
  }
  client.logger.warn("event.skip", { context, ...user });
  return "";
}
