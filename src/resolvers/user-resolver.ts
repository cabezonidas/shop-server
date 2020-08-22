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
import { isAuth, isAdmin } from "../auth/is-auth";
import { ObjectId } from "mongodb";
import { verify } from "jsonwebtoken";
import Mailgen from "mailgen";
import { sendMail } from "../integrations";

const emailRegex = new RegExp(
  /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
);

const MailGenerator = new Mailgen({
  theme: "default",
  product: {
    name: "Latam Investing Club",
    link: "https://lataminvestingclub.com",
    copyright: `Copyright © ${new Date().getFullYear()} Latam Investing Club.`,
  },
});

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

  @Field({ nullable: true })
  twitter?: string;

  @Field(() => [LocalizedDescription], { nullable: true })
  description?: LocalizedDescription[];
}

@InputType()
class CreateUserInput {
  @Field()
  name: string;

  @Field()
  email: string;

  @Field(() => [String])
  roles: string[];
}

@ObjectType()
class LoginResponse {
  @Field()
  public accessToken: string;
  @Field(() => User)
  public user: User;
  @Field(() => Boolean, { nullable: true })
  public needsPassword?: boolean;
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
    email = email.toLowerCase();
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
      needsPassword: false,
    };
  }

  @Mutation(() => LoginResponse)
  public async loginWithToken(
    @Arg("email") email: string,
    @Arg("token") token: string,
    @Ctx() { req, res }: IGraphqlContext
  ): Promise<LoginResponse> {
    email = email.toLowerCase();
    const user = await User.findOne({ where: { email } });
    if (!user || !user.accessCodeExpiry) {
      throw new Error(req.t("errors.invalid_login"));
    }

    const code = user.accessCodeExpiry.toString().toString().substr(9, 4);
    const valid = code === token && Date.now() < user.accessCodeExpiry;
    if (!valid) {
      throw new Error(req.t("errors.invalid_token"));
    }

    user.accessCodeExpiry = undefined;
    await user.save();

    sendRefreshToken(res, createRefreshToken(user));

    return {
      accessToken: createAccessToken(user),
      user,
      needsPassword: true,
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

  @Mutation(() => LoginResponse)
  public async register(
    @Arg("email") email: string,
    @Arg("password") password: string,
    @Ctx() { res, req }: IGraphqlContext
  ) {
    email = email.toLowerCase();
    const hashedPassword = await hash(password, 12);
    const user = await User.findOne({ email });
    if (user) {
      throw new Error(req.t("errors.account_already_taken"));
    }

    const newUser = new User();
    newUser.email = email;
    newUser.password = hashedPassword;

    await User.insert(newUser);

    sendRefreshToken(res, createRefreshToken(newUser));

    return {
      accessToken: createAccessToken(newUser),
      user: newUser,
      needsPassword: false,
    };
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
    user.twitter = input.twitter;
    user.description = input.description as typeof user.description;

    return await user.save();
  }
  @Mutation(() => User)
  @UseMiddleware(isAdmin)
  public async setUserRole(
    @Arg("_id") _id: string,
    @Arg("roleId") roleId: string,
    @Arg("add") add: boolean,
    @Ctx() { req }: IGraphqlContext
  ) {
    const user = await User.findOne(_id);
    if (!user) {
      throw new Error(req.t("errors.user_not_found"));
    }
    user.roles = (user.roles ?? []).filter(r => r !== roleId);
    if (add) {
      user.roles = [...user.roles, roleId];
    }
    return await user.save();
  }
  @Mutation(() => User)
  @UseMiddleware(isAdmin)
  public async createUser(@Arg("input") input: CreateUserInput, @Ctx() { req }: IGraphqlContext) {
    input.email = input.email.toLowerCase();
    const { email, name, roles } = input;
    let user = await User.findOne({ email });
    if (user) {
      throw new Error(req.t("errors.account_already_taken"));
    }
    user = new User();
    user.email = email;
    user.name = name;
    user.roles = roles;
    return await user.save();
  }

  @Query(() => [Role])
  public async roles(@Ctx() context: IGraphqlContext) {
    const roles = [
      new Role("admin", context.req.t("roles.admin")),
      new Role("author", context.req.t("roles.author")),
      new Role("networker", context.req.t("roles.networker")),
      new Role("real-state", context.req.t("roles.real-state")),
    ];
    return roles;
  }

  @Query(() => [User])
  public getStaff() {
    return User.find({
      where: {
        $or: [
          { roles: { $elemMatch: { $eq: "admin" } } },
          { roles: { $elemMatch: { $eq: "author" } } },
        ],
      },
    });
  }

  @Query(() => Boolean)
  public async loginRequiresCode(
    @Arg("email", () => String)
    email: string,
    @Ctx()
    { req: { t } }: IGraphqlContext
  ) {
    email = email.toLowerCase();
    if (!emailRegex.test(email)) {
      throw new Error(t("mails.signup.invalid_email"));
    }

    const user = (await User.findOne({ where: { email } })) ?? new User();

    if (!user.password) {
      user.email = email;
      user.accessCodeExpiry = Date.now() + 600000;
      const code = user.accessCodeExpiry.toString().toString().substr(9, 4);
      await user.save();
      const html = MailGenerator.generate({
        body: {
          greeting: t("mails.signup.greeting"),
          signature: t("mails.signup.signature"),
          name: email,
          intro: [
            t("mails.signup.intro_1"),
            t("mails.signup.intro_2"),
            t("mails.signup.action_instruction", { code }),
          ],
          outro: [t("mails.signup.questions"), t("mails.signup.questions_action")],
        },
      });
      await sendMail({
        subject: t("mails.signup.subject", { code }),
        to: email,
        html,
      });
      return true;
    } else {
      return false;
    }
  }

  @Mutation(() => Boolean)
  public async renewCodeLogin(
    @Arg("email", () => String)
    email: string,
    @Ctx()
    { req: { t } }: IGraphqlContext
  ) {
    email = email.toLowerCase();
    if (!emailRegex.test(email)) {
      throw new Error(t("mails.signup.invalid_email"));
    }

    const user = await User.findOne({ where: { email } });

    if (!user) {
      throw new Error(t("errors.invalid_login"));
    }

    user.accessCodeExpiry = Date.now() + 600000;
    const code = user.accessCodeExpiry.toString().toString().substr(9, 4);
    await user.save();
    const html = MailGenerator.generate({
      body: {
        greeting: t("mails.signup.greeting"),
        signature: t("mails.signup.signature"),
        name: email,
        intro: [
          t("mails.signup.intro_1"),
          t("mails.signup.intro_2"),
          t("mails.signup.action_instruction", { code }),
        ],
        outro: [t("mails.signup.questions"), t("mails.signup.questions_action")],
      },
    });
    await sendMail({
      subject: t("mails.signup.subject", { code }),
      to: email,
      html,
    });
    return true;
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
