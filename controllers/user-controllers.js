const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const shordid = require("shortid");
const randomString = require("randomstring");
const { google } = require("googleapis");
const nodemailer = require("nodemailer");

const HttpError = require("../models/http-error");
const User = require("../models/user-model");
const UnactivatedUser = require("../models/leads-model");

// const firstAdmin = async (req, res, next) => {
//   const { fname, lname, email, password } = req.body;
//   let hashedPassword;
//   try {
//     hashedPassword = await bcrypt.hash(password, 12);
//   } catch (err) {
//     return next(new HttpError("Could not create user, please try again", 500));
//   }

//   const newUser = new User({
//     fname,
//     lname,
//     email,
//     password: hashedPassword,
//     role: "admin",
//     isActivated: true,
//     accessRights: "admin",
//   });

//   try {
//     newUser.save();
//   } catch (err) {
//     console.log(err);
//   }

//   res.status(200).json({ newUser: newUser });
// };

const addUser = async (req, res, next) => {
  const { email, role, fname, lname } = req.body;

  let existingUser;
  try {
    existingUser = await User.findOne({ email: email });
  } catch (err) {
    const error = new HttpError("Signup failed, try again later", 500);
    return next(error);
  }

  if (existingUser && existingUser.isActivated) {
    const error = new HttpError("User already exist", 422);
    return next(error);
  }

  const activationString = shordid.generate();

  const newUnactivatedUser = new User({
    email,
    fname,
    lname,
    role,
    isActivated: false,
    password: "123",
    activationString,
    resetPassString: "",
  });

  try {
    await newUnactivatedUser.save();
  } catch (err) {
    console.log(err);
    const error = new HttpError("Internal error, please try again", 500);
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
      to: email,
      subject: "REGISTRATION LINK FOR CRM",
      text: "CLICK ON THE LINK BELOW FOR REDIRECT TO REGISTRATION PAGE",
      html: `<p>ACTIVATION code: ${activationString}</p><a href='http://localhost:5000/api/activation/${activationString}' >CLICK HERE</a>`,
    };

    const result = await transport.sendMail(mailOptions);

    res.status(200).json({
      message: "Mail sent to the requested email",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: error,
    });
  }
};

const signup = async (req, res, next) => {
  const { email, password, activationString } = req.body;

  let existingUser;
  try {
    existingUser = await User.findOne({ email: email });
  } catch (err) {
    const error = new HttpError("Signup failed, try again later", 500);
    return next(error);
  }

  if (!existingUser) {
    const error = new HttpError("Please contact admin or manager", 401);
    return next(error);
  }

  if (existingUser && existingUser.isActivated) {
    const error = new HttpError("User already exist, instead login", 422);
    return next(error);
  }
  // console.log(activationString, existingUser.activationString);
  if (activationString !== existingUser.activationString) {
    const error = new HttpError("Activation code did not match!", 403);
    return next(error);
  }

  let hashedPassword;
  try {
    hashedPassword = await bcrypt.hash(password, 12);
  } catch (err) {
    return next(new HttpError("Could not create user, please try again", 500));
  }

  existingUser.password = hashedPassword;
  existingUser.isActivated = true;
  existingUser.activationString = "";

  // existingUser = {
  //   ...existingUser,
  //   password: hashedPassword,
  //   isActivated: true,
  //   activationString: "",
  // };

  try {
    await existingUser.save();
  } catch (err) {
    console.log(err);
    const error = new HttpError("Signing up failed, please try again", 500);
    return next(error);
  }

  let token;

  try {
    token = jwt.sign(
      { userId: existingUser.id, role: existingUser.role },
      process.env.JWT_KEY,
      { expiresIn: "1h" }
    );
  } catch (err) {
    const error = new HttpError("Signing up failed, please try again", 500);
    return next(error);
  }

  res
    .status(201)
    .json({ userId: existingUser.id, email: existingUser.email, token: token });
};

const login = async (req, res, next) => {
  const { email, password } = req.body;

  let existingUser;
  try {
    existingUser = await User.findOne({ email: email });
  } catch (err) {
    const error = new HttpError("Logging in failed, try again later", 500);
    return next(error);
  }

  if (!existingUser) {
    const error = new HttpError("Invalid credentials", 403);
    return next(error);
  }

  let isValidPassword = false;
  try {
    isValidPassword = await bcrypt.compare(password, existingUser.password);
  } catch (err) {
    return next(
      new HttpError("Could not log you in, please check your credentials", 500)
    );
  }

  if (!isValidPassword) {
    const error = new HttpError("Invalid credentials", 403);
    return next(error);
  }

  let token;
  try {
    token = jwt.sign(
      { userId: existingUser.id, role: existingUser.role },
      process.env.JWT_KEY,
      { expiresIn: "1h" }
    );
  } catch (err) {
    const error = new HttpError("Logging in failed, please try again", 500);
    return next(error);
  }

  res.json({
    userId: existingUser.id,
    email: existingUser.email,
    token: token,
  });
};

const forgotPassword = async (req, res, next) => {
  const { email } = req.body;

  let existingUser;
  try {
    existingUser = await User.findOne({ email: email });
  } catch (err) {
    const error = new HttpError("Something went wrong, try again later", 500);
    return next(error);
  }

  if (!existingUser) {
    const error = new HttpError("Email do not exist", 403);
    return next(error);
  }

  const randomGenString = randomString.generate();

  existingUser.resetPassString = randomGenString;

  try {
    await existingUser.save();
  } catch (err) {
    console.log(err);
    const error = new HttpError("Signing up failed, please try again", 500);
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
      to: email,
      subject: "RESET PASSWORD LINK",
      text: "CLICK ON THE LINK BELOW FOR REDIRECT TO RESET PASSWORD PAGE",
      html: `<a href='http://localhost:5000/api/activation/${randomGenString}' >CLICK HERE</a>`,
    };

    const result = await transport.sendMail(mailOptions);

    res.status(200).json({
      message: "Mail sent to the requested email",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: error,
    });
  }
};

const resetPassword = async (req, res, next) => {
  const { email, password } = req.body;

  let existingUser;
  try {
    existingUser = await User.findOne({ email: email });
  } catch (err) {
    const error = new HttpError("Something went wrong, try again later", 500);
    return next(error);
  }

  if (!existingUser) {
    const error = new HttpError("Email do not exist", 403);
    return next(error);
  }

  if (existingUser.resetPassString !== "") {
    const error = new HttpError("No reset code available", 401);
    return next(error);
  }

  let hashedPassword;
  try {
    hashedPassword = await bcrypt.hash(password, 12);
  } catch (err) {
    return next(new HttpError("Could not create user, please try again", 500));
  }

  existingUser.password = hashedPassword;
  existingUser.resetPassString = "";

  try {
    await existingUser.save();
  } catch (err) {
    console.log(err);
    const error = new HttpError("Something went wrong, please try again", 500);
    return next(error);
  }

  res.status(200).json({ message: "Password changed successfully" });
};

exports.signup = signup;
exports.login = login;
exports.addUser = addUser;
exports.forgotPassword = forgotPassword;
exports.resetPassword = resetPassword;
// exports.firstAdmin = firstAdmin;
