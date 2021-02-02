const HttpError = require("../models/http-error");
const jwt = require("jsonwebtoken");

const checkAuth = (arr) => {
  return function (req, res, next) {
    const { role } = req.userData;
    // console.log(accessRights);
    for (let i = 0; i < arr.length; i++) {
      if (arr[i] === role) {
        next();
        return;
      }
    }
    const error = new HttpError("You do not have the access rights", 401);
    return next(error);
  };
};

const checkValid = (req, res, next) => {
  if (req.method === "OPTIONS") {
    return next();
  }

  try {
    const token = req.headers.authorization.split(" ")[1]; //  Authorization: "Bearer TOKEN"

    if (!token) {
      throw new Error("Authentication failed");
    }
    console.log(token);
    const decodedtoken = jwt.verify(token, process.env.JWT_KEY);
    req.userData = {
      userId: decodedtoken.userId,
      role: decodedtoken.role,
    };

    next();
  } catch (err) {
    const error = new HttpError("Authentication failed", 401);

    return next(error);
  }
};

module.exports = { checkAuth, checkValid };
