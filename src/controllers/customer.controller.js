import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { Customer } from "../models/customer.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import {Product} from "../models/product.model.js"

const generateAccessAndRefreshTokens = async (customerId) => {
  try {
    const customer = await Customer.findById(customerId);
    const accessToken = customer.generateAccessToken();
    const refreshToken = customer.generateRefreshToken();

    customer.refreshToken = refreshToken;
    await customer.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, "Something went wrong while generating tokens");
  }
};

const customerRegisterUser = asyncHandler(async (req, res) => {
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
  const existedCustomer = await Customer.findOne({
    $or: [{ username }, { email }],
  });
  if (existedCustomer) {
    throw new ApiError(409, "User with email and username already exist");
  }
  
 
  const customer = await Customer.create({
    fullName,
    email,
    password,
    username
  });

  const createdCustomer = await Customer.findById(customer._id).select("-password -refreshToken");
  if (!createdCustomer) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }

  res.status(201).json(new ApiResponse(200, createdCustomer, "User registered Successfully"));
});

const customerLogin = asyncHandler(async (req, res) => {
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

  const customer = await Customer.findOne({
    $or: [{ username }, { email }],
  });

  if (!customer) {
    throw new ApiError(404, "User does not exist");
  }

  const isPasswordValid = await customer.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(customer._id);

  const loggedInCustomer = await Customer.findById(customer._id).select("-password -refreshToken");

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
        customer: loggedInCustomer,
        accessToken,
        refreshToken,
      }, "Customer logged In Successfully")
    );
});

const customerLogout = asyncHandler(async (req, res) => {
  await Customer.findByIdAndUpdate(
    req.customer._id,
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

const customerRefreshAccessToken = asyncHandler(async(req, res)=>{
    const incomingRefreshToken = req.cookies.
    refreshToken || req.body.refreshToken;
    if(!incomingRefreshToken){
       throw new ApiError(401,"unauthorized request")
    }
try {
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
       const customer = await Customer.findById(decodedToken?._id)
    
       if(!customer){
           throw new ApiError(401,"Invalid refresh token")
       }
       if(incomingRefreshToken !== user?.refreshToken){
           throw new ApiError(401," refresh token is expired or used")
       }
    
       const opitions = {
        httpOnly: true,
        secure: true
       }
      const {accessToken, newRefreshToken} = await generateAccessAndRefreshTokens(customer._id)
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

    const customerChangeCurrentPassword = asyncHandler(async(req, res)=>{
      const {oldPassword, newPassword} = req.body
      const customer = await Customer.findById(req.customer?._id)
    const isPasswordCorrect = await customer.isPasswordCorrect(oldPassword)
    if(!isPasswordCorrect){
      throw new ApiError(401, "Old password is incorrect")
    }
    customer.password = newPassword
   await customer.save({validateBeforeSave: false});
   return res
   .status(200)
   .json(new ApiResponse(200, {}, "Password changed successfully"))
    })

    const getCurrentCustomer = asyncHandler(async(req, res)=>{
      return res
      .status(200)
      .json(new ApiResponse(200, req.customer, "current User found successfully"))

    })
    const updateAccountDetails = asyncHandler(async(req, res)=>{
      const {fullName, email} = req.body

      if(!fullName || !email){
        throw new ApiError(400, "fullName and email is required")

      }
      const customer = await Customer.findByIdAndUpdate(req.customer?._id,
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
    const buyProduct = asyncHandler(async (req, res) => {
      const { customerId, productId } = req.body;
    
      if (!customerId || !productId) {
        throw new ApiError(400, "Customer ID and Product ID are required");
      }
    
      if (!mongoose.isValidObjectId(customerId) || !mongoose.isValidObjectId(productId)) {
        throw new ApiError(400, "Invalid Customer ID or Product ID format");
      }
    
      const customer = await Customer.findById(customerId);
      if (!customer) {
        throw new ApiError(404, "Customer not found");
        }
    
    
      const product = await Product.findById(productId);
      if (!product) {
        throw new ApiError(404, "Product not found");
      }
    
      if (customer.product.includes(productId)) {
        throw new ApiError(409, "Product already purchased");
      }
    
      customer.product.push(productId);
      await customer.save();
    
      return res
        .status(200)
        .json(new ApiResponse(200, customer, "Product added successfully"));
    });
    

export { customerRegisterUser,
   customerLogin,
    customerLogout, 
    customerRefreshAccessToken, 
   customerChangeCurrentPassword,
     getCurrentCustomer,
     updateAccountDetails,
     buyProduct
    };

