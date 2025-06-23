import express from 'express';
import { UserRoutes } from '../modules/user/user.route';
import { AuthRoutes } from '../modules/auth/auth.routes';
import { AdminRoutes } from '../modules/admin/admin.routes';
import { ConversationRoute } from '../modules/_chatting/conversation/conversation.route';
import { SubscriptionPlanRoute } from '../modules/_subscription/subscriptionPlan/subscriptionPlan.route';
import { NotificationRoutes } from '../modules/notification/notification.routes';
import { MessageRoute } from '../modules/_chatting/message/message.route';
import { customerReportRoute } from '../modules/_report/customerReport/customerReport.route';
import { cameraRoute } from '../modules/_camera/camera/camera.route';
import { cameraCustomerRoute } from '../modules/_camera/cameraCustomer/cameraCustomer.route';
import { reportRoute } from '../modules/_report/report/report.route';
import { cameraSiteRoute } from '../modules/_site/cameraSite/cameraSite.route';
import { siteRoute } from '../modules/_site/site/site.route';
import { userSiteRoute } from '../modules/_site/userSite/userSite.route';
import { auditLogRoute } from '../modules/auditLog/auditLog.route';

// import { ChatRoutes } from '../modules/chat/chat.routes';
// import { MessageRoutes } from '../modules/message/message.routes';
const router = express.Router();

const apiRoutes = [
  {
    path: '/auth',
    route: AuthRoutes,
  },
  {
    path: '/user',
    route: UserRoutes,
  },
  {
    path: '/admin',
    route: AdminRoutes,
  },
  ////////////////////// Created By Mohammad Sheakh
  {
    // 🌀
    path: '/conversation',
    route: ConversationRoute,
  },
  {
    // 🌀
    path: '/message',
    route : MessageRoute
  },
  {
    // 🌀
    path: '/camera',
    route: cameraRoute,
  },
  {
    // 🌀
    path: '/camera-customer',
    route: cameraCustomerRoute,
  },
  {
    // 🌀
    path: '/customer-report',
    route: customerReportRoute,
  },
  {
    // 🌀
    path: '/report',
    route: reportRoute,
  },
  {
    // 🌀
    path: '/camera-site',
    route: cameraSiteRoute,
  },
  {
    // 🌀
    path: '/site',
    route: siteRoute,
  },
  {
    // 🌀
    path: '/user-site',
    route: userSiteRoute,
  },
  {
    // 🌀
    path: '/audit-log',
    route: auditLogRoute,
  },
  {
    // 🌀
    path: '/notification',
    route: NotificationRoutes,
  },
];

apiRoutes.forEach(route => router.use(route.path, route.route));

export default router;
