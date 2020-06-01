import { Resolver, Query, Ctx, Mutation, UseMiddleware, Arg } from "type-graphql";
import { isAuth } from "../auth/is-auth";
import { IGraphqlContext } from "../igraphql-context";
import { Post } from "../entity/post";
import { User } from "../entity/user";

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
  @UseMiddleware(isAuth)
  public allPosts() {
    return Post.find({ where: { created: { $ne: undefined }, deleted: { $eq: undefined } } });
  }

  @Query(() => [Post])
  @UseMiddleware(isAuth)
  public allPostDrafts() {
    return Post.find({ where: { created: undefined, deleted: { $eq: undefined } } });
  }

  @Query(() => Post, { nullable: true })
  @UseMiddleware(isAuth)
  public async getDraft(@Arg("_id") _id: string, @Ctx() { req: { t } }: IGraphqlContext) {
    const post = await Post.findOne(_id);
    if (post && !post.created) {
      return post;
    } else {
      throw new Error(t("errors.posts.post_not_found"));
    }
  }

  @Query(() => Post, { nullable: true })
  @UseMiddleware(isAuth)
  public async getPost(@Arg("_id") _id: string, @Ctx() { req: { t } }: IGraphqlContext) {
    const post = await Post.findOne(_id);
    if (post && !!post.created) {
      return post;
    } else {
      throw new Error(t("errors.posts.post_not_found"));
    }
  }

  @Mutation(() => Post)
  @UseMiddleware(isAuth)
  /**
   * Logic for posts and drafts are the same
   */
  public createDraft() {
    return Post.create({ translations: [] }).save();
  }

  @Mutation(() => Boolean)
  @UseMiddleware(isAuth)
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
  @UseMiddleware(isAuth)
  public async saveDraft(
    @Arg("_id") _id: string,
    @Arg("language") language: string,
    @Arg("title") title: string,
    @Arg("description") description: string,
    @Arg("body") body: string,
    @Ctx() { req: { t } }: IGraphqlContext
  ) {
    const post = await Post.findOne(_id);
    if (post) {
      post.title = title;
      post.description = description;
      post.body = body;
      post.language = language;
      return post.save();
    }
    throw new Error(t("errors.posts.post_not_found"));
  }

  @Mutation(() => Post)
  @UseMiddleware(isAuth)
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
      post.language = post.language || language;
      return post.save();
    }
    throw new Error(t("errors.posts.post_not_found"));
  }

  @Mutation(() => Post)
  @UseMiddleware(isAuth)
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
  @UseMiddleware(isAuth)
  public async unpublishPost(@Arg("_id") _id: string, @Ctx() { req: { t } }: IGraphqlContext) {
    const post = await Post.findOne(_id);
    if (post) {
      post.published = undefined;
      return post.save();
    }
    throw new Error(t("errors.posts.post_not_found"));
  }

  @Mutation(() => Post)
  @UseMiddleware(isAuth)
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
  @UseMiddleware(isAuth)
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
  @UseMiddleware(isAuth)
  public async saveTranslationDraft(
    @Arg("_id") _id: string,
    @Arg("language") language: string,
    @Arg("title") title: string,
    @Arg("description") description: string,
    @Arg("body") body: string,
    @Ctx() { req: { t } }: IGraphqlContext
  ) {
    const post = await Post.findOne(_id);
    if (post) {
      post.translations = [
        ...post.translations.filter(t => t.language !== language),
        { title, description, body, language },
      ] as typeof post.translations;
      return post.save();
    }
    throw new Error(t("errors.posts.post_not_found"));
  }

  @Mutation(() => Post)
  @UseMiddleware(isAuth)
  public async saveTranslationPost(
    @Arg("_id") _id: string,
    @Arg("language") language: string,
    @Arg("title") title: string,
    @Arg("description") description: string,
    @Arg("body") body: string,
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
        { ...translation, title, description, body, language, author, created, updated },
      ] as typeof post.translations;
      return post.save();
    }
    throw new Error(t("errors.posts.post_not_found"));
  }

  @Mutation(() => Post)
  @UseMiddleware(isAuth)
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
  @UseMiddleware(isAuth)
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
}
