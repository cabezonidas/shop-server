import { Router } from "express";
import { verify } from "jsonwebtoken";
import { User } from "../entity/user";
import { createAccessToken, createRefreshToken, sendRefreshToken } from "../auth/tokens";
import { ObjectId } from "mongodb";

export const router = Router();

router.route("/").get((_, res) => res.send("Home route"));
router.route("/graphql").options((_, res) => res.send({ ok: true }));
router.route("/refresh_token").post(async (req, res) => {
  const token = req.cookies.jid;

  const sendUnauthenticated = () => res.send({ ok: false });

  if (!token) {
    return sendUnauthenticated();
  }
  let payload = null;
  try {
    payload = verify(token, process.env.REFRESH_TOKEN_SECRET);
  } catch (err) {
    return sendUnauthenticated();
  }

  const user = await User.findOne({ _id: new ObjectId(payload.userId) });

  if (!user) {
    return sendUnauthenticated();
  }

  if (user.tokenVersion !== payload.tokenVersion) {
    return sendUnauthenticated();
  }

  sendRefreshToken(res, createRefreshToken(user));
  return res.send({ ok: true, accessToken: createAccessToken(user) });
});

export default router;
