import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { GenericController } from '../../__Generic/generic.controller';
import { PredefinedCustomDescription } from './predefinedCustomDescription.model';
import { IPredefinedCustomDescription } from './predefinedCustomDescription.interface';
import { PredefinedCustomDescriptionService } from './predefinedCustomDescription.service';
import sendResponse from '../../../shared/sendResponse';
import pick from '../../../shared/pick';
import omit from '../../../shared/omit';
import catchAsync from '../../../shared/catchAsync';


// let conversationParticipantsService = new ConversationParticipentsService();
// let messageService = new MessagerService();

export class PredefinedCustomDescriptionController extends GenericController<
  typeof PredefinedCustomDescription,
  IPredefinedCustomDescription
> {
  PredefinedCustomDescriptionService = new PredefinedCustomDescriptionService();

  constructor() {
    super(new PredefinedCustomDescriptionService(), 'PredefinedCustomDescription');
  }

  getAllWithPagination = catchAsync(async (req: Request, res: Response) => {
    //const filters = pick(req.query, ['_id', 'title']); // now this comes from middleware in router
    const filters =  omit(req.query, ['sortBy', 'limit', 'page', 'populate']); ;
    const options = pick(req.query, ['sortBy', 'limit', 'page', 'populate']);
    
    filters.isDeleted = false;

    const populateOptions: (string | {path: string, select: string}[]) = [
      
    ];

    // const select = ''; // -role

    const result = await this.service.getAllWithPagination(filters, options, populateOptions/*, select*/);

    sendResponse(res, {
      code: StatusCodes.OK,
      data: result,
      message: `All ${this.modelName} with pagination`,
      success: true,
    });
  });

  // add more methods here if needed or override the existing ones 
}
