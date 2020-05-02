import { Document, Schema, model } from "mongoose";

export interface IProduct extends Document {
  title: string;
  description?: string;
  createdAt: Date;
}

export const ProductSchema = new Schema<IProduct>({
  title: { type: String, required: true },
  description: { type: String },
  createdAt: { type: Date, required: true },
});

export const Product = model<IProduct>("Product", ProductSchema);

export default Product;
