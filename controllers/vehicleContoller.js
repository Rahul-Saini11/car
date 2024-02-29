import { ObjectId } from "mongodb";
import { db, client } from "../index.js";

async function getAllCar(req, res) {
  try {
    let sort = {};

    if (req.query && req.query.sort === "name") {
      sort.sort = { name: 1 };
    }

    let allCars;
    if (Object.keys(sort).length > 0) {
      allCars = await db.collection("vehicles").find({}, sort).toArray();
    } else {
      allCars = await db.collection("vehicles").find().toArray();
    }
    res.status(200).json({
      status: "success",
      data: allCars,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      status: "fail",
      message: "Internal server error.",
    });
  }
}
async function getCars(req, res) {
  try {
    const id = new ObjectId(req.params.id);

    const vehicles = await db
      .collection("dealership")
      .aggregate([
        { $match: { _id: id } },
        {
          $lookup: {
            from: "vehicles", // Name of the vehicles collection
            localField: "cars", // Field in the document containing car ObjectIds
            foreignField: "_id", // Field in the vehicles collection with car data (usually _id)
            as: "carsData", // Name for the lookup result containing car data (optional)
          },
        },
        { $project: { _id: 0, carsData: 1 } }, // Exclude _id and project only the carsData
      ])
      .toArray();

    res.status(200).json({
      status: "success",
      data: vehicles[0],
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      status: "fail",
      message: "Internal server error.",
    });
  }
}

async function addCar(req, res) {
  const session = client.startSession();
  try {
    session.startTransaction();

    const data = {
      ...req.body,
      dealer_id: req.user.dealer_id,
    };

    const ack = await db.collection("vehicles").insertOne(data, { session });

    const doc = await db
      .collection("dealership")
      .updateOne(
        { _id: req.user._id },
        { $push: { cars: ack.insertedId } },
        { session }
      );

    await session.commitTransaction();

    let car;
    if (ack.acknowledged) {
      car = await db.collection("users").findOne({ _id: ack.insertedId });
    }

    return res.status(200).json({
      status: "success",
      message: car,
    });
  } catch (err) {
    console.log(err);
    await session.abortTransaction();
    res.status(500).json({
      status: "fail",
      message: "Internal server error.",
    });
  } finally {
    await session.endSession();
  }
}

async function buyCar(req, res) {
  const session = client.startSession();
  try {
    console.log(req.user);
    session.startTransaction();
    //Write db queries here
    const date = new Date().toISOString();
    const newDeal = {
      car_id: req.params.carId,
      deal_info: {
        transaction_id: "af9349rbbsd7erb3",
        sold_to: req.user.user_id,
        sold_date: date,
      },
    };

    const soldData = {
      car_id: req.params.carId,
      vehicle_info: {
        seller_id: req.params.dealerId,
        sold_to: req.user.user_id,
        sold_date: date,
      },
    };

    const soldVehicle = await db
      .collection("soldVehicles")
      .insertOne(soldData, { session });
    const deal = await db.collection("deals").insertOne(newDeal, { session });

    const doc = await db.collection("dealership").updateOne(
      { _id: req.user._id },
      {
        $push: {
          deals: deal.insertedId,
          sold_vehicles: soldVehicle.insertedId,
        },
      },
      { session }
    );

    await session.commitTransaction();

    res.status(200).json({
      status: "success",
    });
  } catch (error) {
    console.log(error);
    await session.abortTransaction();
    res.status(500).json({
      status: "fail",
      message: "Internal server error.",
    });
  } finally {
    await session.endSession();
  }
}

export { getAllCar, getCars, addCar, buyCar };
