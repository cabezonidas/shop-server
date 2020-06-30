import { createServer, proxy } from "aws-serverless-express";
import app from "./server";
import { connectToDatabase } from "./db";
import { Context } from "aws-lambda";
import middy from "@middy/core";
import cors from "@middy/http-cors";
import httpErrorHandler from "@middy/http-error-handler";

const server = createServer(app, null);

export const handler = middy(async (event: any, context: Context) => {
  context.callbackWaitsForEmptyEventLoop = false;
  await connectToDatabase();
  return proxy(server, event, context, "PROMISE").promise;
})
  .use(httpErrorHandler())
  .use(
    cors({
      origins: [
        "http://localhost:3000",
        "https://shop-public.now.sh",
        "https://admin.javascript.kiwi",
        "https://www.javascript.kiwi",
        "https://javascript.kiwi",
      ],
      credentials: true,
      headers:
        "Access-Control-Request-Method, Access-Control-Request-Headers, Origin, Content-Type, authorization",
    })
  );
