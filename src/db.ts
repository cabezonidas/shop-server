import { mongodbConnection } from "./ormconfig";
import { createConnection } from "typeorm";

// tslint:disable-next-line: no-var-requires
const mongoose = require("mongoose");
mongoose.Promise = global.Promise;
let isConnected: boolean;

export const connectToDatabase = () => {
  if (isConnected) {
    console.log("=> using existing database connection");
    return Promise.resolve();
  }

  console.log("=> using new database connection");
  return createConnection(mongodbConnection).then(db => {
    isConnected = db.isConnected;
  });
};
