import { User } from "../entity/user";
import { sign } from "jsonwebtoken";
import { Response } from "express";

export const createRefreshToken = (user: User) =>
  sign({ userId: user._id, tokenVersion: user.tokenVersion }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: "7d",
  });

export const createAccessToken = (user: User) =>
  sign({ userId: user._id }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "15min" });

export const sendRefreshToken = (res: Response, token: string) => {
  const { NODE_ENV } = process.env;
  let suffixPath = "";
  switch (NODE_ENV) {
    case "development": {
      suffixPath = "";
      break;
    }
    case "test": {
      suffixPath = "/test";
      break;
    }
    case "prd":
    case "production": {
      suffixPath = "";
      break;
    }
  }
  const path = `${suffixPath}/refresh_token`;
  return ((res as unknown) as any).cookie("jid", token, {
    httpOnly: true,
    path,
    sameSite: "none",
    secure: true,
  });
};
