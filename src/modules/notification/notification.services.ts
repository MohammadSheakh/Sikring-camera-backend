import { INotification } from './notification.interface';
import { Notification } from './notification.model';
import { PaginateOptions } from '../../types/paginate';


const getALLNotification = async (
  filters: Partial<INotification>,
  options: PaginateOptions,
  userId: string
) => {
  filters.receiverId = userId;
  const unViewNotificationCount = await Notification.countDocuments({
    receiverId: userId,
    viewStatus: false,
  });

  const result = await Notification.paginate(filters, options);
  return { ...result, unViewNotificationCount };
};
/*
const getAdminNotifications = async (
  filters: Partial<INotification>,
  options: PaginateOptions
): Promise<PaginateResult<INotification>> => {
  filters.role = 'admin'; // Important SQL
  return Notification.paginate(filters, options);
};

const getSingleNotification = async (
  notificationId: string
): Promise<INotification | null> => {
  const result = await Notification.findById(notificationId);
  if (!result) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Notification not found');
  }
  return result;
};

const addCustomNotification = async (
  eventName: string,
  notifications: INotification,
  userId?: string
) => {
  const messageEvent = `${eventName}::${userId}`;
  const result = await addNotification(notifications);

  if (eventName === 'admin-notification' && notifications.role === 'admin') {
    //@ts-ignore
    io.emit('admin-notification', {
      code: StatusCodes.OK,
      message: 'New notification',
      data: result,
    });
  } else {
    //@ts-ignore
    io.emit(messageEvent, {
      code: StatusCodes.OK,
      message: 'New notification',
      data: result,
    });
  }
  return result;
};

const viewNotification = async (notificationId: string) => {
  const result = await Notification.findByIdAndUpdate(
    notificationId,
    { viewStatus: true },
    { new: true }
  );
  if (!result) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Notification not found');
  }
  return result;
};
*/

/* /// Written by Sheakh

// Test korte hobe .. 
const deleteNotification = async (notificationId: string) => {
  const result = await Notification.findByIdAndDelete(notificationId);
  if (!result) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Notification not found');
  }
  return result;
};

// Test korte hobe ... 
const clearAllNotification = async (userId: string) => {
  const user = await User.findById(userId);
  if (user?.role === 'projectManager') {
    const result = await Notification.deleteMany({ role: 'projectManager' });
    return result;
  }
  const result = await Notification.deleteMany({ receiverId: userId });
  return result;
};

*/
export const NotificationService = {
  getALLNotification,
  
  // getAdminNotifications,
  // getSingleNotification,
  // addCustomNotification,
  // viewNotification,
  // deleteNotification,
  // clearAllNotification,
};


// Helper function to calculate current cycle day
function calculateCurrentCycleDay(
  currentDate: Date,
  baseDate: Date,
  avgCycleLength: number
): number {
  const daysSinceBase = Math.floor(
    (currentDate.getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysSinceBase < 0) {
    // Current date is before the base date
    return 1;
  }

  // Calculate which cycle we're in and what day of that cycle
  const cycleDay = (daysSinceBase % avgCycleLength) + 1;

  return cycleDay;
}