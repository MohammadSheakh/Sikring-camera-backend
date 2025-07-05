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
import { userSite } from '../../_site/userSite/userSite.model';
import mongoose from 'mongoose';
import { IuserSite } from '../../_site/userSite/userSite.interface';
import { IcustomerReport } from '../customerReport/customerReport.interface';

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
   
    // INFO : req.body te assignedManager and assignedUser er nam nite hobe abu sayeed vai er kas theke .. 
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

    const populateOptions = [
        {
            path: 'attachments',
            select: 'attachment'
        },
      ];

    /**************** 
    const result = await this.service.create({
        title: req.body.title,
        reportType: req.body.reportType,
        incidentSevearity: req.body.incidentSevearity,
        siteId: req.body.siteId,
        description: req.body.description,
        status: req.body.status, 
        attachments: req.body.attachments,
    });
    ************** */


    /****************   ******** */
    
    const result = await this.service.createAndPopulateSpecificFields({
        title: req.body.title,
        reportType: req.body.reportType,
        incidentSevearity: req.body.incidentSevearity,
        siteId: req.body.siteId,
        description: req.body.description,
        status: req.body.status, 
        attachments: req.body.attachments,
    }, populateOptions);
    
    let actionPerformed = '';

    if(result._id){

      // need to check if the manager exist or not  

      const customerForReport = await this.customerReportService.create({
        personId: req.user.userId,
        reportId: result._id,
        role: req.user.role,
        reportType: req.body.reportType
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
      {
        path: 'siteId',
        select: 'name address'
      }
    ];
  
    const result = await this.service.getById(id, 
      populateOptions
    );

    if (!result) {
      throw new ApiError(
        StatusCodes.NOT_FOUND,
        `Report Not Found `
      );
    }

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

    sendResponse(res, {
      code: StatusCodes.OK,
      data: result,
      message: `${this.modelName} retrieved successfully`,
    });
  });


  /***********
   * 
   * we are not using this controller .. 
   * 
   * as there was a design fault of UI designer .. so, design have been fixed .. 
   * now pagination works fine .. 
   * 
   * ********** */
  getAllReportByCategory = catchAsync(
    async (req: Request, res: Response) => {
      const response = await report.aggregate([
        {
          $group: {
            _id: '$reportType',
            reports: { $push: '$$ROOT' },
          },
        },
        {
          $project: {
            _id: 0,
            reportType: '$_id',
            reports: 1,
          },
        },
      ]);


      console.log('response 🧪🧪🧪', response);
      sendResponse(res, {
        code: StatusCodes.OK,
        data: response,
        message: `Reports categorized by ${req.params.category} retrieved successfully`,
      });
  })

  
  //[🚧][🧑‍💻✅][🧪🆗] // 6/26/2025 
  changeReportStatus = catchAsync(
    async (req: Request, res: Response) => {
      const id = req.params.id;
      const { status } = req.body;
      const userId = req.user.userId;

      /**********
       * 
       * TODO: MUST FIX : before everything we have to check if the report is already assigned to an employee or not .. 
       * 
       * lets 
       * 1. get the report  
       * 2. get the reports site Id
       * 3. get the site's user [basically employee] .. then 
       * 4... assign this report to that employee 
       * 
       * ********** */

      const reportDetails: Ireport | null = await report.findById(id);

      if (!reportDetails) {
        throw new ApiError(
          StatusCodes.NOT_FOUND,
          `Report with id ${id} not found`
        );
      }

      /// now we have to check if the siteId exist or not 

      if (!reportDetails.siteId) {
        throw new ApiError(
          StatusCodes.BAD_REQUEST,
          `Report with id ${id} does not have a siteId`
        );
      }

      // lets find the siteId's employee
      const siteUsers : IuserSite[] = await userSite.find(
        {
          siteId: reportDetails.siteId,
          role: 'user', // assuming employee is the role for site users
          isDeleted: false // make sure we are not getting deleted users
        }
      );

      console.log('siteUsers 🧪🧪🧪', siteUsers);

      /// assign this report to that employee 

      if (siteUsers.length === 0) {
        throw new ApiError(
          StatusCodes.NOT_FOUND,
          `No employee found for siteId ${reportDetails.siteId}`
        );
      }

      // lets check if the report is already assigned to an employee or not
      const existingCustomerReport = await customerReport.findOne({
        reportId: id,
        personId: siteUsers[0].personId, // check if the report is already
        role: 'user' // assuming employee is the role for site users
      });

      /****************
       * 
       *  if the report is already assigned to an employee, we need to update the report status
       * 
       * ************* */

      if (existingCustomerReport) {
        const updatedReport : Ireport | null = await report.findByIdAndUpdate(
        id,
        { status: status },
        { new: true }
      ).select('-isDeleted -createdAt -updatedAt -__v');

      if (!updatedReport) {
        throw new ApiError(
          StatusCodes.NOT_FOUND,
          `Report with id ${id} not found`
        );
      }

      let actionPerformed = `Report ${id} status changed to ${status} by ${req.user.userId} and assigned to employee ${siteUsers[0].personId} for site ${reportDetails.siteId}`;

      let valueForAuditLog: IauditLog = {
        userId: req.user.userId,
        role: req.user.role,
        actionPerformed: `${actionPerformed}`,
        status: TStatus.success,
      };

      eventEmitterForAuditLog.emit('eventEmitForAuditLog', valueForAuditLog);

      sendResponse(res, {
        code: StatusCodes.OK,
        data: updatedReport,
        message: `Report status changed successfully`,
      });
        return;
      }

      /****************
       * 
       *  if not .. // lets assign this report to the first employee
       * 
       *  initialy under review thake ... 
       *  accept hoilei user ke assign korbo .. 
       *  deny hoile user ke assign korbo na .. 
       * ************* */

      if(status === 'accept'){

        const customerReportRes : IcustomerReport = await this.customerReportService.create({
          personId: siteUsers[0].personId, // assign to the first employee
          reportId: new mongoose.Types.ObjectId(id) ,
          role: 'user', // assuming employee is the role for site users
          reportType: reportDetails.reportType // keep the same report type
        })

      }
    
      const updatedReport : Ireport | null = await report.findByIdAndUpdate(
        id,
        { status: status },
        { new: true }
      ).select('-isDeleted -createdAt -updatedAt -__v');

      if (!updatedReport) {
        throw new ApiError(
          StatusCodes.NOT_FOUND,
          `Report with id ${id} not found`
        );
      }

      let actionPerformed = `Report ${id} status changed to ${status} by ${req.user.userId} and assigned to employee ${siteUsers[0].personId} for site ${reportDetails.siteId}`;

      let valueForAuditLog: IauditLog = {
        userId: req.user.userId,
        role: req.user.role,
        actionPerformed: `${actionPerformed}`,
        status: TStatus.success,
      };

      eventEmitterForAuditLog.emit('eventEmitForAuditLog', valueForAuditLog);

      sendResponse(res, {
        code: StatusCodes.OK,
        data: updatedReport,
        message: `Report status changed successfully`,
      });
    }
  );

  // add more methods here if needed or override the existing ones 
}
