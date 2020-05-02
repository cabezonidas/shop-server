import { createServer, proxy } from "aws-serverless-express";
import app from "./server";
import { connectToDatabase } from "./db";
import { Context } from "aws-lambda";
import middy from "@middy/core";
import cors from "@middy/http-cors";
import httpErrorHandler from "@middy/http-error-handler";

const binaryMimeTypes = [
  "application/octet-stream",
  "font/eot",
  "font/opentype",
  "font/otf",
  "image/jpeg",
  "image/png",
  "image/svg+xml",
];

const server = createServer(app, null, binaryMimeTypes);

export const handler = middy(async (event: any, context: Context) => {
  context.callbackWaitsForEmptyEventLoop = false;
  await connectToDatabase();
  return proxy(server, event, context, "PROMISE").promise;
})
  .use(httpErrorHandler())
  .use(cors({ credentials: true }));
