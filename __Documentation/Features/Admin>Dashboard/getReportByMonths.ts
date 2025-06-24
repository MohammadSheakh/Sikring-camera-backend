// Get report count by months
const getReportCountByMonths = async () => {
    try {
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
    } catch (error) {
        console.error('Error fetching monthly report counts:', error);
        throw error;
    }
};

// Alternative version for specific year
const getReportCountByMonthsForYear = async (year = new Date().getFullYear()) => {
    try {
        const reportsByMonth = await report.aggregate([
            {
                $match: {
                    isDeleted: false,
                    createdAt: {
                        $gte: new Date(year, 0, 1),
                        $lt: new Date(year + 1, 0, 1)
                    }
                }
            },
            {
                $group: {
                    _id: { $month: "$createdAt" },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { "_id": 1 }
            }
        ]);

        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                           'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        
        const result = monthNames.map((name, index) => ({
            month: name,
            count: 0
        }));

        reportsByMonth.forEach(item => {
            const monthIndex = item._id - 1;
            result[monthIndex].count = item.count;
        });

        return result;
    } catch (error) {
        console.error('Error fetching monthly report counts:', error);
        throw error;
    }
};

// Usage example
const getMonthlyReportsData = async () => {
    const monthlyData = await getReportCountByMonths();
    console.log('Monthly Report Counts:', monthlyData);
    
    // Format for chart data
    const chartData = {
        labels: monthlyData.map(item => item.month),
        data: monthlyData.map(item => item.count)
    };
    
    return chartData;
};

// If you need last 12 months from current date (rolling 12 months)
const getLast12MonthsReportCount = async () => {
    try {
        const twelveMonthsAgo = new Date();
        twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

        const reportsByMonth = await report.aggregate([
            {
                $match: {
                    isDeleted: false,
                    createdAt: { $gte: twelveMonthsAgo }
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
                $sort: { "_id.year": 1, "_id.month": 1 }
            }
        ]);

        return reportsByMonth.map(item => ({
            month: `${item._id.month}/${item._id.year}`,
            count: item.count
        }));
    } catch (error) {
        console.error('Error fetching last 12 months report counts:', error);
        throw error;
    }
};