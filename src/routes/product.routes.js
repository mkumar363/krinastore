import { Router } from 'express';
import { createProduct,getAllProducts, removeProduct } from '../controllers/product.controller.js';
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

router
    .route("/create")
    .post(verifyJWT, upload.single("productImage"), createProduct);
    
router.route("/productinfo").get(getAllProducts);
router.route("/deleteproduct/:id")
.delete(verifyJWT, removeProduct);

export default router;
