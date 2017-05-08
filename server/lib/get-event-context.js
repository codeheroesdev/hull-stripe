/* @flow */
import moment from "moment";

export default function getEventContext(event: any) {
  return {
    source: "stripe",
    type: "payment",
    created_at: moment(event.created, "X").format(),
    event_id: event.id
  };
}
