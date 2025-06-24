import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { GenericController } from '../../__Generic/generic.controller';
import { site } from './site.model';
import { Isite } from './site.interface';
import { siteService } from './site.service';
import catchAsync from '../../../shared/catchAsync';
import { AttachmentService } from '../../attachments/attachment.service';
import { TAttachedToType, TFolderName } from '../../attachments/attachment.constant';
import sendResponse from '../../../shared/sendResponse';
import eventEmitterForAuditLog from '../../auditLog/auditLog.service';
import { IauditLog } from '../../auditLog/auditLog.interface';
import { TStatus } from '../../auditLog/auditLog.constant';

const attachmentService = new AttachmentService();

export class siteController extends GenericController<
  typeof site,
  Isite
> {
  siteService = new siteService();

  constructor() {
    super(new siteService(), 'site');
  }

  create = catchAsync(async (req: Request, res: Response) => {
    
        console.log('req.body 🧪🧪🧪', req.body);

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
        });

        let valueForAuditLog : IauditLog = {
          userId: req.user.userId,
          role: req.user.role,
          actionPerformed: `Created a new ${this.modelName} named ${req.body.name}`,
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


  // add more methods here if needed or override the existing ones 
  
}
