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
import { connectToDatabase } from "./db";
import { MediaResolver } from "./resolvers/media-resolver";
import { MailResolver } from "./resolvers/mail-resolver";
import cors from "cors";

const server = (() => {
  const app = express();

  if (process.env.NODE_ENV === "development") {
    app.use(cors({ origin: true, credentials: true }));
  }

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

  if (process.env.NODE_ENV === "development") {
    const port = 8899;
    connectToDatabase().then(() => {
      app.listen({ port }, () => console.log(`Server ready at http://localhost:${port}`));
    });
  } else {
    app.use(awsServerlessExpressMiddleware.eventContext());
  }
  return app;
})();

export default server;
