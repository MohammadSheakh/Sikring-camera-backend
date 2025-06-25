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
import ApiError from '../../../errors/ApiError';
import { customerReport } from '../customerReport/customerReport.model';

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


  getById = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id;

    const populateOptions = [
      {
          path: 'attachments',
          select: 'attachment'
      },
      //'siteId' // This will populate all fields for siteId
      {
        path: 'siteId',
        select: 'name address'
      }
    ];
  
    const result = await this.service.getById(id, 
     /* ['attachments', 'siteId'] */
      populateOptions
    );

    // let find out who is submitting this report .. 
    const customerReportRes = await customerReport.find({
      reportId: id
    }).select('personId role').populate({
      path: 'personId',
      select: 'name email phoneNumber'
    });

    if (customerReportRes && customerReportRes.length > 0) {
      result.person = customerReportRes;
    } else {
      result.person = [];
    }

    if (!result) {
      throw new ApiError(
        StatusCodes.NOT_FOUND,
        `Object with ID ${id} not found`
      );
    }

    sendResponse(res, {
      code: StatusCodes.OK,
      data: result,
      message: `${this.modelName} retrieved successfully`,
    });
  });

  // add more methods here if needed or override the existing ones 
  
}
