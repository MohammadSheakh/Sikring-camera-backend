import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../shared/catchAsync';
import pick from '../../shared/pick';
import sendResponse from '../../shared/sendResponse';
import ApiError from '../../errors/ApiError';
import { UserCustomService, UserService } from './user.service';
import { User } from './user.model';
import mongoose from 'mongoose';
import { TokenService } from '../token/token.service';
import { sendAdminOrSuperAdminCreationEmail } from '../../helpers/emailService';
import { AuthService } from '../auth/auth.service';
import { Request, Response } from 'express';
import omit from '../../shared/omit';
import { UserSiteService } from '../_site/userSite/userSite.service';
import { IauditLog } from '../auditLog/auditLog.interface';
import { TStatus } from '../auditLog/auditLog.constant';
import eventEmitterForAuditLog from '../auditLog/auditLog.service';
import { AttachmentService } from '../attachments/attachment.service';
import { TAttachedToType, TFolderName } from '../attachments/attachment.constant';
import bcryptjs from 'bcryptjs';
import { config } from '../../config';
import { userSite } from '../_site/userSite/userSite.model';

const userCustomService = new UserCustomService();
const attachmentService = new AttachmentService();

/*************
 * 
 * This is For Admin Dashboard ... 
 * 
 * ************ */
//[🚧][🧑‍💻][🧪] // ✅ 🆗 // SC
//update user from database
const updateMyProfile = catchAsync(async (req, res) => {
  const userId = req.user.userId;
  if (!userId) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'You are unauthenticated.');
  }

  /*******
   * 
   * if req.file is present then we will update the profile image 
   * 
   * // TODO : image thik moto update hocche kina check korte hobe ..  
   * 
   *******/

  let attachments = [];
        
  if (req.files && req.files.attachments) {
  attachments.push(
    ...(await Promise.all(
    req.files.attachments.map(async file => {
        const attachmenId = await attachmentService.uploadSingleAttachment(
            file, // file to upload 
            TFolderName.user, // folderName
            req.user.userId, // uploadedByUserId
            TAttachedToType.user
        );
        return attachmenId;
    })
    ))
  );

  req.body.companyLogoImage = attachments[0].attachment;
  }
  
  const result = await UserService.updateUserProfile(userId, req.body);
  sendResponse(res, {
    code: StatusCodes.OK,
    data: result,
    message: 'User updated successfully',
  });
});

/*************
 * 
 * 
 * This is For Admin Dashboard ... 
 * 
 * ************ */

//update user profile from database
const updateUserProfile = catchAsync(async (req, res) => {
  const { userId } = req.params;

  /***********
   * 
   * user exist kore kina check korte hobe ..
   * 
   * ********** */

  const existingUser = await User.findById(userId);

  console.log('existingUser 🌋🌋 :updateUsers:', existingUser);

  if (!existingUser) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');
  }

  const payload = req.body;

  if(payload.password){
    payload.password = await bcryptjs.hash(
          payload.password,
          Number(config.bcrypt.saltRounds),
    );
  }

  if(payload.email && existingUser.email !== payload.email){
    payload.email = existingUser.email; // dont allow to change email
  }

  if(payload.siteId){
    // now we have to check if userSite collection has this userId and siteId already exist or not
    // if exist then we will update the userSite collection
    // or we create a new userSite collection
    const existingUserSite = await userSite.findOne({
      personId: userId,
      siteId: payload.siteId,
    })

    console.log('existingUserSite 🌋🌋 :updateUsers:', existingUserSite);

    if(existingUserSite){
      // update the userSite collection
      await userSite.findByIdAndUpdate(
        existingUserSite.id,
        { 
          personId: userId,
          siteId: payload.siteId,
        },
        { new : true } // return the updated document
      );
    }else{
      // we create a new userSite collection
      await userSite.create({
        personId: userId,
        siteId: payload.siteId,
        role : existingUser.role // we will use the existing user role
      });
    }
  }

  const result = await UserService.updateUserProfile(userId, payload);
  sendResponse(res, {
    code: StatusCodes.OK,
    data: result,
    message: 'User status updated successfully',
  });
});


