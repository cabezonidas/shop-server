import { Entity, Column, BaseEntity, ObjectIdColumn, ObjectID } from "typeorm";
import { ObjectType, Field, Float } from "type-graphql";

@ObjectType()
class UserDescription {
  @Field()
  @Column()
  public localeId: string;

  @Field()
  @Column()
  public text: string;
}

@ObjectType()
@Entity("users")
export class User extends BaseEntity {
  @Field(() => String)
  @ObjectIdColumn()
  public _id: ObjectID;

  @Field()
  @Column()
  public email: string;

  @Field(() => [String], { nullable: true })
  @Column()
  public roles: [string];

  @Field(() => Float, { nullable: true })
  @Column()
  public dob: number;

  @Field(() => String, { nullable: true })
  @Column()
  public name: string;

  @Field(() => String, { nullable: true })
  @Column()
  public imageUrl: string;

  @Field(() => String, { nullable: true })
  @Column()
  public linkedin: string;

  @Field(() => String, { nullable: true })
  @Column()
  public whatsapp: string;

  @Field(() => String, { nullable: true })
  @Column()
  public instagram: string;

  @Field(() => String, { nullable: true })
  @Column()
  public facebook: string;

  @Field(() => String, { nullable: true })
  @Column()
  public messenger: string;

  @Field(() => String, { nullable: true })
  @Column()
  public github: string;

  @Field(() => String, { nullable: true })
  @Column()
  public twitter: string;

  @Field(() => [UserDescription], { nullable: true })
  @Column()
  public description: [UserDescription];

  @Column()
  public password: string;

  @Column("int", { default: 0 })
  public tokenVersion: number;

  @Column()
  public accessCodeExpiry: number;
}
