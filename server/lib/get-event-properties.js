import _ from "lodash";
import flatten from "flat";
import objectMapper from "object-mapper";
import subscription from "../mappers/subscription";
import charge from "../mappers/charge";
import invoice from "../mappers/invoice";

const MAP = { subscription, charge, invoice };

export default function getEventProperties({ data }) {
  const { object } = data;
  const map = MAP[object.object];
  const properties = objectMapper(object, map) || {};

  return {
    ...properties,
    ...flatten(_.pick(object, "previous_attributes"), { delimiter: "_" }),
    ...flatten(_.pick(object, "metadata"), { delimiter: "_" })
  };
}
