import express from 'express';
import { UserController } from './user.controller';
import auth from '../../middlewares/auth';
import validateRequest from '../../shared/validateRequest';
import { UserValidation } from './user.validation';
import fileUploadHandler from '../../shared/fileUploadHandler';
import convertHeicToPngMiddleware from '../../shared/convertHeicToPngMiddleware';
import { IUser } from './user.interface';
import { validateFiltersForQuery } from '../../middlewares/queryValidation/paginationQueryValidationMiddleware';
const UPLOADS_FOLDER = 'uploads/users';
const upload = fileUploadHandler(UPLOADS_FOLDER);

const router = express.Router();

export const optionValidationChecking = <T extends keyof IUser>(
  filters: T[]
) => {
  return filters;
};


//info : pagination route must be before the route with params
//[🚧][🧑‍💻][🧪] // ✅ 🆗
//💹📈 need scalability .. like mongo db indexing .. 
/*
 🚧 // TODO: name and email er jonno regex add korte hobe ..  
*/
// get all users where role is customer [pagination ]  sure na .. eta user site relation e hoite pare .. 
// Admin:  get all user where role is user [pagination ] 
// Admin: get all user where role is manager [pagination ] 

router.route('/paginate').get(
  auth('commonAdmin'),
 validateFiltersForQuery(optionValidationChecking(['_id', 'role'])),
  UserController.getAllUserForAdminDashboard
);

//[🚧][🧑‍💻][🧪] // ✅ 🆗
router.route('/paginate/admin').get(
  auth('commonAdmin'),
 validateFiltersForQuery(optionValidationChecking(['_id', 'name', 'email', 'role', 'status', 'createdAt'])),
  UserController.getAllAdminForAdminDashboard
);

//[🚧][🧑‍💻][🧪] // ✅ 🆗
router.post(
  "/send-invitation-link-to-admin-email",
  auth('superAdmin'),
  validateRequest(UserValidation.sendInvitationToBeAdminValidationSchema),
  UserController.sendInvitationLinkToAdminEmail
);


// TODO:  Forgot Pin and Verify Email Develop korte hobe .. access Pin related 

/*************************
 * 
 * // Risky .. If you pass collectionName as a parameter, it will delete all data from that collection.
 * 
 * ********************* */
router.post('/delete/:collectionName',
  auth('superAdmin'),
  UserController.deleteAllDataFromCollection
)

/**
 * App: Under Profile Section User Module Related End Points 
 *
 */


//[🚧][🧑‍💻✅][🧪🆗] // query :: userId
// TODO : update profile image by user id 

//[🚧][🧑‍💻✅][🧪🆗] // query :: userId

// TODO : update users basic info by user id 

// TODO : Admin : edit customer by id 

////////////////////////////////////////////////



// sub routes must be added after the main routes
//[🚧][🧑‍💻✅][🧪🆗]




  ///////////////////////////////////////////////
  

export const UserRoutes = router;
