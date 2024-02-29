import express from "express";
import { MongoClient, ServerApiVersion } from "mongodb";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
dotenv.config();

import carRouter from "./routes/carRouter.js";
import userRouter from "./routes/userRouter.js";
import dealerRouter from "./routes/dealerRoutes.js";

const app = express();

app.use(express.json());
app.use(cookieParser());

const DB = process.env.DATABASE.replace(
  "<PASSWORD>",
  process.env.DATABASE_PASSWORD
);

const client = new MongoClient(DB, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("carbuy").command({ ping: 1 });

    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } catch (err) {
    console.log("Not connected to database");
  }
}
run().catch(console.dir);

const db = client.db("carbuy");

app.use("/api/v1", carRouter);
app.use("/api/v1/user", userRouter);
app.use("/api/v1/dealer", dealerRouter);

app.listen(4000, () => {
  console.log("Server is running on port 4000");
});

export { db, client };
