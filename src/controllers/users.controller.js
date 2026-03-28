import { User } from "../models/user.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { unloadOnCloudinary } from "../utils/clodinary.js";

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
  console.log("API HIT");
  console.log("Headers:", req.headers);
  console.log("Body:", req.body);

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
      $set: { refreshToken:undefined },
    },
    {
      new: true,
    },
   

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


export { registerUser, loginUser, logoutUser };
