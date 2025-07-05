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

          actionPerformed+= `Assign a manager for ${this.modelName} whoose id is ${req.body.assignedManagerId} `
        
        }
        if(req.body.assignedUserId  && result){
          // need to check if the manager exist or not  

          const createdUserForSite = await userSiteService.create({
            personId: req.body.assignedUserId,
            siteId: result._id,
            role: TRole.user,
          });

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
    ).select('-isDeleted -updatedAt -createdAt -__v');
    
    actionPerformed = `Updated ${this.modelName} with id ${id} | `;

    if(req.body.assignedManagerId && result){

      // need to check if the manager exist or not  

      const updatedManagerForSite = await userSite.findOneAndUpdate(
        { personId: req.body.assignedManagerId, siteId: result._id },
        { role: TRole.manager },
        { new: true, upsert: true } // upsert to create if not exists
      )

      actionPerformed+= `| Assign a manager for ${this.modelName} whoose id is ${req.body.assignedManagerId} `

    }
    if(req.body.assignedUserId  && result){
      // need to check if the manager exist or not  

      const updatedManagerForSite = await userSite.findOneAndUpdate(
        { personId: req.body.assignedUserId, siteId: result._id },
        { role: TRole.manager },
        { new: true, upsert: true } // upsert to create if not exists
      )

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
    const filters =  omit(req.query, ['sortBy', 'limit', 'page', 'populate']); ;
    const options = pick(req.query, ['sortBy', 'limit', 'page', 'populate']);
    
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

  // add more methods here if needed or override the existing ones 
  
}
