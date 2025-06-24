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

    async function getReportCountByMonths() {
        const reportsByMonth = await report.aggregate([
            {
                $match: {
                    isDeleted: false,
                    createdAt: {
                        $gte: new Date(new Date().getFullYear(), 0, 1), // Start of current year
                        $lt: new Date(new Date().getFullYear() + 1, 0, 1) // Start of next year
                    }
                }
            },
            {
                $group: {
                    _id: {
                        month: { $month: "$createdAt" },
                        year: { $year: "$createdAt" }
                    },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { "_id.month": 1 }
            }
        ]);

        // Create array with all 12 months initialized to 0
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                           'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        
        const result = monthNames.map((name, index) => ({
            month: name,
            count: 0
        }));

        // Fill in actual counts
        reportsByMonth.forEach(item => {
            const monthIndex = item._id.month - 1; // MongoDB months are 1-indexed
            result[monthIndex].count = item.count;
        });

        return result;
    }

    const [totalSite, totalCustomers, recentReport, recentClientMessage, reportCountByMonth]
     = await Promise.all([
      // Assuming these methods are defined in your service
      await site.countDocuments({ isDeleted: false }),
      await User.countDocuments({ isDeleted: false, role: 'customer' }),
      await getReportCountOfLastTwentyFourHours(),
      
      await getRecentClientMessage(),  // TODO : we need to implement this 
      
      await getReportCountByMonths()  // TODO: eta test korte hobe thik result dicche kina
    ])

     return {
      totalSite,
      totalCustomers,
      recentReport,
      recentClientMessage,
      reportCountByMonth
     };
  } 

  // add more methods here if needed 
  
}