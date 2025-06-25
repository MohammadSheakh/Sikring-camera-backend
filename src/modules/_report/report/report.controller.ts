import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import { GenericController } from '../../__Generic/generic.controller';
import { report } from './report.model';
import { Ireport } from './report.interface';
import { ReportService } from './report.service';
import catchAsync from '../../../shared/catchAsync';
import { TAttachedToType, TFolderName } from '../../attachments/attachment.constant';
import { AttachmentService } from '../../attachments/attachment.service';
import { CustomerReportService } from '../customerReport/customerReport.service';
import { IauditLog } from '../../auditLog/auditLog.interface';
import { TStatus } from '../../auditLog/auditLog.constant';
import eventEmitterForAuditLog from '../../auditLog/auditLog.service';
import sendResponse from '../../../shared/sendResponse';

// let conversationParticipantsService = new ConversationParticipentsService();
let attachmentService = new AttachmentService();

export class reportController extends GenericController<
  typeof report,
  Ireport
> {
  reportService = new ReportService();
  customerReportService = new CustomerReportService();

  constructor() {
    super(new ReportService(), 'report');
  }

  create = catchAsync(async (req: Request, res: Response) => {
    
    // console.log('req.body 🧪🧪🧪', req.body);
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
        title: req.body.title,
        reportType: req.body.reportType,
        incidentSevearity: req.body.incidentSevearity,
        siteId: req.body.siteId,
        description: req.body.description,
        status: req.body.status, 
        attachments: req.body.attachments,
    });

    let actionPerformed = '';

    if(result._id){

      // need to check if the manager exist or not  

      const customerForReport = await this.customerReportService.create({
        personId: req.user.userId,
        reportId: result._id,
        role: req.user.role,
      });


      actionPerformed+= `A New Review ${result._id} Created by ${req.user.userId} For Site ${req.body.siteId} `
    }
    

    let valueForAuditLog : IauditLog = {
      userId: req.user.userId,
      role: req.user.role,
      actionPerformed: `${actionPerformed}`,
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
