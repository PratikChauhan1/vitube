// import react from "react";
import { User } from "../models/user.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { unloadOnCloudinary ,deleteOnCloudinary} from "../utils/clodinary.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefereshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating referesh and access token"
    );
  }
};

const registerUser = asyncHandler(async (req, res) => {
  const { email, password, fullName, username } = req.body;

  if (
    [fullName, username, password, email].some(
      (field) => !field || field.trim() === ""
    )
  ) {
    throw new ApiError(400, "Full details are Required");
  }

  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existedUser) {
    throw new ApiError(409, "Already Username and email Exist ");
  }

  const avtarLocalPath = req.files?.avtar?.[0]?.path;
  const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

  if (!avtarLocalPath) {
    throw new ApiError(409, "Avtar file Required");
  }

  const avtar = await unloadOnCloudinary(avtarLocalPath);
  const coverImage = await unloadOnCloudinary(coverImageLocalPath);

  if (!avtar) {
    throw new ApiError(409, "Avtar file Required");
  }

  const user = await User.create({
    fullName,
    avatar: avtar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase(),
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(
      500,
      "Something went wrong while Registration the User "
    );
  }

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User Registered Successfully "));
});

const loginUser = asyncHandler(async (req, res) => {
  // req.body -> data
  const { email, username, password } = req.body;
  if (!(username || password)) {
    throw new ApiError(400, "Username or Email is required");
  }

  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (!user) {
    throw new ApiError(404, "User does not Exist");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credintials ");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(
    user._id
  );
  // username or email

  const loggedinuser = await User.findById(User._id).select(
    "-password -refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedinuser,
          accessToken,
          refreshToken,
        },
        "User Logged in Successfully "
      )
    );

  //  find the User
  // password check
  // access and refresh token
  // send cookie
  // send response user login successfully
});

const logoutUser = asyncHandler(async (req, res) => {
  console.log("User Logout in proccess Step 1 \n");

  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: { refreshToken: undefined },
    },
    {
      returnDocument: "after",
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User Logged Out "));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshAccessToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "unauthorized Request");
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken?._id);

    if (!user) {
      throw new ApiError(401, "invalid refresh token");
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh Token is expired or used");
    }

    const options = {
      httpOnly: true,
      secure: true,
    };

    const { accessToken, newrefreshToken } =
      await generateAccessAndRefereshTokens(user._id);

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newrefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newrefreshToken },
          "Access Token refreshed"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token");
  }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  const user = await User.findById(req.user?._id);
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

  if (!isPasswordCorrect) {
    throw new ApiError(400, "Invalid old Password ");
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password Changed Successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "current user fetched Successfully"));
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullName, email, username } = req.body;

  if (!(fullName || email || username)) {
    throw new ApiError(400, "At least one field is required");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,

    {
      $set: {
        fullName: fullName,
        email: email,
        username: username,
      },
    },
    { returnDocument: "after" }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details Update successfully"));
});

const updateUserAvatar = asyncHandler(async (req, res) => {
  // Delete after update avatar Image

  const avatarLocalPath = req.file?.path;
  

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file required");
  }

// Upload new aAvatar 
  const avatar = await unloadOnCloudinary(avatarLocalPath);
  if (!avatar.url) {
    throw new ApiError(400, "Error while uploading on avatar");
  }


//  current User 
 const currentUser = await User.findById(req.user._id)



//Update DB
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatar.url,
      },
    },
    { returnDocument:"after" }
  ).select("-password");
  

//  Delete Old Avatar
 if (currentUser.avatar) {
    
    const CloudinaryID = currentUser.avatar.split("/").pop().split(".")[0];
    await deleteOnCloudinary(CloudinaryID);
  }

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Avatar Update Successfully"));
});

const updateUserCoverImage = asyncHandler(async (req, res) => {
  const currentUser = await User.findById(req.user._id)
  console.log(currentUser);
  
  const coverImageLocalPath = req.file?.path;

  if (!coverImageLocalPath) {
    throw new ApiError(400, "CoverImage file is Missing  ");
  }


  const coverImage = await unloadOnCloudinary(coverImageLocalPath);
  if (!coverImage.url) {
    throw new ApiError(400, "Error while uploading on coverImage");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        coverImage: coverImage.url,
      },
    },
    { returnDocument:"after"}
  ).select("-password");

  // const currentUser = await User.findById(req.user._id)
  const CloudinaryID = currentUser.coverImage.split("/").pop().split(".")[0];
  await deleteOnCloudinary(CloudinaryID)


  return res
    .status(200)
    .json(new ApiResponse(200, user, "CoverImage Update Successfully "));
});

const deleteCoverImage = asyncHandler(async (req, res) => {

  const currentUser = await User.findById(req.user._id);
  console.log(currentUser.coverImage);
  

  if (!currentUser?.coverImage ) {
    throw new ApiError(400, "No cover image found");
  }

  // Extract public_id
  const publicId = currentUser.coverImage.split("/").pop().split(".")[0];
  console.log("Public ID:", publicId);

  // Delete from Cloudinary
  await deleteOnCloudinary(publicId);

  // Remove from DB
  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        coverImage: ""
      }
    },
    { returnDocument:"after" }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Cover Image Deleted Successfully"));
});


export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
  changeCurrentPassword,
  deleteCoverImage
};
