import { User } from "../entity/user";
import { sign } from "jsonwebtoken";
import { Response } from "express";

export const createRefreshToken = (user: User) =>
  sign({ userId: user._id, tokenVersion: user.tokenVersion }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: "7d",
  });

export const createAccessToken = (user: User) =>
  sign({ userId: user._id, roles: user.roles }, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: "15min",
  });

export const sendRefreshToken = (res: Response, token: string) => {
  const { NODE_ENV } = process.env;
  return ((res as unknown) as any).cookie("jid", token, {
    httpOnly: true,
    sameSite: "none",
    secure: NODE_ENV !== "development",
    domain:
      NODE_ENV === "production"
        ? ".lataminvestingclub.com"
        : NODE_ENV === "staging"
        ? ".javascript.kiwi"
        : undefined,
  });
};