//[🚧][🧑‍💻][🧪] // ✅ 🆗 // SC
// send Invitation Link for a admin
const sendInvitationLinkToAdminEmail = catchAsync(async (req, res) => {
  const user = await UserService.getUserByEmail(req.body.email);

  /**
   *
   * req.body.email er email jodi already taken
   * if ----
   * then we check isEmailVerified .. if false .. we make that true
   *
   * if isDeleted true then we make it false
   *
   * else ---
   *  we create new admin and send email
   *
   */

  if (user && user.isEmailVerified === true) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Email already taken');
  } else if (user && user.isDeleted === true) {
    user.isDeleted = false;
    await user.save();
  } else if (user && user.isEmailVerified === false) {
    user.isEmailVerified = true;
    await user.save();
    const token = await TokenService.createVerifyEmailToken(user);
    await sendAdminOrSuperAdminCreationEmail(
      req?.body?.email,
      req.body.role,
      req?.body?.password,
      req.body.message ?? 'welcome to the team'
    );

    return sendResponse(res, {
      code: StatusCodes.OK,
      data: null,
      message:
        'User already found and Invitation link sent successfully for admin',
    });
  } else {

    let actionPerformed = '';

    // create new user
    if (req.body.role == 'customer') {

      /********
       * 
       * we have to upload company logo here 
       * 
       * ******** */

      let attachments = [];
      
      if (req.files && req.files.attachments) {
      attachments.push(
        ...(await Promise.all(
        req.files.attachments.map(async file => {
            const attachmenId = await attachmentService.uploadSingleAttachment(
                file, // file to upload 
                TFolderName.user, // folderName
                req.user.userId, // uploadedByUserId
                TAttachedToType.user
            );
            return attachmenId;
        })
        ))
      );
        req.body.attachments = attachments;
      }
      
      const newUser = await AuthService.createUser({
        email: req.body.email,
        password: req.body.password,
        role: req.body.role,
        isEmailVerified: true, // INFO: Customer dont need to verify Email
        name : req.body.name,
        user_custom_id : req.body.customId, 
        address : req.body.address,
        // TODO : Company Logo upload korte hobe 
      });

      /***********
       * 
       * jei userId create hobe .. sheta ar req.body.siteId niye
       * userSite create korte hobe  
       * 
       * ********** */

      if(newUser?.user?._id && req.body.siteId){
        /**********
         * 
         * // TODO : we need to check if the siteId is valid or not
         * 
         * ******** */

        // TODO : create userSite here
        let userSiteRes = await new UserSiteService().create(
          {
            personId: newUser?.user._id,
            siteId: req.body.siteId,
            role: 'customer',
          }  
        );

        console.log('userSiteRes ', userSiteRes);
      }
      
      let valueForAuditLog : IauditLog = {
          userId: req.user.userId,
          role: req.user.role,
          actionPerformed: `Created a new ${req.body.role} named ${req.body.name} for site ${req.body.siteId}`,
          status: TStatus.success,
        }

        eventEmitterForAuditLog.emit('eventEmitForAuditLog', valueForAuditLog);
        

      return sendResponse(res, {
        code: StatusCodes.OK,
        data: null,
        message: 'New user created and email sent successfully',
      });
    } else if (req.body.role == 'user'){
      const newUser = await AuthService.createUser({
        user_custom_id : req.body.customId, 
        name : req.body.name,
        designation : req.body.designation,  // for user [employee] and manager 🟢
        email: req.body.email,
        password: req.body.password,
        phoneNumber: req.body.phoneNumber, // for user [employee] and manager 🟢
        role: req.body.role,
        address: req.body.address, // for user [employee] and manager 🟢
        isEmailVerified: true, // INFO: User dont need to verify Email
      });

      let valueForAuditLog : IauditLog = {
          userId: req.user.userId,
          role: req.user.role,
          actionPerformed: `Created a new ${req.body.role} named ${req.body.name} `,
          status: TStatus.success,
      }

      eventEmitterForAuditLog.emit('eventEmitForAuditLog', valueForAuditLog);

      return sendResponse(res, {
        code: StatusCodes.OK,
        data: null,
        message: `New ${req.body.role} created and email sent successfully`,
      });
    }else if (req.body.role == 'manager'){
      const newUser = await AuthService.createUser({
        user_custom_id : req.body.customId, 
        name : req.body.name,
        designation : req.body.designation,  // for manager and user 🟢
        email: req.body.email,
        password: req.body.password,
        phoneNumber: req.body.phoneNumber, // for manager and user 🟢
        role: req.body.role,
        address: req.body.address, // for user [employee] and manager 🟢
        isEmailVerified: true, // INFO: User dont need to verify Email
      });

      let valueForAuditLog : IauditLog = {
          userId: req.user.userId,
          role: req.user.role,
          actionPerformed: `Created a new ${req.body.role} named ${req.body.name} `,
          status: TStatus.success,
      }

      eventEmitterForAuditLog.emit('eventEmitForAuditLog', valueForAuditLog);

      return sendResponse(res, {
        code: StatusCodes.OK,
        data: null,
        message: `New ${req.body.role} created and email sent successfully`,
      });
    }
    
  }
});


