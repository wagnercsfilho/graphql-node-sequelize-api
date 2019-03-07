"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../../../utils/utils");
const composable_resolver_1 = require("../../composable/composable.resolver");
const auth_resolver_1 = require("../../composable/auth.resolver");
exports.commentResolvers = {
    Comment: {
        user: (comment, args, { db, dataLoaders: { userLoader } }, info) => {
            return userLoader
                .load({ key: comment.get("user"), info })
                .catch(utils_1.handleError);
        },
        post: (comment, args, { db, dataLoaders: { postLoader } }, info) => {
            return postLoader
                .load({ key: comment.get("post"), info })
                .catch(utils_1.handleError);
        }
    },
    Query: {
        commentsByPost: (parent, { postId, first = 10, offset = 0 }, { db }, info) => {
            postId = parseInt(postId);
            return db.Comment.findAll({
                where: { post: postId },
                limit: first,
                offset: offset
            }).catch(utils_1.handleError);
        }
    },
    Mutation: {
        createComment: composable_resolver_1.compose(auth_resolver_1.authResolver)((parent, { input }, { db, authUser }, info) => {
            return db.sequelize
                .transaction((t) => {
                return db.Comment.create(Object.assign({}, input, { user: authUser.id }), { transaction: t });
            })
                .catch(utils_1.handleError);
        }),
        updateComment: composable_resolver_1.compose(auth_resolver_1.authResolver)((parent, { id, input }, { db, authUser }, info) => {
            id = parseInt(id);
            return db.sequelize
                .transaction((t) => {
                return db.Comment.findById(id).then((comment) => {
                    utils_1.throwError(!comment, `Comment with id ${id} not found`);
                    utils_1.throwError(authUser.id !== comment.get("user"), "Unauthorized comment update");
                    return comment.update(input, { transaction: t });
                });
            })
                .catch(utils_1.handleError);
        }),
        deleteComment: composable_resolver_1.compose(auth_resolver_1.authResolver)((parent, { id }, { db, authUser }, info) => {
            id = parseInt(id);
            return db.sequelize
                .transaction((t) => {
                return db.Comment.findById(id).then((comment) => {
                    utils_1.throwError(!comment, `Comment with id ${id} not found`);
                    utils_1.throwError(authUser.id !== comment.get("user"), "Unauthorized comment delete");
                    return comment
                        .destroy({ transaction: t })
                        .then(() => true)
                        .catch(() => false);
                });
            })
                .catch(utils_1.handleError);
        })
    }
};
