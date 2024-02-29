import express from "express";

import { protect } from "../controllers/userAuthController.js";
import { restrictTo } from "../controllers/dealerAuthController.js";

import {
  getAllCar,
  getCars,
  addCar,
  buyCar,
} from "../controllers/vehicleContoller.js";

const router = express.Router();

// Get all car route
router.get("/cars", getAllCar);

// Get the cars under specific dealer
router.get("/get-cars/:id", getCars);

// Add car, restrict to only dealer
router.post("/add-car", protect, restrictTo("dealer"), addCar);

// Buy Car
router.get("/buy-car/:dealerId/:carId", protect, restrictTo("client"), buyCar);

export default router;
