const express = require("express");

const accessControllers = require("../controllers/access-controllers");
const { checkValid, checkAuth } = require("../util/check-auth");

const router = express.Router();

router.use(checkValid);

router.get("/getLeads", accessControllers.getLeads);

router.get("/getServiceReq", accessControllers.getServices);

router.post(
  "/createLead",
  [checkAuth(["admin", "manager", "employee"])],
  accessControllers.createLead
);

router.post(
  "/createService",
  [checkAuth(["admin", "manager", "employee"])],
  accessControllers.createService
);

router.patch(
  "/updateLead",
  [checkAuth(["employee", "admin", "manager"])],
  accessControllers.updateLead
);

router.patch(
  "/updateService",
  [checkAuth(["employee", "admin", "manager"])],
  accessControllers.updateService
);

module.exports = router;
