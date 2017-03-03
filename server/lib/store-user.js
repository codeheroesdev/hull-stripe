import getUserAttributes from "../lib/get-user-attributes";

export default function storeUser({ user, customer, hull }) {
  const attributes = getUserAttributes(customer);
  hull.logger.info("incoming.user", { attributes, ...user });
  return hull.as(user).traits(attributes, { source: "stripe" });
}
