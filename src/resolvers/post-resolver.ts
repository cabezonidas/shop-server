import {
  Resolver,
  Query,
  Ctx,
  Mutation,
  UseMiddleware,
  Arg,
  ObjectType,
  Field,
} from "type-graphql";
import { isAuthor } from "../auth/is-auth";
import { IGraphqlContext } from "../igraphql-context";
import { Post } from "../entity/post";
import { User } from "../entity/user";
import { ObjectID } from "typeorm";

export const postsEnUs = {
  cant_add_translation_same_language:
    "Cannot add a translation of the same language of the original post",
  post_not_found: "Post not found",
};
export const postsEsAr = {
  cant_add_translation_same_language:
    "No se puede agregar una traducción del mismo idioma que la entrada original",
  post_not_found: "Entrada no encontrada",
};

@Resolver()
export class PostResolver {
  @Query(() => [Post])
  @UseMiddleware(isAuthor)
  public allPosts() {
    return Post.find({ where: { created: { $ne: undefined }, deleted: { $eq: undefined } } });
  }

  @Query(() => [Post])
  @UseMiddleware(isAuthor)
  public allPostDrafts() {
    return Post.find({ where: { created: undefined, deleted: { $eq: undefined } } });
  }

  @Query(() => Post, { nullable: true })
  @UseMiddleware(isAuthor)
  public async getDraft(@Arg("_id") _id: string, @Ctx() { req: { t } }: IGraphqlContext) {
    const post = await Post.findOne(_id);
    if (post && !post.created) {
      return post;
    } else {
      throw new Error(t("errors.posts.post_not_found"));
    }
  }

  @Query(() => Post, { nullable: true })
  @UseMiddleware(isAuthor)
  public async getPost(@Arg("_id") _id: string, @Ctx() { req: { t } }: IGraphqlContext) {
    const post = await Post.findOne(_id);
    if (post && !!post.created) {
      return post;
    } else {
      throw new Error(t("errors.posts.post_not_found"));
    }
  }

  @Mutation(() => Post)
  @UseMiddleware(isAuthor)
  /**
   * Logic for posts and drafts are the same
   */
  public createDraft() {
    return Post.create({ translations: [] }).save();
  }

  @Mutation(() => Boolean)
  @UseMiddleware(isAuthor)
  public async deletePost(@Arg("_id") _id: string, @Ctx() { req: { t } }: IGraphqlContext) {
    const post = await Post.findOne(_id);
    if (post) {
      post.deleted = Date.now();
      await post.save();
      return true;
    }
    throw new Error(t("errors.posts.post_not_found"));
  }

  @Mutation(() => Post)
  @UseMiddleware(isAuthor)
  public async saveDraft(
    @Arg("_id") _id: string,
    @Arg("language") language: string,
    @Arg("title") title: string,
    @Arg("description") description: string,
    @Arg("body") body: string,
    @Arg("tags", () => [String]) tags: string[],
    @Ctx() { req: { t } }: IGraphqlContext
  ) {
    const post = await Post.findOne(_id);
    if (post) {
      post.title = title;
      post.description = description;
      post.body = body;
      post.language = language;
      post.tags = tags;
      return post.save();
    }
    throw new Error(t("errors.posts.post_not_found"));
  }

  @Mutation(() => Post)
  @UseMiddleware(isAuthor)
  /**
   * Similar to save draft, except it stamps author and created, which turns it from draft to post
   * This draft gets created and author stamps
   */
  public async savePost(
    @Arg("_id") _id: string,
    @Arg("language") language: string,
    @Arg("title") title: string,
    @Arg("description") description: string,
    @Arg("body") body: string,
    @Arg("tags", () => [String]) tags: string[],
    @Ctx() { payload, req: { t } }: IGraphqlContext
  ) {
    const post = await Post.findOne(_id);
    if (post) {
      post.author = await User.findOne(payload.userId);
      post.created = post.created || Date.now();
      post.updated = Date.now();
      post.title = title;
      post.description = description;
      post.body = body;
      post.tags = tags;
      post.language = post.language || language;
      return post.save();
    }
    throw new Error(t("errors.posts.post_not_found"));
  }

