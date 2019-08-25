const path = require("path");
const express = require("express");

const app = express();

app.set("port", process.env.PORT || 8080);

app.use(express.static(path.join(__dirname, "build")));

app.get("/contrabandapp/*", function (req, res) {
  res.sendFile(path.join(__dirname, "build", "index.html"));
});

const server = app.listen(app.get("port"), function () {
  console.log("listening on port ", server.address().port);
});
