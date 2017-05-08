/* @flow */
import getUserAttributes from "../lib/get-user-attributes";

export default function storeUser({ user, customer, client }: any) {
  const attributes = getUserAttributes(customer);
  client.logger.info("incoming.user", { attributes, ...user });
  return client.asUser(user).traits(attributes, { source: "stripe" });
}
