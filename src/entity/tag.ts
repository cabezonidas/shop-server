import { Entity, Column, BaseEntity, ObjectIdColumn, ObjectID } from "typeorm";
import { ObjectType, Field } from "type-graphql";

@ObjectType()
@Entity("tags")
export class Tag extends BaseEntity {
  @ObjectIdColumn()
  public _id: ObjectID;

  @Field()
  @Column()
  public tag: string;

  @Field()
  @Column()
  public localeId: string;
}
