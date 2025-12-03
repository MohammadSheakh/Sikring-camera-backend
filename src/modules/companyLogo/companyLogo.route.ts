import express from 'express';
import * as validation from './companyLogo.validation';
import { CompanyLogoController} from './companyLogo.controller';
import { ICompanyLogo } from './companyLogo.interface';
import { validateFiltersForQuery } from '../../middlewares/queryValidation/paginationQueryValidationMiddleware';
import validateRequest from '../../shared/validateRequest';
import auth from '../../middlewares/auth';

const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const router = express.Router();

export const optionValidationChecking = <T extends keyof ICompanyLogo>(
  filters: T[]
) => {
  return filters;
};

// const taskService = new TaskService();
const controller = new CompanyLogoController();

//info : pagination route must be before the route with params
router.route('/paginate').get(
  //auth('common'),
  validateFiltersForQuery(optionValidationChecking(['_id'])),
  controller.getAllWithPagination
);

router.route('/:id').get(
  // auth('common'),
  controller.getById
);

router.route('/:id').put(
  //auth('common'),
  // validateRequest(UserValidation.createUserValidationSchema),
  [
    upload.fields([
      { name: 'attachments', maxCount: 1 }, // Allow up to 5 cover photos
    ]),
  ],
  auth('admin'),
  controller.updateById
);

//[🚧][🧑‍💻✅][🧪] // 🆗
router.route('/').get(
  auth('commonAdmin'),
  controller.getAll
);

//[🚧][🧑‍💻✅][🧪] // 🆗
router.route('/').post(
  [
    upload.fields([
      { name: 'attachments', maxCount: 1 }, // Allow up to 5 cover photos
    ]),
  ],
  auth('admin'),
  // validateRequest(validation.createHelpMessageValidationSchema),
  controller.create
);

router.route('/delete/:id').delete(
  //auth('common'),
  controller.deleteById
); // FIXME : change to admin

router.route('/soft-delete/:id').delete(
  auth('admin'),
  controller.softDeleteById
);

////////////
//[🚧][🧑‍💻✅][🧪] // 🆗


export const CompanyLogoRoute = router;
