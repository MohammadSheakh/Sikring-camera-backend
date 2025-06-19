import * as jwt from 'jsonwebtoken';
import httpStatus from 'http-status';
import { config } from '../config';
import ApiError from '../errors/ApiError';
import { User } from '../modules/user/user.model';

const getUserDetailsFromToken = async (token: string) => {
  console.log("token from getUserDetails -> ", token)
  if (!token) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'you are not authorized!');
  }

  let decode: any;
  // console.log(config.jwt_access_secret)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  try {
     decode = await jwt.verify(
      token,
      config.token.TokenSecret as string,
      { algorithms: ['HS256'] },
    );
  } catch (error) {
    throw new ApiError(
      httpStatus.UNAUTHORIZED,'Invalid or expired token...!',
    );
  }

  // console.log({decode})
  const user = await User.findById(decode.userId).select('-password');
  return user;
};

export default getUserDetailsFromToken;
