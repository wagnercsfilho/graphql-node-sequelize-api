import * as jwt from "jsonwebtoken";
import { RequestHandler, Request } from "express";
import { JWT_SECRET } from "../utils/utils";
import models from "../models";
import { UserInstance } from "../models/UserModel";

export const extractJwtMiddleware = (): RequestHandler => {
  return (req: Request, res, next) => {
    let authorization = req.get("authorization");
    let token = authorization ? authorization.split(" ")[1] : undefined;

    req["context"] = {};
    req["context"]["authorization"] = authorization;

    if (!token) return next();

    jwt.verify(token, JWT_SECRET, (err, decoded: any) => {
      if (err) return next();

      models.User.findById(decoded.sub, {
        attributes: ["id", "email"]
      }).then((user: UserInstance) => {
        if (user) {
          req["context"]["authUser"] = {
            id: user.get("id"),
            email: user.get("email")
          };
        }

        return next();
      });
    });
  };
};
