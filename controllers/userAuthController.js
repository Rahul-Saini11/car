import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { ObjectId } from "mongodb";

import { db } from "../index.js";

async function login(req, res) {
  try {
    const data = req.body;

    // Check all fields exist or not.
    if (!data.email || !data.password) {
      return res.status(401).json({
        status: "fail",
        message: "Please provide all details.",
      });
    }

    // Check user already exist.
    const user = await db
      .collection("users")
      .findOne(
        { email: data.email },
        { projection: { _id: 1, email: 1, name: 1, password: 1 } }
      );

    if (!user) {
      return res.status(401).json({
        status: "fail",
        message: "Account not exist. Please sign up",
      });
    }

    //Check the password, if user exist.
    const checkPassword = await bcrypt.compare(data.password, user.password);

    if (!checkPassword) {
      return res.status(401).json({
        status: "fail",
        message: "Please provide correct email or password.",
      });
    }

    user.password = undefined;
    sendJsonToken(user, 200, res);
  } catch (err) {
    console.log(err);
    res.status(500).json({
      status: "fail",
      message: "internal server error",
      err,
    });
  }
}

// Signup function for users.
async function signup(req, res) {
  try {
    const {
      name,
      email,
      password,
      confirmPassword,
      location,
      contactNumber,
      userId,
    } = req.body;

    //Check all the fields.
    if (
      !name ||
      !email ||
      !userId ||
      !location ||
      !contactNumber ||
      !password ||
      !confirmPassword
    ) {
      return res.status(400).json({
        status: "fail",
        message: "Please provide all the fields.",
      });
    }

    //Check password and confirmPassword equal or not.
    if (password !== confirmPassword) {
      return res.status(401).json({
        status: "fail",
        message: "Passwords did not match.",
      });
    }

    // Check user already exist.
    const cursor = await db.collection("users").find({ email });
    const isUser = await cursor.toArray();

    if (isUser[0]) {
      return res.status(200).json({
        status: "fail",
        data: "Account already exist.",
      });
    }

    // hash the password
    const encryptedPassword = await bcrypt.hash(password, 12);

    // Create new data and insert to database.
    const newData = {
      user_id: userId,
      name,
      email,
      password: encryptedPassword,
      location,
      user_info: { contact_number: contactNumber },
      vehicle_info: [],
    };

    // Insert data and Send Json web token.
    const ack = await db.collection("users").insertOne(newData);

    let user;
    if (ack.acknowledged) {
      user = await db
        .collection("users")
        .findOne(
          { _id: ack.insertedId },
          { projection: { _id: 1, email: 1, name: 1, password: 1 } }
        );
    }

    user.password = undefined;
    sendJsonToken(user, 201, res);
  } catch (err) {
    console.log(err);
    res.status(500).json({
      status: "fail",
      error: err,
    });
  }
}

function logout(req, res) {
  res.cookie("jwt", "Loggedout", {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({ status: "success" });
}

async function protect(req, res, next) {
  try {
    console.log(req.path);
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    } else if (req.cookies.jwt) {
      token = req.cookies.jwt;
    }

    if (!token) {
      return res.status(401).json({
        status: "fail",
        message: "You are not logged in! Please log in to access.",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

    const id = new ObjectId(decoded.id);
    const currentUser = await db.collection("users").findOne({ _id: id });
    const currentDealer = await db
      .collection("dealership")
      .findOne({ _id: id });

    if (!currentUser && !currentDealer) {
      return res.status(401).json({
        status: "fail",
        message: "The user belonging to this token does no longer exist.",
      });
    }

    req.user = currentUser ?? currentDealer;
    req.role = currentUser ? "client" : "dealer";
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      status: "error",
      message: "Internal server error.",
    });
  }
  next();
}

function createToken(id) {
  return jwt.sign({ id }, process.env.JWT_SECRET_KEY, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
}

function sendJsonToken(user, statusCode, res) {
  const token = createToken(user._id);

  //setCookie
  res.cookie("jwt", token, {
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
    httpOnly: true,
  });

  res.status(statusCode).json({
    status: "success",
    token,
    user,
  });
}

export { login, signup, logout, protect, sendJsonToken };
