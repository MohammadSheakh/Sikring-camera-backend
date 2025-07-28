import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { GenericController } from '../../__Generic/generic.controller';
import { Site } from './site.model';
import { ISite } from './site.interface';
import { siteService } from './site.service';
import catchAsync from '../../../shared/catchAsync';
import { AttachmentService } from '../../attachments/attachment.service';
import { TAttachedToType, TFolderName } from '../../attachments/attachment.constant';
import sendResponse from '../../../shared/sendResponse';
import eventEmitterForAuditLog from '../../auditLog/auditLog.service';
import { IauditLog } from '../../auditLog/auditLog.interface';
import { TStatus } from '../../auditLog/auditLog.constant';
import { TRole } from '../../user/user.constant';
import {UserSiteService }  from '../userSite/userSite.service';
import { userSite } from '../userSite/userSite.model';
import omit from '../../../shared/omit';
import pick from '../../../shared/pick';
import ApiError from '../../../errors/ApiError';

const attachmentService = new AttachmentService();
const userSiteService = new UserSiteService();

export class SiteController extends GenericController<
  typeof Site,
  ISite
> {
  siteService = new siteService();

  constructor() {
    super(new siteService(), 'site');
  }

  create = catchAsync(async (req: Request, res: Response) => {
    
        // TODO : req.body te assignedManager and assignedUser er nam nite hobe abu sayeed vai er kas theke .. 
        // INFO :  karon shei nam ta audit log e dekhano lagbe .. 

        let attachments = [];
  
        if (req.files && req.files.attachments) {
        attachments.push(
            ...(await Promise.all(
            req.files.attachments.map(async file => {
                const attachmenId = await attachmentService.uploadSingleAttachment(
                    file, // file to upload 
                    TFolderName.site, // folderName
                    req.user.userId, // uploadedByUserId
                    TAttachedToType.site
                );
                return attachmenId;
            })
            ))
        );
        }

        req.body.attachments = attachments;

        const result = await this.service.create({
            name: req.body.name,
            address: req.body.address,
            lat: req.body.lat,
            long : req.body.long,
            phoneNumber: req.body.phoneNumber,
            customerName: req.body.customerName || '',
            status: req.body.status, 
            attachments: req.body.attachments,
            type: req.body.type || "other",
        });

        const createdUserForSite = await userSiteService.create({
            personId: req.user.userId,
            siteId: result._id,
            role: TRole.admin,
          });

        let actionPerformed = '';

        if(req.body.assignedManagerId && result){

          // need to check if the manager exist or not  



          const createdManagerForSite = await userSiteService.create({
            personId: req.body.assignedManagerId,
            siteId: result._id,
            role: TRole.manager,
          });

          result.assignedManagerId = req.body.assignedManagerId;

          actionPerformed+= `Assign a manager for ${this.modelName} whoose id is ${req.body.assignedManagerId} `
        
        }
        if(req.body.assignedUserId  && result){
          // need to check if the manager exist or not  

          const createdUserForSite = await userSiteService.create({
            personId: req.body.assignedUserId,
            siteId: result._id,
            role: TRole.user,
          });

          result.assignedUserId = req.body.assignedUserId;

          actionPerformed+= `| Assign a user for ${this.modelName} whoose id is ${req.body.assignedUserId} `

        }

        let valueForAuditLog : IauditLog = {
          userId: req.user.userId,
          role: req.user.role,
          actionPerformed: `Created a new ${this.modelName} named ${req.body.name} | ${actionPerformed}`,
          status: TStatus.success,
        }

        eventEmitterForAuditLog.emit('eventEmitForAuditLog', valueForAuditLog);
        
        sendResponse(res, {
          code: StatusCodes.OK,
          data: result,
          message: `${this.modelName} created successfully`,
          success: true,
        });
  });

  /*************
   * 
   * Admin: updateSiteForm :: get a site by id with assign manager and assigned user info 
   * 
   * ************* */
  updateById = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) {
      throw new Error(`id is required for update ${this.modelName}`);
    }

    const site = await Site.findById(id);

    let attachments = [];
  
        if (req.files && req.files.attachments) {
        attachments.push(
            ...(await Promise.all(
            req.files.attachments.map(async file => {
                const attachmenId = await attachmentService.uploadSingleAttachment(
                    file, // file to upload 
                    TFolderName.site, // folderName
                    req.user.userId, // uploadedByUserId
                    TAttachedToType.site
                );
                return attachmenId;
            })
            ))
        );
        }

    req.body.attachments =  attachments ? attachments  : [...site.attachments, ...attachments];

    const updatedData = {
      name: req.body.name,
      address: req.body.address,
      lat: req.body.lat,
      long : req.body.long,
      phoneNumber: req.body.phoneNumber,
      customerName: req.body.customerName || '',
      status: req.body.status, 
      attachments: req.body.attachments,
      type: req.body.type || "other",
    };

    let actionPerformed;

    const result = await Site.findByIdAndUpdate(
      id,
      updatedData, 
      { new: true }
    ).select('-isDeleted -updatedAt -createdAt -__v').populate({
      path: 'attachments',
      select: 'attachment'
    });
    
    actionPerformed = `Updated ${this.modelName} with id ${id} | `;

    if(req.body.assignedManagerId && result){

      // need to check if the manager exist or not  

      const updatedManagerForSite = await userSite.findOneAndUpdate(
        { siteId: result._id , role: TRole.manager },
        { role: TRole.manager, personId: req.body.assignedManagerId , siteId: result._id  },
        { new: true, upsert: true } // upsert to create if not exists
      )

      console.log('updatedManagerForSite 🟢', updatedManagerForSite);

      // console.log('req.body.assignedManagerId 🟢', req.body.assignedManagerId);

      // TODO : issue hoile fix korte hobe 
      result.assignedManagerId = req?.body?.assignedManagerId ? req.body.assignedManagerId : result.assignedManagerId;

      actionPerformed+= `| Assign a manager for ${this.modelName} whoose id is ${req.body.assignedManagerId} `

    }
    if(req.body.assignedUserId  && result){
      // need to check if the user exist or not  

      const updatedUserForSite = await userSite.findOneAndUpdate(
        {  siteId: result._id , role: TRole.user },
        { role: TRole.user , personId: req.body.assignedUserId , siteId: result._id },
        { new: true, upsert: true } // upsert to create if not exists
      )
      
      // TODO : issue hoile fix korte hobe 
      result.assignedUserId = req?.body?.assignedUserId ? req.body.assignedUserId : result.assignedUserId;

      actionPerformed+=`| Assign a user for ${this.modelName} whoose id is ${req.body.assignedUserId} `

    }

    let valueForAuditLog : IauditLog = {
        userId: req.user.userId,
        role: req.user.role,
        actionPerformed: actionPerformed,
        status: TStatus.success,
    }

    eventEmitterForAuditLog.emit('eventEmitForAuditLog', valueForAuditLog);

    sendResponse(res, {
      code: StatusCodes.OK,
      data: result,
      message: `${this.modelName} updated successfully`,
      success: true,
    });
  });

  /*************
   * 
   *  As per sayed vai's con
   * 
   * *********** */

  deleteSiteCoverPhotosByCoverPhotoUrl = catchAsync(async (req, res) => {
  const { siteId, coverPhotoUrl:string } = req.query;
  const {coverPhotoUrl} = req.body;

  const site = await Site.findById(siteId);
  if (!site) {
    // throw new ApiError(httpStatus.NOT_FOUND, "Site not found");
    sendResponse(res, {
      code: StatusCodes.OK,
      data: null,
      message: `site is not found by siteId`,
      success: true,
    });

    
    }
    if(!coverPhotoUrl){
      throw new ApiError(StatusCodes.NOT_FOUND, "coverPhotoUrl not found");
    }

    await attachmentService.deleteAttachment(coverPhotoUrl);

    site.attachments = site?.attachments.filter(
      (url) => url !== coverPhotoUrl
    );

    await site?.save();

    res.status(200).json({
      message: "Image Deleted Successfully",
      status: "OK",
      statusCode: 200,
      data: site,
    });
  });


  /*************
   * 
   * Manager: updateSiteForm :: 
   * 
   * ************* */

  updateByIdForManager = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) {
      throw new Error(`id is required for update ${this.modelName}`);
    }

    let attachments = [];
  
        if (req.files && req.files.attachments) {
        attachments.push(
            ...(await Promise.all(
            req.files.attachments.map(async file => {
                const attachmenId = await attachmentService.uploadSingleAttachment(
                    file, // file to upload 
                    TFolderName.site, // folderName
                    req.user.userId, // uploadedByUserId
                    TAttachedToType.site
                );
                return attachmenId;
            })
            ))
        );
        }

    req.body.attachments = attachments;

    const updatedData = {
      name: req.body.name,
      address: req.body.address,
      lat: req.body.lat,
      long : req.body.long,
      phoneNumber: req.body.phoneNumber,
      attachments: req.body.attachments,
      type: req.body.type || "other",
    };

    let actionPerformed;

    const result = await Site.findByIdAndUpdate(
      id,
      updatedData, 
      { new: true }
    ).select('-isDeleted -updatedAt -createdAt -__v');
    
    actionPerformed = `Updated ${this.modelName} with id ${id} | `;

    let valueForAuditLog : IauditLog = {
        userId: req.user.userId,
        role: req.user.role,
        actionPerformed: actionPerformed,
        status: TStatus.success,
    }

    eventEmitterForAuditLog.emit('eventEmitForAuditLog', valueForAuditLog);

    sendResponse(res, {
      code: StatusCodes.OK,
      data: result,
      message: `${this.modelName} updated successfully`,
      success: true,
    });
  });

  //[🚧][🧑‍💻][🧪] // ✅🆗
  getAllWithPaginationWithUsersAndManagers = catchAsync(async (req: Request, res: Response) => {
    const filters =  omit(req.query, ['sortBy', 'limit', 'page', 'populate']);
    const options = pick(req.query, ['sortBy', 'limit', 'page', 'populate']);
    
    filters.isDeleted = false; // only get non-deleted sites

    const result = await this.siteService.getAllSitesWithUsersAndManagers(filters, options);

    sendResponse(res, {
      code: StatusCodes.OK,
      data: result,
      message: `All ${this.modelName} with pagination`,
      success: true,
    });
  });

  getAllLocationOfSite = catchAsync(async (req: Request, res: Response) => {
    const result = await this.siteService.getAllLocationOfSite();

    sendResponse(res, {
      code: StatusCodes.OK,
      data: result,
      message: `All location of ${this.modelName}`,
      success: true,
    });
  });


  getAll = catchAsync(async (req: Request, res: Response) => {
    const result = await Site.find().select('name');

    sendResponse(res, {
      code: StatusCodes.OK,
      data: result,
      message: `All ${this.modelName}s`,
      success: true,
    });
  });

  getById = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id;

    const populateOptions = [
        {
            path: 'attachments',
            select: 'attachment'
        },
        //'siteId' // This will populate all fields for siteId
        // {
        //   path: 'siteId',
        //   select: 'name address'
        // }
      ];

    // we have to pull this sites manager and user id .. 
    
    const userForThisSite = await userSite.find({
      siteId: id,
      isDeleted: false,
      role: { $in: [TRole.user] } // Only get managers and users
    })

    const managerForThisSite = await userSite.find({
      siteId: id,
      isDeleted: false,
      role: { $in: [TRole.manager] } // Only get managers and users
    })

    const result = await this.service.getById(id, populateOptions);
    if (!result) {
      throw new ApiError(
        StatusCodes.NOT_FOUND,
        `Object with ID ${id} not found`
      );
    }

    // TODO:  🟡
    // TODO : must handle if multiple user or manager exist for a site

    result.assignedUserId = userForThisSite[0]?.personId ? userForThisSite[0].personId : null;
    result.assignedManagerId = managerForThisSite[0]?.personId ? managerForThisSite[0].personId : null;

    sendResponse(res, {
      code: StatusCodes.OK,
      data: result,
      message: `${this.modelName} retrieved successfully`,
    });
  });

  softDeleteById = catchAsync(async (req: Request, res: Response) => {
    if (!req.params.id) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        `id is required for delete ${this.modelName}`
      );
    }

    const id = req.params.id;
    const deletedObject = await new siteService().softDeleteById(id);
    if (!deletedObject) {
      throw new ApiError(
        StatusCodes.NOT_FOUND,
        `Object with ID ${id} not found`
      );
    }

    //   return res.status(StatusCodes.NO_CONTENT).json({});
    sendResponse(res, {
      code: StatusCodes.OK,
      data: deletedObject,
      message: `${this.modelName} soft deleted successfully`,
    });
  });

  // add more methods here if needed or override the existing ones 
}
