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

export const optionValidationChecking = <T extends keyof IuserSite  | 'sortBy' | 'page' | 'limit' | 'populate'>(
  filters: T[]
) => {
  return filters;
};

// const taskService = new TaskService();
const controller = new userSiteController();

const paginationOptions: Array<'sortBy' | 'page' | 'limit' | 'populate'> = [
  'sortBy',
  'page',
  'limit',
  'populate',
];

//info : pagination route must be before the route with params

/***********
 * 
 * App (Customer) : Home : get all site by personId and customer type
 * 
 * *********** */ 
router.route('/paginate').get(
  auth('common'),
  validateFiltersForQuery(optionValidationChecking(['_id', 'personId', 'role', 'siteId', ...paginationOptions])),
  controller.getAllWithPagination
);


/***********
 * 
 * Dashboard (Admin) : Work Hours : get all site and work hour of employee ... 
 * 
 * *********** */ 
router.route('/work-hour/paginate').get(
  auth('common'),
  validateFiltersForQuery(optionValidationChecking(['_id', 'personId', 'role', 'siteId', ...paginationOptions])),
  controller.getAllWithPaginationForWorkHour
);

/*********
 * 
 * Dashboard (Admin) : Work Hours : add work hour for a user to a site 💡 
 * 
 * ******** */
router.route('/work-hour/update/:userSiteId').put(
  auth('common'),
  controller.updateWorkHourByUserSiteId
);

/***********
 * 
 * App (Customer) : Home : get al site by siteId And role manager 
 * Web (Manager) : Site Management
 * 
 * *********** */ 
router.route('/paginate/siteId').get(
  auth('common'), 
  validateFiltersForQuery(optionValidationChecking(['_id', 'role', 'siteId', ...paginationOptions])),
  controller.getAllWithPagination
);

/***********
 * 
 * App (Customer) : Home : get al site by siteId And role manager 
 * Web (Manager) : Site Management
 * 
 * *********** */ 
router.route('/paginate/for-customer/siteId').get(
  auth('common'), 
  validateFiltersForQuery(optionValidationChecking(['_id', 'role', 'siteId', ...paginationOptions])),
  controller.getAllWithPaginationWithManagerInfo
);

/***********
 * 
 * Web (Manager) : Site Management
 * 
 * *********** */ 
router.route('/paginate/manager/siteId').get(
  auth('common'),
  validateFiltersForQuery(optionValidationChecking(['_id', 'role', 'siteId', ...paginationOptions])),
  controller.getAllWithPaginationForManager
);

/***********
 * 
 * Web (Manager) : Dashboard : get all site by personId and customer type 
 * 
 * *********** */ 
router.route('/manager/paginate').get(
  auth('common'), 
  validateFiltersForQuery(optionValidationChecking(['_id', 'personId', 'role', 'siteId', ...paginationOptions])),
  controller.getAllWithPaginationForManagerDashboard
);

/***********
 * 
 * App (Customer) : ConversationList : get all Related Person And Conversation 🟡🟡🟡 its not working .. 
 * // 🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴 issue  for conversation
 * *********** */ 
router.route('/conversation/paginate').get(
  auth('common'), 
  validateFiltersForQuery(optionValidationChecking(['_id', 'personId', 'role', 'siteId', ...paginationOptions])),
  controller.getAllWithPaginationForUserConversation
);

/**************
 * 
 *  (Dashboard) (Admin) : Show all Related User For Create Conversation
 * 
 * ************* */
router.route('/conversation/admin/paginate').get(
  auth('common'), 
  validateFiltersForQuery(optionValidationChecking(['_id', 'personId', 'role', 'siteId', ...paginationOptions])),
  controller.getAllWithPaginationForAdminConversation
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

// TODO : assign multiple users to a site 

export const userSiteRoute = router;
