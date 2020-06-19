import { MiddlewareFn } from "type-graphql";
import { IGraphqlContext } from "../igraphql-context";
import { verify } from "jsonwebtoken";
import { TFunction } from "i18next";

const getValidPayload = (authorization: string, t: TFunction) => {
  if (!authorization) {
    throw new Error(t("errors.not_authenticated"));
  }

  try {
    const token = authorization.split(" ")[1];
    const payload = verify(token, process.env.ACCESS_TOKEN_SECRET);
    return payload;
  } catch (err) {
    throw new Error(t("errors.not_authenticated"));
  }
};

export const isAuth: MiddlewareFn<IGraphqlContext> = ({ context }, next) => {
  const authorization = context.req.headers.authorization;
  const payload = getValidPayload(authorization, context.req.t);
  context.payload = payload as any;
  return next();
};

export const isAuthor: MiddlewareFn<IGraphqlContext> = ({ context }, next) => {
  const authorization = context.req.headers.authorization;
  const payload = getValidPayload(authorization, context.req.t);
  context.payload = payload as any;

  if (context.payload?.roles?.includes("author")) {
    next();
  }

  throw new Error(context.req.t("errors.not_privileges")); // Agregar error key!
};

export const isAdmin: MiddlewareFn<IGraphqlContext> = ({ context }, next) => {
  const authorization = context.req.headers.authorization;
  const payload = getValidPayload(authorization, context.req.t);
  context.payload = payload as any;

  if (context.payload?.roles?.includes("admin")) {
    next();
  }

  throw new Error(context.req.t("errors.not_privileges")); // Agregar error key!
};
