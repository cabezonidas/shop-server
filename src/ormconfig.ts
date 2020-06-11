import { ConnectionOptions } from "typeorm";
import { User } from "./entity/user";
import { Post } from "./entity/post";

const { MONGODB_USR, MONGODB_PASSWORD } = process.env;

export const mongodbConnection: ConnectionOptions = {
  type: "mongodb",
  url: `mongodb+srv://${MONGODB_USR}:${MONGODB_PASSWORD}@repocluster-exdit.mongodb.net/test?retryWrites=true&w=majority`,
  useNewUrlParser: true,
  useUnifiedTopology: true,
  synchronize: true,
  logging: false,
  entities: [User, Post],
  subscribers: ["src/subscriber/*.ts"],
  migrations: ["src/migration/*.ts"],
  cli: {
    entitiesDir: "src/entity",
    migrationsDir: "src/migration",
    subscribersDir: "src/subscriber",
  },
};
