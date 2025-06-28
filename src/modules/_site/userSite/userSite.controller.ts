import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import { GenericController } from '../../__Generic/generic.controller';
import { userSite } from './userSite.model';
import { IuserSite } from './userSite.interface';
import { UserSiteService } from './userSite.service';
import catchAsync from '../../../shared/catchAsync';
import omit from '../../../shared/omit';
import pick from '../../../shared/pick';
import sendResponse from '../../../shared/sendResponse';


// let conversationParticipantsService = new ConversationParticipentsService();
// let messageService = new MessagerService();

export class userSiteController extends GenericController<
  typeof userSite,
  IuserSite
> {
  userSiteService = new UserSiteService();

  constructor() {
    super(new UserSiteService(), 'userSite');
  }

  /********
   * 
   * Admin : Customer Management - get all user where role is customer 
   * 
   * ******* */
  //[🚧][🧑‍💻][🧪] // ✅🆗
  getAllWithPagination = catchAsync(async (req: Request, res: Response) => {
    //const filters = pick(req.query, ['_id', 'title']); // now this comes from middleware in router
    const filters =  omit(req.query, ['sortBy', 'limit', 'page', 'populate']); ;
    const options = pick(req.query, ['sortBy', 'limit', 'page', 'populate']);
    
    const populateOptions: (string | {path: string, select: string}[]) = [
      // {
      //   path: 'personId',
      //   select: 'name ' 
      // },
      // 'personId'
      // {
      //   path: 'siteId',
      //   select: ''
      // }
    ];

    const dontWantToInclude = ['']; // -role

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
