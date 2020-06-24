import { Entity, BaseEntity, ObjectIdColumn, ObjectID, Column } from "typeorm";
import { ObjectType, Field } from "type-graphql";
import { User } from "./user";

@ObjectType()
class PostData extends BaseEntity {
  @Field(() => User, { nullable: true })
  @Column()
  public author?: User;

  @Field({ nullable: true })
  @Column()
  public created?: number;

  @Field({ nullable: true })
  @Column()
  public updated?: number;

  @Field({ nullable: true })
  @Column()
  public published?: number;

  @Field({ nullable: true })
  @Column()
  public language: string;

  @Field({ nullable: true })
  @Column()
  public title: string;

  @Field({ nullable: true })
  @Column()
  public description: string;

  @Field({ nullable: true })
  @Column()
  public body: string;

  @Field(() => [String], { nullable: true })
  @Column()
  public tags: string[];
}

@ObjectType()
@Entity("posts")
export class Post extends PostData {
  @Field(() => String)
  @ObjectIdColumn()
  public _id: ObjectID;

  @Field({ nullable: true })
  @Column()
  public deleted?: number;

  @Field(() => [PostData])
  @Column()
  public translations: PostData[];

  @Field({ nullable: true })
  @Column()
  public starred?: boolean;
}
