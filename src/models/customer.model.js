import mongoose,{Schema} from "mongoose";
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"



const customerSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    product:[{
        type:Schema.Types.ObjectId,
        ref:"Product",

    }],
},{
    timestamps:true
});
customerSchema.pre("save",async function(next){
    if(!this.isModified("password")) return next();
 
     this.password =await bcrypt.hash(this.password, 10)
     next()
 })
 
 customerSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password)
 }
 customerSchema.methods.generateAccessToken = function () {
   return jwt.sign(
     {
       _id: this._id,
       email: this.email,
       username: this.username,
       fullName: this.fullName
 
   },
   process.env.ACCESS_TOKEN_SECRET,
   {
       expiresIn:process.env.ACCESS_TOKEN_EXPIRY
   }
 
 )
  }
  customerSchema.methods.generateRefreshToken = function () {
     return jwt.sign(
         {
           _id: this._id,
           email: this.email,
           username: this.username,
           fullName: this.fullName
     
       },
       process.env.REFRESH_TOKEN_SECRET,
       {
           expiresIn:process.env.REFRESH_TOKEN_EXPRIY
       }
     )
   
  }
 

const Customer = mongoose.model("Customer", customerSchema);



export{Customer}