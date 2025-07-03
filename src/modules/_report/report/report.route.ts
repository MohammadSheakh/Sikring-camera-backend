import express from 'express';
import * as validation from './report.validation';
import { reportController} from './report.controller';
import { Ireport } from './report.interface';
import { validateFiltersForQuery } from '../../../middlewares/queryValidation/paginationQueryValidationMiddleware';
import validateRequest from '../../../shared/validateRequest';
import auth from '../../../middlewares/auth';
import { schedule } from 'node-cron';

const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const router = express.Router();

export const optionValidationChecking = <T extends keyof Ireport  | 'sortBy' | 'page' | 'limit' | 'populate'>(
  filters: T[]
) => {
  return filters;
};

// const taskService = new TaskService();
const controller = new reportController();

const paginationOptions: Array<'sortBy' | 'page' | 'limit' | 'populate'> = [
  'sortBy',
  'page',
  'limit',
  'populate',
];

//info : pagination route must be before the route with params
// get all report organized by category 💡
// get all todays report 💡 
router.route('/paginate').get(
  //auth('common'),
  validateFiltersForQuery(optionValidationChecking(['_id', 'reportType', 'createdAt' , ...paginationOptions])),
  controller.getAllWithPagination
);

// get report details by id 💡
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
// customer: user : create report 💡
router.route('/create').post(
  [
    upload.fields([
      { name: 'attachments', maxCount: 15 }, // Allow up to 5 cover photos
    ]),
  ],
  auth('common'),
  validateRequest(validation.createReportValidationSchema),
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

/******************
 *  story
 *  when customer create a report .. then it goes to admin... 
 *  after seeing the report admin can change the status .. 'underReview' to 'accept'
 * 
 *  if admin 'accept' that report .. then it will be assigned to that customer's site's..... employee  
 * 
 * **************** */

//[🚧][🧑‍💻✅][🧪🆗] // 6/26/2025 
router.route('/change-status/:id').put(
  auth('admin'),
  validateRequest(validation.changeStatusOfAReportValidationSchema),
  controller.changeReportStatus
);



export const reportRoute = router;
