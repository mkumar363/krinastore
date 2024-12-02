import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { Product } from "../models/product.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const createProduct = asyncHandler(async (req, res) => {
    // Destructure fields from req.body
    const { name, description, price } = req.body;

    // Validate required fields
    if (!name || !description || !price) {
        throw new ApiError(400, "Name, description, and price are required");
    }
    // Validate price
    if (isNaN(price)) {
        throw new ApiError(400, "Price must be a number");
        }
        // Create a new product


    const productImageLocalPath = req.file.path;

    if(!productImageLocalPath){
        throw new ApiError(400, "Product image  is required");
    }
    // Upload image to Cloudinary
    const productImage = await uploadOnCloudinary(productImageLocalPath);

    if (!productImage || !productImage.url) {
        throw new ApiError(500, "Error uploading image to Cloudinary");
    }

    // Create the product
    const product = await Product.create({
        name,
        description,
        price: parseFloat(price), // Ensure price is stored as a number
        productImage: productImage.url,
        owner: req.user._id // Assuming req.user is set by auth middleware
    });

    // Send response
    return res
        .status(201)
        .json(new ApiResponse(201, product, "Product created successfully"));
});


    const getAllProducts = asyncHandler(async (req, res) => {
        const products = await Product.find({}).populate("owner");
    
        if (!products || products.length === 0) {
            return res
                .status(200)
                .json(new ApiResponse(200, [], "No products found"));
        }
    
        return res
            .status(200)
            .json(new ApiResponse(200, products, "Products retrieved successfully"));
    });

    const removeProduct = asyncHandler(async (req, res) => {
        const productId = req.params.id;
    
        if (!productId) {
            throw new ApiError(400, "Product ID is required");
        }
    
        console.log("Attempting to find product with ID:", productId);
        const product = await Product.findById(productId);
    
        console.log("Product found:", product);
    
        if (!product) {
            throw new ApiError(404, "Product not found");
        }
    
        // Check if req.user exists
        if (!req.user || !req.user._id) {
            throw new ApiError(401, "Unauthorized - User not authenticated");
        }
    
        console.log("Authenticated user:", req.user);
    
        // Check if product.owner exists
        // if (!product.owner) {
        //     console.log("Product owner is missing. Full product object:", JSON.stringify(product, null, 2));
        //     throw new ApiError(500, "Product owner information is missing");
        // }
    
        // if (product.owner.toString() !== req.user._id.toString()) {
        //     console.log("User does not have permission to delete this product");
        //     console.log("Product owner:", product.owner.toString());
        //     console.log("User ID:", req.user._id.toString());
        //     throw new ApiError(403, "You do not have permission to delete this product");
        // }
    
        await Product.findByIdAndDelete(productId);
    
        return res
            .status(200)
            .json(new ApiResponse(200, {}, "Product deleted successfully"));
    });
    
export { createProduct,getAllProducts, removeProduct };

