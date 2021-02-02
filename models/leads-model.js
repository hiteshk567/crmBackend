const mongoose = require("mongoose");

const leadModel = new mongoose.Schema({
  email: { type: String, required: true },
  contacted: { type: Boolean, required: true },
  status: { type: String, required: true },
});

module.exports = mongoose.model("Contact", leadModel);
