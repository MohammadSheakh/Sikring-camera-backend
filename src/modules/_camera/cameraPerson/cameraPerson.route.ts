import express from 'express';
import { validateFiltersForQuery } from '../../../middlewares/queryValidation/paginationQueryValidationMiddleware';
import auth from '../../../middlewares/auth';
import validateRequest from '../../../shared/validateRequest';
import { CameraPersonController } from './cameraPerson.controller';
import { ICameraPerson } from './cameraPerson.interface';
import * as validation from './cameraPerson.validation';

const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const router = express.Router();

export const optionValidationChecking = <T extends keyof ICameraPerson | 'sortBy' | 'page' | 'limit' | 'populate'>(
  filters: T[]
) => {
  return filters;
};

// const taskService = new TaskService();
const controller = new CameraPersonController();

const paginationOptions: Array<'sortBy' | 'page' | 'limit' | 'populate'> = [
  'sortBy',
  'page',
  'limit',
  'populate',
];

//info : pagination route must be before the route with params
router.route('/paginate').get(
  //auth('common'),
  validateFiltersForQuery(optionValidationChecking(['_id', ...paginationOptions])),
  controller.getAllWithPagination
);

/*************
 * 
 *  App (Customer) : Live View of Camera that user is given access to:  
 * 
 * ************* */
router.route('/live-view').get(
  auth('common'),
  controller.getAccessedCameraByPersonId
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
/*************
 * 
 *  Admin > Site Management > (Give View Access to Customer) assign multiple customer to a camera for view
 * 
 * ************* */
router.route('/assign').post(
  
  auth('common'),
  // validateRequest(validation.assignCameraPersonValidationSchema),
  controller.assignMultiplePersonForViewAccessToCamera
);

/*************
 * 
 *  Admin > Site Management > (Give View Access to Customer) show all customers who have or have not access to a camera
 * 
 * ************* */
router.route('/all-persons-with-or-without-access-byCameraId/:cameraId').get(
  auth('common'),
  controller.getUsersWithAccessToCamera
);

export const CameraPersonRoute = router;

