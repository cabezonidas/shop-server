import { Entity, Column, BaseEntity, ObjectIdColumn, ObjectID } from "typeorm";
import { ObjectType, Field } from "type-graphql";

@ObjectType()
@Entity("users")
export class User extends BaseEntity {
  @Field(() => String)
  @ObjectIdColumn()
  public _id: ObjectID;

  @Field()
  @Column()
  public email: string;

  @Column()
  public password: string;

  @Column("int", { default: 0 })
  public tokenVersion: number;
}