/*************************
 *
 * // Risky .. If you pass collectionName as a parameter, it will delete all data from that collection.
 *
 * ********************* */

const deleteAllDataFromCollection = async (req: Request, res: Response) => {
  try {
    const { collectionName } = req.params; // or req.query

    if (!collectionName) {
      sendResponse(res, {
        code: StatusCodes.BAD_REQUEST,
        message: `collectionName parameter is required`,
      });
    }

    // Validate collectionName - only allow known collections for safety
    const allowedCollections = [
      'auditLog',
      // 'Users',
      // 'Message',
      // 'Notification',
      // 'LabTestLog',
    ]; // example allowed list
    if (!allowedCollections.includes(collectionName)) {
      sendResponse(res, {
        code: StatusCodes.FORBIDDEN,
        message: `Operation not allowed on this collection`,
      });
    }

    // Get Mongoose model dynamically by collectionName
    // WARNING: Mongoose model names are case-sensitive and usually singular
    const Model = mongoose.models[collectionName];
    console.log('Model 🌋🌋', Model);
    if (!Model) {
      sendResponse(res, {
        code: StatusCodes.BAD_REQUEST,
        success: false,
        message: `Model for collection '${collectionName}' not found`,
      });
    }

    // Delete all documents
    const result = await Model.deleteMany({});
    if(!result){
      sendResponse(res, {
        code: StatusCodes.BAD_REQUEST,
        success: false,
        message: `Failed to delete documents from ${collectionName}`,
      });
    }

    sendResponse(res, {
      code: StatusCodes.BAD_REQUEST,
      success: true,
      message: `All documents deleted from ${collectionName}`,
      data: result.deletedCount,
    });
  } catch (error) {
    console.error('Error deleting all data:', error);

    sendResponse(res, {
      code: StatusCodes.BAD_REQUEST,
      success: false,
      message: `Internal server error`,
    });
  }
};


/*************
const createAdminOrSuperAdmin = catchAsync(async (req, res) => {
  const payload = req.body;
  const result = await UserService.createAdminOrSuperAdmin(payload);
  sendResponse(res, {
    code: StatusCodes.CREATED,
    data: result,
    message: `${
      payload.role === 'admin' ? 'Admin' : 'Super Admin'
    } created successfully`,
  });
});
************ */

//get single user from database
const getSingleUser = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const result = await UserService.getSingleUser(userId);
  sendResponse(res, {
    code: StatusCodes.OK,
    data: result,
    message: 'User fetched successfully',
  });
});

//get my profile //[🚧][🧑‍💻✅][🧪🆗]
const getMyProfile = catchAsync(async (req, res) => {
  const userId = req.user.userId;
  if (!userId) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'You are unauthenticated.');
  }
  const result = await UserService.getMyProfile(userId);
  sendResponse(res, {
    code: StatusCodes.OK,
    data: result,
    message: 'User fetched successfully',
  });
});

//get my profile //[🚧][🧑‍💻✅][🧪🆗]
const getMyProfileOnlyRequiredField = catchAsync(async (req, res) => {
  const userId = req.user.userId;
  if (!userId) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'You are unauthenticated.');
  }
  const result = await UserService.getMyProfileOnlyRequiredField(userId);
  sendResponse(res, {
    code: StatusCodes.OK,
    data: result,
    message: 'User fetched successfully',
  });
});

//delete user from database
const deleteMyProfile = catchAsync(async (req, res) => {
  const userId = req.user.userId;
  if (!userId) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'You are unauthenticated.');
  }
  const result = await UserService.deleteMyProfile(userId);
  sendResponse(res, {
    code: StatusCodes.OK,
    data: result,
    message: 'User deleted successfully',
  });
});

//////////////////////////////////////////////////////////

/*********
 * 
 *  Admin:  Register Customer
 *   
 *  But we dont need to register customer .. since we have send
 *  invitation line functionality .. lets use that function  
 * ********* */

//[🚧][🧑‍💻][🧪] // ✅ 🆗  
// const createCustomer = catchAsync(async (req, res) => {

// }


