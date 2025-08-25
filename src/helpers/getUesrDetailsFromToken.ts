import * as jwt from 'jsonwebtoken';
import { StatusCodes } from 'http-status-codes';
import { config } from '../config';
import ApiError from '../errors/ApiError';
import { User } from '../modules/user/user.model';

const getUserDetailsFromToken = async (token: string) => {
  
  if (!token) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'you are not authorized!');
  }

  let decode: any;
  // console.log(config.jwt_access_secret)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  try {
    decode = jwt.verify(
      token,
      config.jwt.accessSecret as jwt.Secret
      //config.token.TokenSecret as string,
      // { algorithms: ['HS256'] },
    );
   
  } catch (error) {
    throw new ApiError(
      StatusCodes.UNAUTHORIZED,'Invalid or expired token...!'+error,
    );
  }

  
  const user = await User.findById(decode.userId).select('-subscriptionType -isResetPassword -failedLoginAttempts -stripe_customer_id -authProvider -isGoogleVerified -isAppleVerified -createdAt -updatedAt -__v -password -updatedAt');
  return user;
};

export default getUserDetailsFromToken; // hello 
