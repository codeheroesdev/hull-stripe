/* eslint-disable */
import Redis from "ioredis";

export function newClient(url: string) {
  return new Redis(url);
}
