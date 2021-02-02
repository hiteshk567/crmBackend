const express = require("express");

const userControllers = require("../controllers/user-controllers");
const { checkAuth, checkValid } = require("../util/check-auth");

const router = express.Router();

router.post("/signup", userControllers.signup);

router.post("/login", userControllers.login);

router.post("/forgotPassword", userControllers.forgotPassword);

router.patch("/resetPassword", userControllers.resetPassword);

router.use(checkValid);

router.post(
  "/addUser",
  [checkAuth(["admin", "manager"])],
  userControllers.addUser
);

// router.post("/firstAdmin", userControllers.firstAdmin);

module.exports = router;
