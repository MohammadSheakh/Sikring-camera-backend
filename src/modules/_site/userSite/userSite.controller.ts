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
import { GenericService } from '../../__Generic/generic.services';
import { User } from '../../user/user.model';


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
   * Customer : Home Page : get All site by personId and customer type 
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
      //   select: 'name role' // name 
      // },
      // 'personId'
      {
        path: 'siteId',
        select: 'name createdAt type'
      }
    ];

    const dontWantToInclude = '-role -workHours -isDeleted -updatedAt -createdAt -__v';
    //const dontWantToInclude = ['']; // -role

     let userInfo;

   
    
    if(req.user.userId){
      userInfo = await User.findById(req.user.userId).select('name role');
    }

    const result = await this.userSiteService.getAllWithPagination(filters, options, populateOptions, dontWantToInclude);

    if(userInfo){
      result.userInfo  = userInfo;
    }

    sendResponse(res, {
      code: StatusCodes.OK,
      data: result,
      message: `All ${this.modelName} with pagination`,
      success: true,
    });
  });


  getAllWithPaginationForManager = catchAsync(async (req: Request, res: Response) => {
    //const filters = pick(req.query, ['_id', 'title']); // now this comes from middleware in router
    const filters =  omit(req.query, ['sortBy', 'limit', 'page', 'populate']); ;
    const options = pick(req.query, ['sortBy', 'limit', 'page', 'populate']);
    
    const populateOptions: (string | {path: string, select: string}[]) = [
      {
        path: 'personId',
        select: 'name role' // name 
      },
      // 'personId'
      {
        path: 'siteId',
        select: 'name createdAt type attachments',
        populate: {
          path: 'attachments',
          select: 'attachment'
        }
      }
    ];

    const dontWantToInclude = '-role -workHours -isDeleted -updatedAt -createdAt -__v';
    //const dontWantToInclude = ['']; // -role

     let userInfo;


    const result = await this.userSiteService.getAllWithPagination(filters, options, populateOptions, dontWantToInclude);

   
    sendResponse(res, {
      code: StatusCodes.OK,
      data: result,
      message: `All ${this.modelName} with pagination`,
      success: true,
    });
  });


  
/***********
 * 
 * Web (Manager) : Dashboard : get all site by personId and customer type |🔴|//TODO :  eta pagination kora jabe na
 * 
 * *********** */ 
  //[🚧][🧑‍💻][🧪] // ✅🆗
  getAllWithPaginationForManagerDashboard = catchAsync(async (req: Request, res: Response) => {
    //const filters = pick(req.query, ['_id', 'title']); // now this comes from middleware in router
    const filters =  omit(req.query, ['sortBy', 'limit', 'page', 'populate']); ;
    const options = pick(req.query, ['sortBy', 'limit', 'page', 'populate']);
    
    const populateOptions: (string | {path: string, select: string}[]) = [
      // {
      //   path: 'personId',
      //   select: 'name role' // name 
      // },
      // 'personId'
      {
        path: 'siteId',
        select: 'name address status'
      }
    ];

    const dontWantToInclude = '-role -workHours -isDeleted -updatedAt -createdAt -__v';
    //const dontWantToInclude = ['']; // -role

     let userInfo;

   
    
    if(req.user.userId){
      userInfo = await User.findById(req.user.userId).select('name role');
    }

    const result = await this.userSiteService.getAllWithPagination(filters, options, populateOptions, dontWantToInclude);

    if(userInfo){
      result.userInfo  = userInfo;
    }

    sendResponse(res, {
      code: StatusCodes.OK,
      data: result,
      message: `All ${this.modelName} with pagination`,
      success: true,
    });
  });


  // 🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴 issue  for conversation
  // add more methods here if needed or override the existing ones 
  //[🚧][🧑‍💻][🧪] // ✅🆗
  getAllWithPaginationForUserConversation = catchAsync(async (req: Request, res: Response) => {
    
    const results = await  userSite.find()

    console.log('results 🧪🧪🧪🧪🧪', results);

    sendResponse(res, {
      code: StatusCodes.OK,
      data: null,
      message: `All ${this.modelName} with pagination`,
      success: true,
    });
  });
}
