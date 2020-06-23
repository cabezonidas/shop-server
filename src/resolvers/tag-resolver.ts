import { Resolver, Query, Mutation, Arg, UseMiddleware } from "type-graphql";
import { isAuth } from "../auth/is-auth";
import { Tag } from "../entity/tag";

@Resolver()
export class TagResolver {
  @Query(() => [Tag])
  @UseMiddleware(isAuth)
  public allTags(@Arg("localeId") localeId: string) {
    return Tag.find({ where: { localeId: { $eq: localeId } } });
  }

  @Mutation(() => [Tag])
  @UseMiddleware(isAuth)
  public async addTag(@Arg("localeId") localeId: string, @Arg("tag") tag: string) {
    const tags = await Tag.find({
      where: { localeId: { $eq: localeId }, tag: { $eq: tag } },
    });
    if (tags.length === 0) {
      await Tag.insert({ localeId, tag });
    }
    return Tag.find({ where: { localeId: { $eq: localeId } } });
  }

  @Mutation(() => [Tag])
  @UseMiddleware(isAuth)
  public async removeTag(@Arg("localeId") localeId: string, @Arg("tag") tag: string) {
    const tagFound = await Tag.findOne({
      where: { localeId: { $eq: localeId }, tag: { $eq: tag } },
    });
    if (tagFound) {
      await tagFound.remove();
    }
    return Tag.find({ where: { localeId: { $eq: localeId } } });
  }
}
