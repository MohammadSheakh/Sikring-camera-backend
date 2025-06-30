import express from 'express';
import * as validation from './cameraSite.validation';
import { cameraSiteController} from './cameraSite.controller';
import { IcameraSite } from './cameraSite.interface';
import { validateFiltersForQuery } from '../../../middlewares/queryValidation/paginationQueryValidationMiddleware';
import validateRequest from '../../../shared/validateRequest';
import auth from '../../../middlewares/auth';

const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const router = express.Router();

export const optionValidationChecking = <T extends keyof IcameraSite  | 'sortBy' | 'page' | 'limit' | 'populate'>(
  filters: T[]
) => {
  return filters;
};

// const taskService = new TaskService();
const controller = new cameraSiteController();

const paginationOptions: Array<'sortBy' | 'page' | 'limit' | 'populate'> = [
  'sortBy',
  'page',
  'limit',
  'populate',
];

//info : pagination route must be before the route with params

/***************
 * 
 * Admin : Site Management :: get all camera
 * 
 * Customer : (Home Page) : Live Preview  Get all camera by Site Id 
 * 
 * ************** */

router.route('/paginate').get(
  //auth('common'),
  validateFiltersForQuery(optionValidationChecking(['_id', 'siteId', ...paginationOptions])),
  controller.getAllWithPagination
);

/**************
 * 
 *  Admin > Site Management > (View Live Page) get all camera by site Id  
 * 
 * ********** */

router.route('/preview/paginate').get(
  //auth('common'),
  validateFiltersForQuery(optionValidationChecking(['_id', 'siteId', ...paginationOptions])),
  controller.getAllCameraBySiteIdWithPagination
);

/**************
 * 
 *  Admin > Site Management > (Give View Access to Customer) get all camera by site Id  
 * 
 * ********** */
router.route('/access/paginate').get(
  //auth('common'),
  validateFiltersForQuery(optionValidationChecking(['_id', 'siteId', ...paginationOptions])),
  controller.getAllCameraBySiteIdForAccessWithPagination
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


export const cameraSiteRoute = router;
