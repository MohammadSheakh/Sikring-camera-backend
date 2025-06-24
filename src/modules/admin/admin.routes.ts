import { Router } from 'express';
import auth from '../../middlewares/auth';
import fileUploadHandler from '../../shared/fileUploadHandler';
import { AdminController } from './admin.controller';

const router = Router();

const UPLOADS_FOLDER = 'uploads/users';
const upload = fileUploadHandler(UPLOADS_FOLDER);

let adminController = new AdminController();

// get all key metrics [total site, customers, recent report, recent client messsage]
// and at the same time get report count by month 💡

//[🚧][🧑‍💻✅][🧪🆗] 
router.route('/key-metrics').get(
  auth('admin'),
  adminController.getAllKeyMetricsWithReportCountByMonths
)

export const AdminRoutes = router;
