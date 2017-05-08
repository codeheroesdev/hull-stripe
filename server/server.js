/* @flow */
import { notifHandler } from "hull/lib/utils";

import Stripe from "stripe";
import express from "express";

import { updateStripeMapping, fetchEvents } from "./actions";
import fetchHistory from "./lib/fetch-history";
import stripeMiddleware from "./lib/stripe-middleware";
import webOauthRouter from "./router/web-oauth-router";
import cryptFactory from "./lib/crypt";
import StoreType from "./storeTypes";

module.exports = function Server(app: express, { connector, hostSecret, clientSecret, clientID }: any, store: StoreType) {
  const crypto = cryptFactory({ hostSecret });

  app.use("/auth", webOauthRouter({
    crypto,
    store,
    clientID,
    clientSecret,
    instrumentationAgent: connector.instrumentation
  }));

  app.use("/notify", notifHandler({
    userHandlerOptions: {
      groupTraits: true,
      maxSize: 1,
      maxTime: 1
    },
    handlers: {
      "user:update": updateStripeMapping.bind(this, store),
      "ship:update": updateStripeMapping.bind(this, store),
      "segment:update": updateStripeMapping.bind(this, store)
    }
  }));

  app.post("/fetch-all", connector.clientMiddleware(), function fetchAllRes(req, res) {
    const { ship } = req.hull;
    req.hull.stripe = Stripe(ship.private_settings.token);
    fetchHistory(req.hull)
    .then(
      response => res.send({ ...response, status: "ok" }),
      err => res.send({ status: "error", ...err })
    );
  });

  app.use("/stripe",
    stripeMiddleware(store, crypto),
    connector.clientMiddleware(),
    fetchEvents
  );

  return app;
};
