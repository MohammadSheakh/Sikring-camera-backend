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


  /**************
   * 
   *  (App) (Customer) : Show all Related User For Create Conversation
   * 
   * ************* */
  
  //[🚧][🧑‍💻][🧪] // ✅🆗
  getAllWithPaginationForUserConversation = catchAsync(async (req: Request, res: Response) => {
    
    // Step 1: Retrieve all siteIds related to the user
    const sitesRelatedToUser = await userSite.find(
      { personId: req.user.userId, isDeleted: false },
      'siteId' // Select only the 'siteId' field
    );

    // Extract siteIds from the result
    const siteIds = sitesRelatedToUser.map(site => site.siteId);

    // Step 2: Retrieve all personIds related to the retrieved siteIds
    const personIdsRelatedToSites = await userSite.find(
      { siteId: { $in: siteIds }, isDeleted: false },
      'personId siteId' // Select only the 'personId' field
    ).populate({
      path: 'personId',
      select: 'name role',
    });

    // Step 3: Aggregate unique personIds into a Set
    const uniquePersonIds = new Set(personIdsRelatedToSites.map(person => 
        // person.personId
        {
        console.log('person::', person)
          return {
            personId: person.personId,
            siteId: person.siteId
          }
      }  
    ).filter(personId => {

      return personId.personId.toString() !== req.user.userId.toString();

    } ) // Exclude logged-in user
    );

    // Convert the Set to an array if needed
    const uniquePersonIdsArray = Array.from(uniquePersonIds);

    console.log('Unique Person IDs:', uniquePersonIdsArray);

    console.log('req.user.userId', req.user.userId);


    sendResponse(res, {
      code: StatusCodes.OK,
      data: uniquePersonIdsArray,
      message: `All ${this.modelName} with pagination`,
      success: true,
    });
  });


  /**************
   * 
   *  (Dashboard) (Admin) : Show all Related User For Create Conversation
   * 
   * ************* */
  
  //[🚧][🧑‍💻][🧪] // ✅🆗
  getAllWithPaginationForAdminConversation = catchAsync(async (req: Request, res: Response) => {
    
    /*****************************

    const sitesRelatedToUser = await  userSite.find({
      personId: req.user.userId,
      isDeleted: false,
    }).select('siteId')

   sitesRelatedToUser.map((site) => {
    // now for every siteId.. we have to get related PersonId and set those id into a set .. 
    // so that we can get unique personId

    const personIdsRelatedToSite = userSite.find({
      siteId: site.siteId,
      isDeleted: false,
    }).select('personId');

    *****************************/

    // TODO : req.params.role e valid role pass kortese kina .. sheta check dite hobe 
    // TODO : userSite e ..  

    console.log('role 🧪🧪', req.query.role);

    // Step 1: Retrieve all siteIds related to the user
    const sitesRelatedToUser = await userSite.find(
      { personId: req.user.userId, isDeleted: false },
      'siteId' // Select only the 'siteId' field
    );

    // Extract siteIds from the result
    const siteIds = sitesRelatedToUser.map(site => site.siteId);

    // Step 2: Retrieve all personIds related to the retrieved siteIds
    const personIdsRelatedToSites = await userSite.find(
      { siteId: { $in: siteIds }, isDeleted: false },
      'personId siteId' // Select only the 'personId' field
    ).populate({
      path: 'personId',
      select: 'name role canMessage',
    });

    // Step 3: Aggregate unique personIds into a Set
    const uniquePersonIds = new Set(personIdsRelatedToSites.map(person => 
      {
        // console.log('person::', person)
          return {
            personId: person.personId,
            siteId: person.siteId
          }
      }  
      
    ).filter(personId => {

      // console.log('personId =====', personId);

      return personId.personId.toString() !== req.user.userId.toString()  && 
      personId.personId.role === req.query.role; // Exclude logged-in user and filter by role

    } ) // Exclude logged-in user
    );

    // Convert the Set to an array if needed
    const uniquePersonIdsArray = Array.from(uniquePersonIds);

    // console.log('Unique Person IDs:', uniquePersonIdsArray);

    // console.log('req.user.userId', req.user.userId);

    sendResponse(res, {
      code: StatusCodes.OK,
      data: uniquePersonIdsArray,
      message: `All ${this.modelName} with pagination`,
      success: true,
    });
  });


  // add more methods here if needed or override the existing ones 
}
