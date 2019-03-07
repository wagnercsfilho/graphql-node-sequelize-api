import { GraphQLResolveInfo } from "graphql";
import { DbConnection } from "../../../interfaces/DbConnectionInterface";
import { Transaction } from "sequelize";
import { PostInstance } from "../../../models/PostModel";
import { handleError, throwError } from "../../../utils/utils";
import { compose } from "../../composable/composable.resolver";
import { authResolver } from "../../composable/auth.resolver";
import { AuthUser } from "../../../interfaces/AuthUserInterface";
import { DataLoaders } from "../../../interfaces/DataLoadersInterface";

export const postResolvers = {
  Post: {
    author: (
      post,
      args,
      {
        db,
        dataloaders: { userLoader }
      }: { db: DbConnection; dataloaders: DataLoaders },
      info: GraphQLResolveInfo
    ) => {
      return userLoader
        .load({ key: post.get("author"), info })
        .catch(handleError);
    },

    comments: (
      post,
      { first = 10, offset = 0 },
      { db }: { db: DbConnection },
      info: GraphQLResolveInfo
    ) => {
      return db.Comment.findAll({
        where: { post: post.get("id") },
        limit: first,
        offset
      }).catch(handleError);
    }
  },

  Query: {
    posts: (
      parent,
      { first = 10, offset = 0 },
      { db }: { db: DbConnection },
      info: GraphQLResolveInfo
    ) => {
      return db.Post.findAll({
        limit: first,
        offset: offset
      }).catch(handleError);
    },
    post: (
      parent,
      { id },
      { db }: { db: DbConnection },
      info: GraphQLResolveInfo
    ) => {
      id = parseInt(id);
      return db.Post.findById(id)
        .then((post: PostInstance) => {
          if (!post) {
            throw new Error(`Post with id ${id} not found`);
          }
          return post;
        })
        .catch(handleError);
    }
  },

  Mutation: {
    createPost: compose(authResolver)(
      (
        parent,
        { input },
        { db, authUser }: { db: DbConnection; authUser: AuthUser },
        info: GraphQLResolveInfo
      ) => {
        return db.sequelize
          .transaction((t: Transaction) => {
            return db.Post.create(
              { ...input, author: authUser.id },
              { transaction: t }
            );
          })
          .catch(handleError);
      }
    ),

    updatePost: compose(authResolver)(
      (
        parent,
        { id, input },
        { db, authUser }: { db: DbConnection; authUser: AuthUser },
        info: GraphQLResolveInfo
      ) => {
        id = parseInt(id);
        return db.sequelize
          .transaction((t: Transaction) => {
            return db.Post.findById(id).then((post: PostInstance) => {
              throwError(!post, `Post with id ${id} not found`);
              throwError(
                authUser.id !== post.get("author"),
                `Unauthorized post update`
              );
              return post.update(input, { transaction: t });
            });
          })
          .catch(handleError);
      }
    ),

    deletePost: compose(authResolver)(
      (
        parent,
        { id },
        { db, authUser }: { db: DbConnection; authUser: AuthUser },
        info: GraphQLResolveInfo
      ) => {
        id = parseInt(id);
        return db.sequelize
          .transaction((t: Transaction) => {
            return db.Post.findById(id).then((post: PostInstance) => {
              throwError(!post, `Post with id ${id} not found`);
              throwError(
                authUser.id !== post.get("author"),
                `Unauthorized post delete`
              );
              return post
                .destroy({ transaction: t })
                .then(() => true)
                .catch(() => false);
            });
          })
          .catch(handleError);
      }
    )
  }
};
