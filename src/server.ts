import "dotenv/config";
import "reflect-metadata";
import cookieParser from "cookie-parser";
import express from "express";
import { ApolloServer } from "apollo-server-express";
import { buildSchemaSync } from "type-graphql";
import { UserResolver } from "./resolvers/user-resolver";
import { router } from "./router";
import { translation } from "./middleware";
import awsServerlessExpressMiddleware from "aws-serverless-express/middleware";
import { MediaResolver } from "./resolvers/media-resolver";
import { MailResolver } from "./resolvers/mail-resolver";

const server = (() => {
  const app = express();

  app.use(translation);
  app.use(cookieParser());
  app.use("/", router);

  const apolloServer = new ApolloServer({
    introspection: true,
    schema: buildSchemaSync({
      resolvers: [UserResolver, MediaResolver, MailResolver],
      validate: false,
    }),
    context: ({ req, res }) => ({ req, res }),
  });
  apolloServer.applyMiddleware({ app, cors: false });

  app.use(awsServerlessExpressMiddleware.eventContext());

  return app;
})();

export default server;
