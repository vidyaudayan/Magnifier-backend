import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();
const secretKey= process.env.JWT_SECRET;

export const generateToken= (user)=>{
return jwt.sign({id: user.id, email: user.email,role: user.role,firstName: user.firstName, lastName: user.lastName},secretKey,{expiresIn:"1d"})
}
export const adminToken = (user) => {
    return jwt.sign({ id: user.id, role: user.role }, secretKey, {
      expiresIn: "1d",
    });
  };


    

export default generateToken;