import Promise from "bluebird";

export default function fetchAll(req, res) {
  const jsonFileUrl = req.body.json_file_url;
  const { jsonClient, syncAgent, hullClient } = req.shipApp;

  req.hull.client.logger.info("fetchAll.started", jsonFileUrl);
  res.end("ok");

  const jsonStream = jsonClient.handleFile(jsonFileUrl);

  return syncAgent.batchStream(jsonStream, 200, (chunkOfUsers) => {
    return Promise.all(chunkOfUsers.map(u => {
      console.log("USER", u);
      // place of users resolution
    }));
  });
}
