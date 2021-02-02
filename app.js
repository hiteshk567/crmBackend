require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

const userRoutes = require("./routes/user-routes");
const accessRoutes = require("./routes/access-routes");
const allServiceRoutes = require("./routes/all-service-routes");

const app = express();

app.use(cors());
app.use(bodyParser.json());

mongoose
  .connect(
    `mongodb+srv://hiteshk567:retard123@cluster0.r8oq5.mongodb.net/backendtask?retryWrites=true&w=majority`,
    { useNewUrlParser: true }
  )
  .then((result) => console.log("success"))
  .catch((err) => console.log(err, "err"));

app.use("/api/users", userRoutes);

app.use("/api/access", accessRoutes);

app.use("/api/totalCount", allServiceRoutes);

app.use((req, res, next) => {
  throw new HttpError("Could not find this route", 404);
});

app.use((error, req, res, next) => {
  if (error.headerSent) {
    return next(error);
  }
  res.status(error.code || 500);
  res.json({ message: error.message || "An unknown error occurred" });
});

app.listen(5000, () => {
  console.log("server is running on port 5000");
});
