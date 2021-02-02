const express = require("express");

// const Contact = require("../models/contact-model");
const allAccessController = require("../controllers/all-services-controller");
const { checkAuth, checkValid } = require("../util/check-auth");

const router = express.Router();

router.use(checkValid);

router.get(
  "/",
  [checkAuth(["admin", "manager"])],
  allAccessController.getAllCount
);

module.exports = router;
