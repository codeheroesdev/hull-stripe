import Hull from "hull";
import bodyParser from "body-parser";
// import cors from "cors";

import WebApp from "./util/app/web";
import StaticRouter from "./util/router/static";
import tokenMiddleware from "./util/middleware/token";
import appMiddleware from "./lib/app-middleware";
import * as actions from "./actions";

const port = process.env.PORT || 8092;
if (process.env.LOG_LEVEL) {
  Hull.logger.transports.console.level = process.env.LOG_LEVEL;
}

const hullMiddleware = Hull.Middleware({ hostSecret: process.env.SECRET || "1234", cacheShip: false });
const middlewareSet = [tokenMiddleware, hullMiddleware, appMiddleware];
const app = WebApp();

app.use("/", StaticRouter({ Hull }));

app.post("/fetch-all", bodyParser.urlencoded({ extended: false }), ...middlewareSet, actions.fetchAll);

app.listen(port, () => {
  Hull.logger.info("webApp.listen", port);
});