  @Mutation(() => Post)
  @UseMiddleware(isAuthor)
  public async publishPost(@Arg("_id") _id: string, @Ctx() { req: { t } }: IGraphqlContext) {
    const post = await Post.findOne(_id);
    if (post) {
      if (post.created && !post.deleted) {
        post.published = Date.now();
        return post.save();
      }
    }
    throw new Error(t("errors.posts.post_not_found"));
  }

  @Mutation(() => Post)
  @UseMiddleware(isAuthor)
  public async unpublishPost(@Arg("_id") _id: string, @Ctx() { req: { t } }: IGraphqlContext) {
    const post = await Post.findOne(_id);
    if (post) {
      post.published = undefined;
      return post.save();
    }
    throw new Error(t("errors.posts.post_not_found"));
  }

  @Mutation(() => Post)
  @UseMiddleware(isAuthor)
  public async addTranslation(
    @Arg("_id") _id: string,
    @Arg("language") language: string,
    @Ctx() { req: { t } }: IGraphqlContext
  ) {
    const post = await Post.findOne(_id);
    if (post) {
      if (post.language === language) {
        throw new Error(t("errors.posts.cant_add_translation_same_language"));
      }
      if (post.translations.some(t => t.language === language)) {
        return post;
      } else {
        post.translations = [...post.translations, { language }] as typeof post.translations;
        return post.save();
      }
    }
    throw new Error(t("errors.posts.post_not_found"));
  }

  @Mutation(() => Post)
  @UseMiddleware(isAuthor)
  /**
   * There is no soft delete to translations
   */
  public async deleteTranslation(
    @Arg("_id") _id: string,
    @Arg("language") language: string,
    @Ctx() { req: { t } }: IGraphqlContext
  ) {
    const post = await Post.findOne(_id);
    if (post) {
      post.translations = post.translations.filter(t => t.language !== language);
      return post.save();
    }
    throw new Error(t("errors.posts.post_not_found"));
  }

  @Mutation(() => Post)
  @UseMiddleware(isAuthor)
  public async saveTranslationDraft(
    @Arg("_id") _id: string,
    @Arg("language") language: string,
    @Arg("title") title: string,
    @Arg("description") description: string,
    @Arg("body") body: string,
    @Arg("tags", () => [String]) tags: string[],
    @Ctx() { req: { t } }: IGraphqlContext
  ) {
    const post = await Post.findOne(_id);
    if (post) {
      post.translations = [
        ...post.translations.filter(t => t.language !== language),
        { title, description, body, language, tags },
      ] as typeof post.translations;
      return post.save();
    }
    throw new Error(t("errors.posts.post_not_found"));
  }

  @Mutation(() => Post)
  @UseMiddleware(isAuthor)
  public async saveTranslationPost(
    @Arg("_id") _id: string,
    @Arg("language") language: string,
    @Arg("title") title: string,
    @Arg("description") description: string,
    @Arg("body") body: string,
    @Arg("tags", () => [String]) tags: string[],
    @Ctx() { payload, req: { t } }: IGraphqlContext
  ) {
    const post = await Post.findOne(_id);
    const author = await User.findOne(payload.userId);
    if (post) {
      const translation = post.translations.find(t => t.language === language);
      const created = translation?.created ?? Date.now();
      const updated = Date.now();
      post.translations = [
        ...post.translations.filter(t => t.language !== language),
        { ...translation, title, description, body, language, author, created, updated, tags },
      ] as typeof post.translations;
      return post.save();
    }
    throw new Error(t("errors.posts.post_not_found"));
  }

  @Mutation(() => Post)
  @UseMiddleware(isAuthor)
  public async publishTranslationPost(
    @Arg("_id") _id: string,
    @Arg("language") language: string,
    @Ctx() { req: { t } }: IGraphqlContext
  ) {
    const post = await Post.findOne(_id);
    const published = Date.now();
    if (post) {
      post.translations = post.translations.map(t =>
        t.language === language ? { ...t, published } : t
      ) as typeof post.translations;
      return post.save();
    }
    throw new Error(t("errors.posts.post_not_found"));
  }

