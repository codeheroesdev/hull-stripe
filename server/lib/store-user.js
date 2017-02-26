import getUserAttributes from "../lib/get-user-attributes";

export default function storeUser({ user, customer, hull }) {
  const attributes = getUserAttributes(customer);
  hull.as(user).traits(attributes, { source: "stripe" });
  hull.logger.info("user.store", { attributes, ...user });
}
