/* global describe, it */
import Hull from "hull";
import express from "express";
import request from "request";
import nock from "nock";

import ClientMock from "./mocks/client-mock";
import Server from "../server/server";
import * as StoreTypes from "../server/storeTypes";

const assert = require("assert");

const hostSecret = "secret";

const connector = new Hull.Connector({
  hostSecret,
  port: 8070
});

let app = express();
connector.setupApp(app);

app.use((req, res, next) => {
  req.hull = {
    client: ClientMock(),
    ship: {
      private_settings: {
        token: "123",
        metadata_id_parameter: "1",
        id_parameter: "2"
      },
    },
    metric: {
      increment: () => {
      }
    }
  };

  next();
});

const store = StoreTypes.mocked.newClient();

app = Server(app, {
  connector,
  hostSecret,
  clientID: "1234",
  clientSecret: "4321",
}, store);

connector.startApp(app);

nock("https://api.stripe.com")
    .get("/v1/customers/12345")
    .reply(200, {
      id: "56789",
      metadata: {
        1: "test"
      },
      account_balance: 12,
      currency: "PLN",
      delinquent: true,
      description: "delinquent",
      email: "delinquent@delinquents.com",
      discount: 100,
      created: "2016-12-12:15:15"
    });

nock("https://api.stripe.com")
    .get("/v1/events/123456")
    .reply(200, {
      id: "345",
      data: {
        object: {
          object: "subscription",
          previous_attributes: {},
          metadata: {}
        }
      },
      created: "2016-12-12:15:15"
    });

describe("Server", () => {
  describe("for /stripe", () => {
    it("should", () => {
      request
        .post({
          url: "http://127.0.0.1:8070/stripe",
          method: "POST",
          json: {
            user_id: "1234",
            data: {
              object: {
                customer: "12345"
              }
            },
            id: "123456"
          }
        })
        .on("response", (response) => {
          console.log(response.statusCode);
          assert(response.statusCode === 204);
        });
    });
  });
});
