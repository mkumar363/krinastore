import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, "Something went wrong while generating tokens");
  }
};

const registerUser = asyncHandler(async (req, res) => {
  // get users details from frontend
  // validation -not empty
  // check if user already exist : username , email
  // check for images , check for avatar
  // upload them to cloudinary, avatar
  // create user object - create entry in db
  // remove password  and refresh token field from response
  // check for user creation
  // return response

 const { fullName, username, email, password } = req.body;
 console.log("email: ", email);
  if ([fullName, username, email, password].some((field) => field?.trim() === "")) {
    throw new ApiError(400, "All fields are required");
  }
  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });
  if (existedUser) {
    throw new ApiError(409, "User with email and username already exist");
  }
  
 
  const user = await User.create({
    fullName,
    email,
    password,
    username
  });

  const createdUser = await User.findById(user._id).select("-password -refreshToken");
  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }

  res.status(201).json(new ApiResponse(200, createdUser, "User registered Successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  // req body -> data
  // username or email
  // find the user
  // password check
  // access and refresh token
  // send cookie

  const { email, username, password } = req.body;
  console.log(email);
   

  if (!username && !email) {
    throw new ApiError(400, "username or email is required");
  }

  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (!user) {
    throw new ApiError(404, "User does not exist");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);

  const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(200, {
        user: loggedInUser,
        accessToken,
        refreshToken,
      }, "User logged In Successfully")
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
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
    .json(new ApiResponse(200, {}, "User logged Out"));
});

const refreshAccessToken = asyncHandler(async(req, res)=>{
    const incomingRefreshToken = req.cookies.
    refreshToken || req.body.refreshToken;
    if(!incomingRefreshToken){
       throw new ApiError(401,"unauthorized request")
    }
try {
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
       const user = await User.findById(decodedToken?._id)
    
       if(!user){
           throw new ApiError(401,"Invalid refresh token")
       }
       if(incomingRefreshToken !== user?.refreshToken){
           throw new ApiError(401," refresh token is expired or used")
       }
    
       const opitions = {
        httpOnly: true,
        secure: true
       }
      const {accessToken, newRefreshToken} = await generateAccessAndRefreshTokens(user._id)
      return res
      .status(200)
      .cookie("accessToken", accessToken, opitions)
      .cookie("refreshToken", newRefreshToken, opitions)
      .json(
        new ApiResponse(200, 
            {accessToken, refreshToken: newRefreshToken},
            "Access token refreshed successfully"
        ) 
    ) 
} catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token")
    
}
    })

    const changeCurrentPassword = asyncHandler(async(req, res)=>{
      const {oldPassword, newPassword} = req.body
      const user = await User.findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)
    if(!isPasswordCorrect){
      throw new ApiError(401, "Old password is incorrect")
    }
    user.password = newPassword
   await user.save({validateBeforeSave: false});
   return res
   .status(200)
   .json(new ApiResponse(200, {}, "Password changed successfully"))
    })

    const getCurrentUser = asyncHandler(async(req, res)=>{
      return res
      .status(200)
      .json(new ApiResponse(200, req.user, "current User found successfully"))

    })
    const updateAccountDetails = asyncHandler(async(req, res)=>{
      const {fullName, email} = req.body

      if(!fullName || !email){
        throw new ApiError(400, "fullName and email is required")

      }
      const user= await User.findByIdAndUpdate(req.user?._id,
        {
          $set: {
            fullName: fullName,
            email: email
          }
        },
        {
          new: true}
      ).select("-password ")

      return res
      .status(200)
      .json(new ApiResponse(200, user, "Account details updated successfully"))
      
    })


  
 
  






export { registerUser,
   loginUser,
    logoutUser, 
    refreshAccessToken, 
    changeCurrentPassword,
     getCurrentUser,
     updateAccountDetails
   
    };

