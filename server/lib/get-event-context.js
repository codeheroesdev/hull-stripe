import moment from "moment";

export default function getEventContext(event) {
  return {
    source: "stripe",
    type: "payment",
    created_at: moment(event.created, "X").format(),
    event_id: event.id
  };
}
