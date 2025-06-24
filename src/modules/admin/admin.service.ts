import { report } from "../_report/report/report.model";
import { site } from "../_site/site/site.model"
import { User } from "../user/user.model";


export class adminService {
  
  constructor() {

  }
  

  getAllKeyMetricsWithReportCountByMonths = async () => {
    
    async function getReportCountOfLastTwentyFourHours () {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      return await report.countDocuments({
          isDeleted: false,
          createdAt: { $gte: twentyFourHoursAgo }
      });
    }

    async function getRecentClientMessage() {
      // Assuming you have a message model and a way to filter by client messages
      // TODO : WE have to implement this .. 

      return null;
    }

    const [totalSite, totalCustomers, recentReport, recentClientMessage]
     = await Promise.all([
      // Assuming these methods are defined in your service
      await site.countDocuments({ isDeleted: false }),
      await User.countDocuments({ isDeleted: false, role: 'customer' }),
      await getReportCountOfLastTwentyFourHours(),
      
      await getRecentClientMessage() // TODO : we have to implement this .. 
     ])

     return {
      totalSite,
      totalCustomers,
      recentReport,
      recentClientMessage
     };
  } 

  // add more methods here if needed 
  

}