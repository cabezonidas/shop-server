import { Response, Request } from "express";
import { i18n } from "i18next";

export interface IGraphqlContext {
  req: Request & i18n;
  res: Response;
  payload?: { userId: string; roles?: string[] };
}
