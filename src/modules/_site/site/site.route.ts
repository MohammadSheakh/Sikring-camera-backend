import express from 'express';
import * as validation from './site.validation';
import { SiteController} from './site.controller';
import { ISite } from './site.interface';
import { validateFiltersForQuery } from '../../../middlewares/queryValidation/paginationQueryValidationMiddleware';
import validateRequest from '../../../shared/validateRequest';
import auth from '../../../middlewares/auth';

const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const router = express.Router();

export const optionValidationChecking = <T extends keyof ISite>(
  filters: T[]
) => {
  return filters;
};

// const taskService = new TaskService();
const controller = new SiteController();

//info : pagination route must be before the route with params

// get all site by userId and type customer 💡
// get all site by userId and type user 💡
// get all user where role is customer [pagination ] 💡 show siteId, userName, siteName, cusName, address

// Admin: Site Management : get all site 💡 Done
// Admin : get all location of all site  💡

router.route('/paginate').get(
  //auth('common'),
  validateFiltersForQuery(optionValidationChecking(['_id'])),
  controller.getAllWithPaginationWithUsersAndManagers // Admin: Site Management : get all site 💡
);

//[🚧][🧑‍💻✅][🧪] // 🆗 // FIX ME : route ta change korte hobe get location of all site  ei route er jonno 
router.route('/test').get(
  auth('commonAdmin'),
  controller.getAllLocationOfSite
);

// get site details by site id 💡
router.route('/:id').get(
  // auth('common'),
  controller.getById
);

// update a site by site id 💡
router.route('/update/:id').put(
  //auth('common'),
  // validateRequest(UserValidation.createUserValidationSchema),
  controller.updateById
);

// get all location of site 💡
//[🚧][🧑‍💻✅][🧪] // 🆗
router.route('/location').get(
  auth('commonAdmin'),
  controller.getAllLocationOfSite
);

// router.route('/').get(
//   // auth('admin'),
//   controller.getAllLocationOfSite
// )

//[🚧][🧑‍💻✅][🧪] // 🆗
// Admin: create a new site 💡
router.route('/create').post(
  [
    upload.fields([
      { name: 'attachments', maxCount: 15 }, // Allow up to 5 cover photos
    ]),
  ],
  auth('admin'),
  validateRequest(validation.createSiteValidationSchema),
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



/*************
 * 
 * Admin: updateSiteForm :: get a site by id with assign manager and assigned user info 
 * 
 * ************* */




// TODO: update location of a site by site id
// INFO :  try korte hobe .. location update korar api ta update site er maddhome korar try korte hobe..  

/*************
 * 
 * Admin: updateSiteForm :: get a site by id with assign manager and assigned user info 
 * 
 * ************* */
router.route('/update-site-form/:id').put(
  [
    upload.fields([
      { name: 'attachments', maxCount: 15 }, // Allow up to 5 cover photos
    ]),
  ],
  auth('admin'),
  controller.updateById
)

export const siteRoute = router;
