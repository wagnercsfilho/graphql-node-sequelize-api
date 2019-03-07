"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authResolver = (resolve) => {
    return (parent, args, context, info) => {
        if (context.authUser) {
            return resolve(parent, args, context, info);
        }
        throw new Error("Unauthorized! Token not provided!");
    };
};
