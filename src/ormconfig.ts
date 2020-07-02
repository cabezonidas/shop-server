import { ConnectionOptions } from "typeorm";
import { User } from "./entity/user";
import { Post } from "./entity/post";
import { Tag } from "./entity/tag";

const { MONGODB_USR, MONGODB_PASSWORD, NODE_ENV } = process.env;

const db = NODE_ENV === "production" ? "prod" : "test";

export const mongodbConnection: ConnectionOptions = {
  type: "mongodb",
  url: `mongodb+srv://${MONGODB_USR}:${MONGODB_PASSWORD}@repocluster-exdit.mongodb.net/${db}?retryWrites=true&w=majority`,
  useNewUrlParser: true,
  useUnifiedTopology: true,
  synchronize: true,
  logging: false,
  entities: [User, Post, Tag],
  subscribers: ["src/subscriber/*.ts"],
  migrations: ["src/migration/*.ts"],
  cli: {
    entitiesDir: "src/entity",
    migrationsDir: "src/migration",
    subscribersDir: "src/subscriber",
  },
};