/*********
 * 
 *  {{shob}}v1/user/paginate?role=manager  [role = manager / user]
 *  Admin:  Register Customer
 *    
 * ********* */
//[🚧][🧑‍💻][🧪] // ✅ 🆗
const getAllUserForAdminDashboard = catchAsync(async (req, res) => {
  const filters =  omit(req.query, ['sortBy', 'limit', 'page', 'populate']); ;
  const options = pick(req.query, ['sortBy', 'limit', 'page', 'populate']);
  
  const populateOptions: (string | {path: string, select: string}[]) = [
    // {
    //   path: 'cameraId',
    //   select: ''
    // },
    // // 'personId'
    // {
    //   path: 'siteId',
    //   select: ''
    // }
  ];

  // const dontWantToInclude = ['-localLocation -attachments']; // -role

  const dontWantToInclude = 'name address phoneNumber status' ; // -role
  
  const result = await userCustomService.getAllWithPagination(filters, options, populateOptions, dontWantToInclude);

  sendResponse(res, {
    code: StatusCodes.OK,
    data: result,
    message: `All data with pagination`,
    success: true,
  });
  
  /*********************
  
  const filters = req.query;
  const options = pick(req.query, ['sortBy', 'limit', 'page', 'populate']);

  const query = {};

  // Create a copy of filter without isPreview to handle separately
  const mainFilter = { ...filters };

  // Loop through each filter field and add conditions if they exist
  for (const key of Object.keys(mainFilter)) {
    if (key === 'name' && mainFilter[key] !== '') {
      query[key] = { $regex: mainFilter[key], $options: 'i' }; // Case-insensitive regex search for name
    } else {
      query[key] = mainFilter[key];
    }
  }

  const result = await userCustomService.getAllWithPagination(query, options);

  sendResponse(res, {
    code: StatusCodes.OK,
    data: result,

    message: 'All users fetched successfully',
  });

  ***************** */
});

//[🚧][🧑‍💻][🧪] // ✅ 🆗
const getAllAdminForAdminDashboard = catchAsync(async (req, res) => {
  // const filters = req.query;

  const filters = { ...req.query };

  // If role is not specified in query, set default to show both admin and superAdmin
  if (!filters.role) {
    filters.role = { $in: ['admin', 'superAdmin'] };
  }

  const options = pick(req.query, ['sortBy', 'limit', 'page', 'populate']);

  const result = await userCustomService.getAllWithPagination(filters, options);

  sendResponse(res, {
    code: StatusCodes.OK,
    data: result,
    message: 'All admin fetched successfully',
  });
});

/**************
 * 
 * From AIM Construction -> Sikring
 * 
 * Update Profile Basic Info
 * 
 * *********** */

//update profile 
const updateProfile = catchAsync(async (req, res) => {
  const userId = req.user.userId;
  if (!userId) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'You are unauthenticated.');
  }
  const result = await UserService.updateUserProfile(userId, req.body);
  sendResponse(res, {
    code: StatusCodes.OK,
    data: result,
    message: 'Profile updated successfully',
  });
});

/**************
 * 
 * From AIM Construction -> Sikring
 * 
 * Update Profile ... Working Perfectly For sikring camera .. 
 * 
 * *********** */

//update profile image
const updateProfileImage = catchAsync(async (req, res) => {
  const userId = req.user.userId;
  
  if (req.file) {
    const attachmentResult = await attachmentService.uploadSingleAttachment(
      req.file,
      TFolderName.user,
      req.user.userId,
      TAttachedToType.user
    );

    req.body.profileImage = {
      imageUrl: attachmentResult.attachment,
    };
  }
  const result = await UserService.updateUserProfile(userId, req.body);
  sendResponse(res, {
    code: StatusCodes.OK,
    data: result,
    message: 'Profile image updated successfully',
  });
});


export const UserController = {
   //createAdminOrSuperAdmin, // recent 
  getSingleUser,
  updateMyProfile, // This is For Admin Dashboard
  updateProfileImage,  // update Profile Image
  updateProfile, // Update Profile Basic Info

  updateUserProfile,
  getMyProfile,
  
  deleteMyProfile,
  //////////////////////////
  getAllUserForAdminDashboard,
  getAllAdminForAdminDashboard,
  sendInvitationLinkToAdminEmail,

  
  ///////////////////////////////////////////////////
  deleteAllDataFromCollection,

  ///////////////////////////////////////////

  getMyProfileOnlyRequiredField,
};
