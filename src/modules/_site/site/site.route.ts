import express from 'express';
import * as validation from './site.validation';
import { siteController} from './site.controller';
import { Isite } from './site.interface';
import { validateFiltersForQuery } from '../../../middlewares/queryValidation/paginationQueryValidationMiddleware';
import validateRequest from '../../../shared/validateRequest';
import auth from '../../../middlewares/auth';

const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const router = express.Router();

export const optionValidationChecking = <T extends keyof Isite>(
  filters: T[]
) => {
  return filters;
};

// const taskService = new TaskService();
const controller = new siteController();

//info : pagination route must be before the route with params

// Admin: get all site 💡
// Admin : get all location of all site  💡

router.route('/paginate').get(
  //auth('common'),
  validateFiltersForQuery(optionValidationChecking(['_id'])),
  controller.getAllWithPagination
);

// get site details by site id 💡
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

// get all location of site 


export const siteRoute = router;
