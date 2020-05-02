import { gql } from "apollo-server-express";

export const productTypeDefs = gql`
  type Product {
    id: String
    title: String
    description: String
    createdAt: String
  }
  type Query {
    products: [Product]
  }
  input CreateProductInput {
    title: String
    description: String
  }
  type Mutation {
    createProduct(product: CreateProductInput): Boolean
  }
`;

export default productTypeDefs;
