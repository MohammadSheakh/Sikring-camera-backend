import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import { GenericController } from '../../__Generic/generic.controller';
import { cameraSite } from './cameraSite.model';
import { IcameraSite } from './cameraSite.interface';
import { CameraSiteService } from './cameraSite.service';
import sendResponse from '../../../shared/sendResponse';
import catchAsync from '../../../shared/catchAsync';
import omit from '../../../shared/omit';
import pick from '../../../shared/pick';


// let conversationParticipantsService = new ConversationParticipentsService();
// let messageService = new MessagerService();

export class cameraSiteController extends GenericController<
  typeof cameraSite,
  IcameraSite
> {
  cameraSiteService = new CameraSiteService();

  constructor() {
    super(new CameraSiteService(), 'cameraSite');
  }

  /**************
   * 
   *  
   * 
   * ********** */

  getAllWithPagination = catchAsync(async (req: Request, res: Response) => {
    //const filters = pick(req.query, ['_id', 'title']); // now this comes from middleware in router
    const filters =  omit(req.query, ['sortBy', 'limit', 'page', 'populate']); ;
    const options = pick(req.query, ['sortBy', 'limit', 'page', 'populate']);
    
    const populateOptions: (string | {path: string, select: string}[]) = [
      {
        path: 'cameraId',
        select: 'cameraName localLocation  status ',
      }, // lat long  // assignedManagerId assignedUserId description
      // 'personId'
      {
        path: 'siteId',
        select: 'name'
      }
    ];

    // const dontWantToInclude = ['-localLocation -attachments']; // -role

    const dontWantToInclude = '-createdAt -updatedAt -__v'; // -role
    // -localLocation -attachments
    // -localLocation -attachments -cameraPassword -cameraIp -cameraPort -isDeleted -createdAt -updatedAt -__v 

    const result = await this.service.getAllWithPagination(filters, options, populateOptions, dontWantToInclude);

    sendResponse(res, {
      code: StatusCodes.OK,
      data: result,
      message: `All ${this.modelName} with pagination`,
      success: true,
    });
  });

  /**************
   * 
   *  Admin > Site Management > (View Live Page) get all camera by site Id  
   * 
   * ********** */

  getAllCameraBySiteIdWithPagination = catchAsync(async (req: Request, res: Response) => {
    //const filters = pick(req.query, ['_id', 'title']); // now this comes from middleware in router
    const filters =  omit(req.query, ['sortBy', 'limit', 'page', 'populate']); ;
    const options = pick(req.query, ['sortBy', 'limit', 'page', 'populate']);
    
    const populateOptions: (string | {path: string, select: string}[]) = [
      // {
      //   path: 'cameraId',
      //   select: '',
      // }, // lat long  // assignedManagerId assignedUserId description
       'cameraId'
      // {
      //   path: 'siteId',
      //   select: 'name'
      // }
    ];

    // const dontWantToInclude = ['-localLocation -attachments']; // -role

    const dontWantToInclude = '-createdAt -updatedAt -__v'; // -role
    // -localLocation -attachments
    // -localLocation -attachments -cameraPassword -cameraIp -cameraPort -isDeleted -createdAt -updatedAt -__v 

    const result = await this.service.getAllWithPagination(filters, options, populateOptions, dontWantToInclude);

    sendResponse(res, {
      code: StatusCodes.OK,
      data: result,
      message: `All ${this.modelName} with pagination`,
      success: true,
    });
  });


  // add more methods here if needed or override the existing ones 
  
}
