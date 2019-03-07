import { ComposableResolver } from "./composable.resolver";
import { ResolveContext } from "../../interfaces/ResolverContextInterface";
import { GraphQLFieldResolver } from "graphql";

export const authResolver: ComposableResolver<any, ResolveContext> = (
  resolve: GraphQLFieldResolver<any, ResolveContext>
): GraphQLFieldResolver<any, ResolveContext> => {
  return (parent, args, context: ResolveContext, info) => {
    if (context.authUser) {
      return resolve(parent, args, context, info);
    }
    throw new Error("Unauthorized! Token not provided!");
  };
};
