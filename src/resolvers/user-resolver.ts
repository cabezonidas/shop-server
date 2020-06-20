import {
  Resolver,
  Query,
  Mutation,
  Arg,
  ObjectType,
  Field,
  Ctx,
  UseMiddleware,
  InputType,
} from "type-graphql";
import { User } from "../entity/user";
import { hash, compare } from "bcryptjs";
import { IGraphqlContext } from "../igraphql-context";
import { createRefreshToken, createAccessToken, sendRefreshToken } from "../auth/tokens";
import { isAuth } from "../auth/is-auth";
import { ObjectId } from "mongodb";
import { verify } from "jsonwebtoken";

@InputType()
class LocalizedDescription {
  @Field()
  public localeId: string;

  @Field()
  public text: string;
}
@InputType()
class EditProfileInput {
  @Field({ nullable: true })
  _id: string;

  @Field({ nullable: true })
  name?: string;

  @Field({ nullable: true })
  dob?: number;

  @Field({ nullable: true })
  imageUrl?: string;

  @Field({ nullable: true })
  linkedin?: string;

  @Field({ nullable: true })
  whatsapp?: string;

  @Field({ nullable: true })
  instagram?: string;

  @Field({ nullable: true })
  facebook?: string;

  @Field({ nullable: true })
  messenger?: string;

  @Field({ nullable: true })
  github?: string;

  @Field(() => [LocalizedDescription], { nullable: true })
  description?: LocalizedDescription[];
}

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

  @Mutation(() => User)
  @UseMiddleware(isAuth)
  public async updateProfile(
    @Arg("input") input: EditProfileInput,
    @Ctx() { payload, req: { t } }: IGraphqlContext
  ) {
    if (payload.userId !== input._id) {
      throw new Error(t("errors.not_privileges"));
    }
    const user = await User.findOne(payload.userId);
    if (!user) {
      throw new Error(t("errors.user_not_found"));
    }

    user.name = input.name;
    user.dob = input.dob;
    user.imageUrl = input.imageUrl;
    user.linkedin = input.linkedin;
    user.whatsapp = input.whatsapp;
    user.instagram = input.instagram;
    user.facebook = input.facebook;
    user.messenger = input.messenger;
    user.github = input.github;
    user.description = input.description as typeof user.description;

    return await user.save();
  }

  @Query(() => [Role])
  public async roles(@Ctx() context: IGraphqlContext) {
    const roles = [
      new Role("admin", context.req.t("roles.admin")),
      new Role("author", context.req.t("roles.author")),
    ];
    return roles;
  }
}

@ObjectType()
class Role {
  constructor(_id: string, _name: string) {
    this.id = _id;
    this.name = _name;
  }

  @Field(() => String)
  public id: string;

  @Field(() => String)
  public name: string;
}
