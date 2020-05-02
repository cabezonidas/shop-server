import { Resolver, Query, Mutation, Arg, ObjectType, Field, Ctx } from "type-graphql";
import {
  awsListAlbums,
  awsCreateAlbum,
  awsAddPhoto,
  awsViewAlbum,
  awsDeleteAlbum,
  awsDeletePhoto,
} from "../integrations";
import { Stream } from "stream";
import { GraphQLUpload } from "apollo-server-express";
import { IGraphqlContext } from "../igraphql-context";

// tslint:disable-next-line: interface-over-type-literal
type FileUpload = {
  filename: string;
  mimetype: string;
  encoding: string;
  createReadStream: () => Stream;
};

@ObjectType()
class AwsPhoto {
  @Field()
  public photoKey: string;
  @Field()
  public photoUrl: string;
  @Field()
  public name: string;
}

@Resolver()
export class MediaResolver {
  @Query(() => [String])
  public async getAlbums(
    @Ctx()
    { req: { t } }: IGraphqlContext
  ) {
    const res = await awsListAlbums();
    if (res.success) {
      return res.data;
    } else {
      throw new Error(t(res.error));
    }
  }

  @Query(() => [AwsPhoto])
  public async viewAlbum(
    @Arg("albumName", () => String)
    albumName: string,
    @Ctx()
    { req: { t } }: IGraphqlContext
  ) {
    const result = await awsViewAlbum(albumName);
    if (result.succeed) {
      return result.photos;
    } else {
      throw new Error(t(result.error));
    }
  }

  @Mutation(() => String)
  public async createAlbum(
    @Arg("albumName") albumName: string,
    @Ctx()
    { req: { t } }: IGraphqlContext
  ): Promise<string> {
    const result = await awsCreateAlbum(albumName);
    if (result.succeed) {
      return result.albumKey;
    } else {
      throw new Error(t(result.error));
    }
  }

  @Mutation(() => AwsPhoto)
  public async addPicture(
    @Arg("picture", () => GraphQLUpload)
    { filename, createReadStream }: FileUpload,
    @Arg("albumName", () => String)
    albumName: string
  ): Promise<AwsPhoto> {
    const stream = createReadStream();
    const upload = await awsAddPhoto(albumName, filename, stream);
    return upload;
  }

  @Mutation(() => Boolean)
  public async deleteAlbum(
    @Arg("albumName", () => String)
    albumName: string,
    @Ctx()
    { req: { t } }: IGraphqlContext
  ): Promise<boolean> {
    const deleted = await awsDeleteAlbum(albumName);
    if (deleted.succeed) {
      return true;
    } else {
      throw new Error(t(deleted.error));
    }
  }

  @Mutation(() => Boolean)
  public async deletePicture(
    @Arg("photoKey", () => String)
    photoKey: string,
    @Ctx()
    { req: { t } }: IGraphqlContext
  ): Promise<boolean> {
    const deleted = await awsDeletePhoto(photoKey);
    if (deleted.succeed) {
      return true;
    } else {
      throw new Error(t(deleted.error));
    }
  }
}
