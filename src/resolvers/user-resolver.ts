import {
  Resolver,
  Query,
  Mutation,
  Arg,
  ObjectType,
  Field,
  Ctx,
  UseMiddleware,
} from "type-graphql";
import { User } from "../entity/user";
import { hash, compare } from "bcryptjs";
import { IGraphqlContext } from "../igraphql-context";
import { createRefreshToken, createAccessToken, sendRefreshToken } from "../auth/tokens";
import { isAuth } from "../auth/is-auth";
import { ObjectId } from "mongodb";
import { verify } from "jsonwebtoken";

@ObjectType()
class LoginResponse {
  @Field()
  public accessToken: string;
  @Field(() => User)
  public user: User;
}

@Resolver()
export class UserResolver {
  @Query(() => [User])
  @UseMiddleware(isAuth)
  public async users() {
    return await User.find();
  }

  @Query(() => String)
  public hello() {
    return "hello!";
  }

  @Query(() => User, { nullable: true })
  public me(@Ctx() context: IGraphqlContext) {
    const authorization = context.req.headers.authorization;

    if (!authorization) {
      return null;
    }

    try {
      const token = authorization.split(" ")[1];
      const payload: any = verify(token, process.env.ACCESS_TOKEN_SECRET);
      return User.findOne(payload.userId);
    } catch (err) {
      return null;
    }
  }

  @Mutation(() => LoginResponse)
  public async login(
    @Arg("email") email: string,
    @Arg("password") password: string,
    @Ctx() { req, res }: IGraphqlContext
  ): Promise<LoginResponse> {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      throw new Error(req.t("errors.invalid_login"));
    }

    const valid = await compare(password, user.password);
    if (!valid) {
      throw new Error(req.t("errors.invalid_password"));
    }

    sendRefreshToken(res, createRefreshToken(user));

    return {
      accessToken: createAccessToken(user),
      user,
    };
  }

  @Mutation(() => Boolean)
  public async logout(@Ctx() { res }: IGraphqlContext) {
    sendRefreshToken(res, "");

    return true;
  }

  @Mutation(() => Boolean)
  // Maybe forgot password?
  public async revokeRefreshTokenForUser(@Arg("userId", () => String) userId: string) {
    const user = await User.findOne({ _id: new ObjectId(userId) });

    if (user) {
      const { tokenVersion } = user;
      user.tokenVersion = isNaN(tokenVersion) ? 0 : tokenVersion + 1;
      await user.save();
    }

    return true;
  }

  @Mutation(() => Boolean)
  public async register(@Arg("email") email: string, @Arg("password") password: string) {
    const hashedPassword = await hash(password, 12);
    try {
      await User.insert({ email, password: hashedPassword });
    } catch (err) {
      return false;
    }
    return true;
  }
}
