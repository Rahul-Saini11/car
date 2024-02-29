import bcrypt from "bcrypt";

import { sendJsonToken } from "./userAuthController.js";
import { db } from "../index.js";

async function dealerLogin(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        status: "fail",
        message: "Please provide email or password.",
      });
    }

    const user = await db
      .collection("dealership")
      .findOne(
        { email },
        { projection: { _id: 1, name: 1, email: 1, role: 1, password: 1 } }
      );

    if (!user) {
      return res.status(401).json({
        status: "fail",
        message: "User is not exist. Please sign up",
      });
    }

    //Check the password, if user exist.
    const checkPassword = await bcrypt.compare(password, user.password);

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
      messge: "Internal server error.",
    });
  }
}

// signup function for dealers
async function dealerSignup(req, res) {
  try {
    const {
      name,
      email,
      location,
      password,
      confirmPassword,
      contactNumber,
      dealerId,
    } = req.body;

    if (
      !name ||
      !email ||
      !location ||
      !password ||
      !confirmPassword ||
      !contactNumber ||
      !dealerId
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
    const cursor = await db.collection("dealership").find({ email });
    const isUser = await cursor.toArray();

    if (isUser[0]) {
      return res.status(200).json({
        status: "fail",
        data: "Account already exist.",
      });
    }

    // hash the password
    const encryptedPassword = await bcrypt.hash(password, 12);

    const newData = {
      name,
      email,
      location,
      password: encryptedPassword,
      dealer_id: dealerId,
      dealership_info: {
        contact_number: contactNumber,
      },
      cars: [],
      deals: [],
      sold_vehicles: [],
    };

    const ack = await db.collection("dealership").insertOne(newData);

    let user;
    if (ack.acknowledged) {
      user = await db
        .collection("dealership")
        .findOne(
          { _id: ack.insertedId },
          { projection: { _id: 1, email: 1, name: 1, role: 1, password: 1 } }
        );
    }

    user.password = undefined;
    sendJsonToken(user, 201, res);
  } catch (err) {
    console.log(err);
    res.status(500).json({
      status: "fail",
      message: "Internal server error.",
    });
  }
}

const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.role)) {
      return res.status(403).json({
        status: "fail",
        message: "You do not have permission to perfom this action.",
      });
    }
    next();
  };
};

export { dealerLogin, dealerSignup, restrictTo };
