import express from 'express';
import * as validation from './userSite.validation';
import { userSiteController} from './userSite.controller';
import { IuserSite } from './userSite.interface';
import { validateFiltersForQuery } from '../../../middlewares/queryValidation/paginationQueryValidationMiddleware';
import validateRequest from '../../../shared/validateRequest';
import auth from '../../../middlewares/auth';

const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const router = express.Router();

export const optionValidationChecking = <T extends keyof IuserSite>(
  filters: T[]
) => {
  return filters;
};

// const taskService = new TaskService();
const controller = new userSiteController();

//info : pagination route must be before the route with params
// get all site by userId and type customer 💡
// get all site by userId and type user 💡
// get all user where role is customer [pagination ] 💡 show siteId, userName, siteName, cusName, address 
router.route('/paginate').get(
  //auth('common'),
  validateFiltersForQuery(optionValidationChecking(['_id', 'personId', 'role'])),
  controller.getAllWithPagination
);

router.route('/:id').get(
  // auth('common'),
  controller.getById
);

router.route('/update/:id').put(
  //auth('common'),
  // validateRequest(UserValidation.createUserValidationSchema),
  controller.updateById
);

//[🚧][🧑‍💻✅][🧪] // 🆗
router.route('/').get(
  auth('commonAdmin'),
  controller.getAll
);

//[🚧][🧑‍💻✅][🧪] // 🆗
router.route('/create').post(
  // [
  //   upload.fields([
  //     { name: 'attachments', maxCount: 15 }, // Allow up to 5 cover photos
  //   ]),
  // ],
  auth('common'),
  validateRequest(validation.createHelpMessageValidationSchema),
  controller.create
);

router.route('/delete/:id').delete(
  //auth('common'),
  controller.deleteById
); // FIXME : change to admin

router.route('/softDelete/:id').put(
  //auth('common'),
  controller.softDeleteById
);

////////////
//[🚧][🧑‍💻✅][🧪] // 🆗


export const userSiteRoute = router;
