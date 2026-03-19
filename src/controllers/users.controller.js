import { User } from "../models/user.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { unloadOnCloudinary } from "../utils/clodinary.js";

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
    throw new ApiError(500,"Something went wrong while Registration the User "
    );
  }

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User Registered Successfully "));
});

export { registerUser };
