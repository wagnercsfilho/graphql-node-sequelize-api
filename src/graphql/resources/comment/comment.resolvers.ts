import { GraphQLResolveInfo } from "graphql";
import { DbConnection } from "../../../interfaces/DbConnectionInterface";
import { Transaction } from "sequelize";
import { CommentInstance } from "../../../models/CommentModel";
import { handleError, throwError } from "../../../utils/utils";
import { compose } from "../../composable/composable.resolver";
import { authResolver } from "../../composable/auth.resolver";
import { AuthUser } from "../../../interfaces/AuthUserInterface";
import { DataLoaders } from "../../../interfaces/DataLoadersInterface";

export const commentResolvers = {
  Comment: {
    user: (
      comment,
      args,
      {
        db,
        dataLoaders: { userLoader }
      }: { db: DbConnection; dataLoaders: DataLoaders },
      info: GraphQLResolveInfo
    ) => {
      return userLoader
        .load({ key: comment.get("user"), info })
        .catch(handleError);
    },

    post: (
      comment,
      args,
      {
        db,
        dataLoaders: { postLoader }
      }: { db: DbConnection; dataLoaders: DataLoaders },
      info: GraphQLResolveInfo
    ) => {
      return postLoader
        .load({ key: comment.get("post"), info })
        .catch(handleError);
    }
  },

  Query: {
    commentsByPost: (
      parent,
      { postId, first = 10, offset = 0 },
      { db }: { db: DbConnection },
      info: GraphQLResolveInfo
    ) => {
      postId = parseInt(postId);
      return db.Comment.findAll({
        where: { post: postId },
        limit: first,
        offset: offset
      }).catch(handleError);
    }
  },

  Mutation: {
    createComment: compose(authResolver)(
      (
        parent,
        { input },
        { db, authUser }: { db: DbConnection; authUser: AuthUser },
        info: GraphQLResolveInfo
      ) => {
        return db.sequelize
          .transaction((t: Transaction) => {
            return db.Comment.create(
              { ...input, user: authUser.id },
              { transaction: t }
            );
          })
          .catch(handleError);
      }
    ),

    updateComment: compose(authResolver)(
      (
        parent,
        { id, input },
        { db, authUser }: { db: DbConnection; authUser: AuthUser },
        info: GraphQLResolveInfo
      ) => {
        id = parseInt(id);
        return db.sequelize
          .transaction((t: Transaction) => {
            return db.Comment.findById(id).then((comment: CommentInstance) => {
              throwError(!comment, `Comment with id ${id} not found`);
              throwError(
                authUser.id !== comment.get("user"),
                "Unauthorized comment update"
              );
              return comment.update(input, { transaction: t });
            });
          })
          .catch(handleError);
      }
    ),

    deleteComment: compose(authResolver)(
      (
        parent,
        { id },
        { db, authUser }: { db: DbConnection; authUser: AuthUser },
        info: GraphQLResolveInfo
      ) => {
        id = parseInt(id);
        return db.sequelize
          .transaction((t: Transaction) => {
            return db.Comment.findById(id).then((comment: CommentInstance) => {
              throwError(!comment, `Comment with id ${id} not found`);
              throwError(
                authUser.id !== comment.get("user"),
                "Unauthorized comment delete"
              );
              return comment
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
