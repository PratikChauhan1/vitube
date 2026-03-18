import { User } from "../models/user.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { unloadOnCloudinary } from "../utils/clodinary.js";

const regesterUser = asyncHandler(async (req, res) => {
  console.log("API HIT");
  console.log("Headers:", req.headers);
  console.log("Body:", req.body);

  const { email, password, fullname, username } = req.body;
  console.log("Email :  ", email);
  console.log("Password :  ", password);
  console.log("Full Name :  ", fullname);
  console.log("Username :  ", username);

  if (
    [fullname, username, password, email].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, " Fullname is Required ");
  }

  const existedUser = User.findOne({
    $or: [{ username }, { email }],
  });

  if (existedUser) {
    throw new ApiError(409, "Already Username and email Exist ");
  }

  const avtarLocalPath = req.files?.avtar[0]?.path;
  const coverImageLocalPath = req.files?.coverImage[0]?.path;

  if (!avtarLocalPath) {
    throw new ApiError(409, "Avtar file Required");
  }

  const avtar = await unloadOnCloudinary(avtarLocalPath);
  const coverImage = await unloadOnCloudinary(coverImageLocalPath);

  if (!avtar) {
    throw new ApiError(409, "Avtar file Required");
  }

  const user = User.create({
    fullname,
    avatar: avtar.url,
    coverImage : coverImage?.url || "",
    email,
    password,
    username: username.toLowercase(),
  })

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  )

  if(!createdUser){
    throw new ApiError(500,"Something went wrong while Registration the User ")
  }


  return res.status(201).json(
    new ApiResponse(200,createdUser,"User Registered Successfully ")
  )

});

export { regesterUser };
