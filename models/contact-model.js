const mongoose = require("mongoose");

const contactSchema = new mongoose.Schema({});

module.exports = mongoose.model("Contact", contactSchema);
