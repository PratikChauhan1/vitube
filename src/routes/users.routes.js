import { Router } from "express";
import { registerUser } from "../controllers/users.controller.js";
import { upload } from "../middleware/multer.middleware.js";

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

export { route };
