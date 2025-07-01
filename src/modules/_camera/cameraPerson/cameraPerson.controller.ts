
import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { GenericController } from '../../__Generic/generic.controller';
import { ICameraPerson } from './cameraPerson.interface';
import { CameraPerson } from './cameraPerson.model';
import { CameraPersonService } from './cameraPerson.service';
import { Request, Response } from 'express';


// let conversationParticipantsService = new ConversationParticipentsService();
// let messageService = new MessagerService();

export class CameraPersonController extends GenericController<
  typeof CameraPerson,
  ICameraPerson
> {
  CameraPersonService = new CameraPersonService();

  constructor() {
    super(new CameraPersonService(), 'CameraPerson');
  }

  /*************
   * 
   *  Admin > Site Management > (Give View Access to Customer) assign multiple persons for view access to camera
   *  Manager > 
   * 
   * ************* */
  assignMultiplePersonForViewAccessToCamera = catchAsync(async (req: Request, res: Response) => {
    const { cameraId, siteId, personIdsToEnableAccess , personIdsToDisableAccess } = req.body;

    // Call service method
    const result = await this.CameraPersonService.assignMultiplePersonForViewAccess(cameraId,siteId, personIdsToEnableAccess, personIdsToDisableAccess);

    sendResponse(res, {
      code: StatusCodes.OK,
      data: result,
      message: 'Assigned multiple persons for view access to camera',
      success: true,
    });
  });

  /*************
   * 
   *  Admin > Site Management > (Give View Access to Customer) show all customers who have or have not access to a camera
   * 
   * ************* */
  getUsersWithAccessToCamera = catchAsync(async (req: Request, res: Response) => {
    const { cameraId } = req.params;
    // Call service method
    const result = await this.CameraPersonService.getUsersWithAccessToCamera(cameraId);
    //getUsersWithAccessToCameraV
    // getUsersWithAccessToCameraV1
    sendResponse(res, {
      code: StatusCodes.OK,
      data: result,
      message: 'Fetched users with access to camera',
      success: true,
    });
  });

  // add more methods here if needed or override the existing ones 
  
}
