import { Router } from "express";
import { loginUser, logoutUser, refreshAccessToken, registerUser } from "../controllers/users.controller.js";
import { upload } from "../middleware/multer.middleware.js";
import { verifyJWT } from "../middleware/auth.middleware.js";

const route = Router();

route.route("/register").post(
  upload.fields([
    {
      name: "avtar",
      maxCount:1
    },
    {
      name: "coverImage",
      maxCount:1
    },
  ]),
  registerUser
);

route.route("/login").post(loginUser)


// Secured routes

route.route("/logout").post(verifyJWT, logoutUser)

route.route("/refresh-token").post(refreshAccessToken)
export {route}
