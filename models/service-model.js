const mongoose = require("mongoose");

const ServiceSchema = new mongoose.Schema({
  email: { type: String, required: true },
  status: { type: String, required: true },
  serviceInfo: { type: String, required: true },
});

module.exports = mongoose.model("Service", ServiceSchema);
