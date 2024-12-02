import {Router} from "express";
import { customerRegisterUser, customerLogin,customerLogout, customerRefreshAccessToken, customerChangeCurrentPassword,
  getCurrentCustomer,buyProduct
   } from "../controllers/customer.controller.js";
import { verifyJWT } from "../middlewares/customerauth.middleware.js";


const router = Router();

router.route("/customer-register").post(customerRegisterUser)

router.route("/customer-login").post(customerLogin)

router.route("/customer-logout").post(verifyJWT, customerLogout)

router.route("/refresh-token").post(customerRefreshAccessToken)
router.route("/change-password").post(verifyJWT, customerChangeCurrentPassword)
router.route("/current-customer").get(verifyJWT, getCurrentCustomer)
router.route("/buy-product").post(verifyJWT, buyProduct);
// router.route("/update-account-details").patch(verifyJWT, updateAccountDetails)



export default router;