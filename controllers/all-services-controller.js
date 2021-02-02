const Service = require("../models/service-model");
const Lead = require("../models/leads-model");
const HttpError = require("../models/http-error");

const getAllCount = async (req, res, next) => {
  let count = 0;
  try {
    let serviceCount = await Service.count({});
    let leadCount = await Lead.count({});
    count = serviceCount + leadCount;
  } catch (err) {
    const error = new HttpError("Something went wrong, please try again", 500);
    return next(error);
  }

  res.status(200).json({ totalCount: count });
};

exports.getAllCount = getAllCount;
