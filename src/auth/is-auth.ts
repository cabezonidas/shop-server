import { MiddlewareFn } from "type-graphql";
import { IGraphqlContext } from "../igraphql-context";
import { verify } from "jsonwebtoken";

export const isAuth: MiddlewareFn<IGraphqlContext> = ({ context }, next) => {
  const authorization = context.req.headers.authorization;

  if (!authorization) {
    throw new Error(context.req.t("errors.not_authenticated"));
  }

  try {
    const token = authorization.split(" ")[1];
    const payload = verify(token, process.env.ACCESS_TOKEN_SECRET);
    context.payload = payload as any;
  } catch (err) {
    throw new Error(context.req.t("errors.not_authenticated"));
  }

  return next();
};
