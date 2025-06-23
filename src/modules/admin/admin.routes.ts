import { Router } from 'express';
import auth from '../../middlewares/auth';
import fileUploadHandler from '../../shared/fileUploadHandler';

const router = Router();

const UPLOADS_FOLDER = 'uploads/users';
const upload = fileUploadHandler(UPLOADS_FOLDER);

// get all key metrics [total site, customers, recent report, recent client messsage]
// and at the same time get report count by month 💡

export const AdminRoutes = router;