  @Mutation(() => Post)
  @UseMiddleware(isAuthor)
  public async unpublishTranslationPost(
    @Arg("_id") _id: string,
    @Arg("language") language: string,
    @Ctx() { req: { t } }: IGraphqlContext
  ) {
    const post = await Post.findOne(_id);
    if (post) {
      post.translations = post.translations.map(t =>
        t.language === language ? { ...t, published: undefined } : t
      ) as typeof post.translations;
      return post.save();
    }
    throw new Error(t("errors.posts.post_not_found"));
  }

  @Mutation(() => Post)
  @UseMiddleware(isAuthor)
  public async starPost(@Arg("_id") _id: string, @Ctx() { req: { t } }: IGraphqlContext) {
    const post = await Post.findOne(_id);
    if (post) {
      post.starred = !post.starred;
      return post.save();
    }
    throw new Error(t("errors.posts.post_not_found"));
  }

  // Public endpoints
  @Query(() => Post)
  public async getPublicPost(@Arg("_id") _id: string, @Ctx() { req: { t } }: IGraphqlContext) {
    const post = await Post.findOne(_id, { where: isPublicPost });

    if (post) {
      return mapPublicInfo(post);
    }
    throw new Error(t("errors.posts.post_not_found"));
  }

  @Query(() => LatestPosts)
  public async getLatestPublicPosts(@Arg("skip") skip: number, @Arg("take") take: number) {
    const [posts, count] = await Post.findAndCount({
      where: isPublicPost,
      order: { published: "DESC" },
      skip,
      take,
    });

    return new LatestPosts(
      posts.map(p => mapPublicInfo(p)),
      count
    );
  }

  @Query(() => [Post])
  public async getPinnedPublicPosts() {
    const posts = await Post.find({ where: isPublicPinned, order: { published: "DESC" } });
    return posts.map(p => mapPublicInfo(p));
  }

  @Query(() => [PublicPath])
  public async getPinnedPublicPaths() {
    const posts = (
      await Post.find({ where: isPublicPinned, order: { published: "DESC" } })
    ).map(p => mapPublicInfo(p));

    const result = posts.map(p => {
      const postPath: PublicPath = {
        _id: p._id,
        titles: [
          { localeId: p.language, title: p.title },
          ...p.translations.map(t => ({ localeId: t.language, title: t.title })),
        ].filter(t => !!(t.localeId && t.localeId)),
      };
      return postPath;
    });

    return result;
  }

  @Query(() => Post)
  public async getPinnedPublicPost(
    @Arg("_id") _id: string,
    @Ctx() { req: { t } }: IGraphqlContext
  ) {
    const post = await Post.findOne(_id, { where: isPublicPinned });
    if (post) {
      return mapPublicInfo(post);
    }
    throw new Error(t("errors.posts.post_not_found"));
  }
}

const isPublic = {
  $or: [
    {
      published: { $ne: undefined },
    },
    {
      translations: {
        $elemMatch: { published: { $ne: undefined }, deleted: { $eq: undefined } },
      },
    },
  ],
  $and: [{ deleted: { $eq: undefined } }],
};

const isPublicPost = { ...isPublic, $and: [...isPublic.$and, { starred: { $ne: true } }] };
const isPublicPinned = { ...isPublic, $and: [...isPublic.$and, { starred: { $eq: true } }] };

/* Remove data from post that isn't published */
const mapPublicInfo = (post: Post) => {
  Object.keys(post).map(key => {
    if (!["_id", "starred", "translations"].includes(key)) {
      delete post["key"];
    }
  });
  post.translations = post.translations.filter(t => !!t.published);
  return post;
};

@ObjectType()
class LatestPosts {
  @Field(() => [Post])
  public posts: Post[];
  @Field()
  public total: number;
  constructor(p: Post[], c: number) {
    this.posts = p;
    this.total = c;
  }
}

@ObjectType()
class PublicPath {
  @Field(() => String)
  public _id: ObjectID;
  @Field(() => [Title])
  public titles: Title[];
}
@ObjectType()
class Title {
  @Field()
  public localeId: string;
  @Field()
  public title: string;
}
