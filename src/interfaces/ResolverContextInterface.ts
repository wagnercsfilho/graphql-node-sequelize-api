import { DbConnection } from "./DbConnectionInterface";
import { AuthUser } from "./AuthUserInterface";
import { DataLoaders } from "./DataLoadersInterface";
import { RequestedFields } from "../graphql/ast/RequestedFields";

export interface ResolveContext {
  db?: DbConnection;
  authorization?: string;
  authUser?: AuthUser;
  dataLoaders?: DataLoaders;
  requestedFields?: RequestedFields;
}
