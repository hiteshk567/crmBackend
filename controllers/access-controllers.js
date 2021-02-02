const { google } = require("googleapis");
const nodemailer = require("nodemailer");

const Lead = require("../models/leads-model");
const Service = require("../models/service-model");
const User = require("../models/user-model");
const HttpError = require("../models/http-error");

const getLeads = async (req, res, next) => {
  let allLeads;

  try {
    allLeads = await Lead.find({});
  } catch (err) {
    const error = new HttpError("Could not find the leads", 500);
    return next(error);
  }
  res.json({ leads: allLeads });
};

const getServices = async (req, res, next) => {
  let allServiceRequest;

  try {
    allServiceRequest = await Service.find({});
  } catch (err) {
    const error = new HttpError("Could not find the leads", 500);
    return next(error);
  }
  res.json({ serviceRequests: allServiceRequest });
};

const createLead = async (req, res, next) => {
  let { email } = req.body;
  let existingLead;
  try {
    existingLead = await Lead.findOne({ email: email });
  } catch (err) {
    const error = new HttpError("Something went wrong, try again later", 500);
    return next(error);
  }

  if (existingLead) {
    const error = new HttpError("Email already exist exist", 300);
    return next(error);
  }

  let newLead = new Lead({
    email,
    contacted: false,
    status: "New",
  });

  try {
    await newLead.save();
  } catch (err) {
    const error = new HttpError(
      "Could not save at this point, please try again",
      500
    );
    return next(error);
  }

  let allAuthorities;

  try {
    allAuthorities = await User.find({
      role: {
        $in: ["admin", "manager"],
      },
    });
  } catch (err) {
    const error = new HttpError("Something went wrong", 500);
    return next(error);
  }
  console.log(allAuthorities);
  try {
    const oAuth2Client = new google.auth.OAuth2(
      process.env.CLIENT_ID,
      process.env.CLIENT_SECRET,
      process.env.REDIRECT_URI
    );

    oAuth2Client.setCredentials({ refresh_token: process.env.REFRESH_TOKEN });

    const accessToken = await oAuth2Client.getAccessToken();

    const transport = nodemailer.createTransport({
      service: "gmail",
      auth: {
        type: "OAuth2",
        user: "hiteshk567@gmail.com",
        clientId: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        refreshToken: process.env.REFRESH_TOKEN,
        accessToken,
      },
    });

    const mailOptions = {
      from: "HITESH KUMAR <hiteshk567@gmail.com>",
      to: allAuthorities,
      subject: "NEW LEAD CREATED",
      text: "A NEW LEAD HAS BEEN CREATED",
    };

    const result = await transport.sendMail(mailOptions);
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: error,
    });
  }

  res.status(200).json({ message: "New lead added" });
};

const createService = async (req, res, next) => {
  let { email, serviceInfo } = req.body;

  let newService = new Service({
    email,
    status: "Created",
    serviceInfo,
  });

  try {
    await newService.save();
  } catch (err) {
    const error = new HttpError(
      "Could not save at this point, please try again",
      500
    );
    return next(error);
  }

  let allAuthorities;

  try {
    allAuthorities = await User.find({
      $or: [{ role: "admin", role: "manager" }],
    });
  } catch (err) {
    const error = new HttpError("Something went wrong", 500);
    return next(error);
  }

  try {
    const oAuth2Client = new google.auth.OAuth2(
      process.env.CLIENT_ID,
      process.env.CLIENT_SECRET,
      process.env.REDIRECT_URI
    );

    oAuth2Client.setCredentials({ refresh_token: process.env.REFRESH_TOKEN });

    const accessToken = await oAuth2Client.getAccessToken();

    const transport = nodemailer.createTransport({
      service: "gmail",
      auth: {
        type: "OAuth2",
        user: "hiteshk567@gmail.com",
        clientId: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        refreshToken: process.env.REFRESH_TOKEN,
        accessToken,
      },
    });

    const mailOptions = {
      from: "HITESH KUMAR <hiteshk567@gmail.com>",
      to: allAuthorities,
      subject: "NEW SERVICE CREATED",
      text: "A NEW SERVICE HAS BEEN CREATED",
    };

    const result = await transport.sendMail(mailOptions);
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: error,
    });
  }

  res.status(200).json({ message: "New Service request created" });
};

const updateLead = async (req, res, next) => {
  const { leadId, contacted, status } = req.body;

  let existingLead;
  try {
    existingLead = await Lead.findById(leadId);
  } catch (err) {
    const error = new HttpError("Something went wrong, try again later", 500);
    return next(error);
  }

  if (!existingLead) {
    const error = new HttpError("Lead with the given id do not exist", 301);
    return next(error);
  }

  existingLead.contacted = contacted;
  existingLead.status = status;

  try {
    await existingLead.save();
  } catch (err) {
    const error = new HttpError(
      "Could not save at this point, please try again",
      500
    );
    return next(error);
  }

  res.status(200).json({ updatedLead: existingLead });
};

const updateService = async (req, res, next) => {
  const { serviceId, status } = req.body;

  let existingService;
  try {
    existingService = await Service.findById(serviceId);
  } catch (err) {
    const error = new HttpError("Something went wrong, try again later", 500);
    return next(error);
  }

  if (!existingLead) {
    const error = new HttpError(
      "Service request with the given id do not exist",
      301
    );
    return next(error);
  }

  existingService.status = status;

  try {
    await existingService.save();
  } catch (err) {
    const error = new HttpError(
      "Could not save at this point, please try again",
      500
    );
    return next(error);
  }

  res.status(200).json({ updatedService: existingService });
};

exports.getLeads = getLeads;
exports.getServices = getServices;
exports.createLead = createLead;
exports.createService = createService;
exports.updateLead = updateLead;
exports.updateService = updateService;
