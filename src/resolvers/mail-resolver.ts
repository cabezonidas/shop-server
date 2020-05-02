import { Resolver, Query } from "type-graphql";
import { getLabels } from "../integrations";

@Resolver()
export class MailResolver {
  @Query(() => [String])
  public async labels() {
    return await getLabels();
  }
}
