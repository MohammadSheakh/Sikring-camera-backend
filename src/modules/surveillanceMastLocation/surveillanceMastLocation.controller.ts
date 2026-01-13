//@ts-ignore
import { Request, Response } from 'express';
//@ts-ignore
import { StatusCodes } from 'http-status-codes';
import { GenericController } from '../__Generic/generic.controller';
import { SurveillanceMastLocation } from './surveillanceMastLocation.model';
import { ISurveillanceMastLocation } from './surveillanceMastLocation.interface';
import { SurveillanceMastLocationService } from './surveillanceMastLocation.service';
import catchAsync from '../../shared/catchAsync';
import sendResponse from '../../shared/sendResponse';

// let conversationParticipantsService = new ConversationParticipentsService();
// let messageService = new MessagerService();

export class SurveillanceMastLocationController extends GenericController<
  typeof SurveillanceMastLocation,
  ISurveillanceMastLocation
> {
  SurveillanceMastLocationService = new SurveillanceMastLocationService();

  constructor() {
    super(new SurveillanceMastLocationService(), 'SurveillanceMastLocation');
  }

  // 🆕 
  create = catchAsync(async (req: Request, res: Response) => {
    const data = req.body;

    data.userId = req.user.userId;

    const result = await this.service.create(data);

    sendResponse(res, {
      code: StatusCodes.OK,
      data: result,
      message: `${this.modelName} created successfully`,
      success: true,
    });
  });

  // add more methods here if needed or override the existing ones 
}
