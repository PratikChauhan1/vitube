import { Router } from "express";
import {
  changeCurrentPassword,
  deleteCoverImage,
  getCurrentUser,
  getUserChannelProfile,
  getWatchHistory,
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
} from "../controllers/users.controller.js";
import { upload } from "../middleware/multer.middleware.js";
import { verifyJWT } from "../middleware/auth.middleware.js";

const route = Router();

route.route("/register").post(
  upload.fields([
    {
      name: "avtar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  registerUser
);

route.route("/login").post(loginUser);

// Secured routes

route.route("/logout").post(verifyJWT, logoutUser);
route.route("/refresh-token").post(refreshAccessToken);
route.route("/update-account-detail").patch(verifyJWT, updateAccountDetails);
route.route("/change-passwrod").post(verifyJWT, changeCurrentPassword);
route.route("/current-user").get(getCurrentUser);

route.route("/delete-coverImage").patch(verifyJWT, deleteCoverImage);
route
  .route("/update-avatar")
  .patch(verifyJWT, upload.single("avatar"), updateUserAvatar);
route
  .route("/update-coverimage")
  .patch(verifyJWT, upload.single("coverImage"), updateUserCoverImage);

route.route("/c/:username").get(verifyJWT, getUserChannelProfile);
route.route("/history").get(verifyJWT, getWatchHistory);

export { route };
