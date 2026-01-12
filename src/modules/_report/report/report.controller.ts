//@ts-ignore
import { Request, Response } from 'express';
//@ts-ignore
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
//@ts-ignore
import mongoose from 'mongoose';
import { IuserSite } from '../../_site/userSite/userSite.interface';
import { IcustomerReport } from '../customerReport/customerReport.interface';
import { TRole } from '../../../middlewares/roles';
import omit from '../../../shared/omit';
import pick from '../../../shared/pick';

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

  /*********
   * 
   * 🆕 New Flow Alert  🆕V2 found ... 
   * previously when customer create a report 
   * it goes to admin .. 
   * admin assign a employee to that report 
   * ----------------------------
   * now when a customer create a report 
   * it should go to the customer's site's employee directly
   * 
   * 
   * ********* */
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

  /*********
   * 
   * 🆕 New Flow Alert  🆕This is V2  ---- ⚠️ V3 Found  Henrik Again Wants to change report flow
   * previously when customer create a report 
   * it goes to admin .. 
   * admin assign a employee to that report 
   * ----------------------------
   * now when a customer create a report 
   * it should go to the customer's site's employee directly
   * 
   * ********* */
   createV2 = catchAsync(async (req: Request, res: Response) => {
   
    // INFO : req.body te assignedManager and assignedUser er nam nite hobe abu sayeed vai er kas theke .. 
    // INFO :  karon shei nam ta audit log e dekhano lagbe .. 

    let attachments = [];

    if (req.files && req.files.attachments) {
      attachments.push(
        ...(await Promise.all(
        //@ts-ignore
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

    const result = await this.service.createAndPopulateSpecificFields({
        title: req.body.title,
        creatorId : req.user.userId,  //////// Who create this report 
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

      /*******
       * 🆕 As we need to send this report directly to the customer's site's employee
       * ****** */
      // const employeeForThisSite = await userSite.findOne({
      //   siteId: req.body.siteId,
      //   role: TRole.user, // as user means employee 
      //   isDeleted: false
      // });

      // Create both relations in parallel

      const [customerForReport, employeeForThisSite] = await Promise.all([
        // create relation between report and customer [person who is creating this report]
        this.customerReportService.create({
          personId: req.user.userId,
          reportId: result._id,
          role: req.user.role,
          reportType: req.body.reportType
        }),
        // now create relation between report and employee [person who is assigned to this report]
        userSite.findOne({
          siteId: req.body.siteId,
          role: TRole.user, // as user means employee 
          isDeleted: false
        })
      ]);


      // now create relation between report and employee [person who is assigned to this report]
      const employeeForReport = await this.customerReportService.create({
        personId: employeeForThisSite.personId,
        reportId: result._id,
        role: employeeForThisSite.role,
        reportType: req.body.reportType
      });

      /*************
      // create relation between report and customer [person who is creating this report]
      const customerForReport = await this.customerReportService.create({
        personId: req.user.userId,
        reportId: result._id,
        role: req.user.role,
        reportType: req.body.reportType
      });

      // now create relation between report and employee [person who is assigned to this report]
      const employeeForReport = await this.customerReportService.create({
        personId: employeeForThisSite.personId,
        reportId: result._id,
        role: employeeForThisSite.role,
        reportType: req.body.reportType
      });
      *********** */

      console.log(" 🆕 Flow employeeForThisSite", employeeForReport);

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

  // 🆕 this is V3 .. which send report creators lat and long also .. 
  createV3 = catchAsync(async (req: Request, res: Response) => {
   
    // INFO : req.body te assignedManager and assignedUser er nam nite hobe abu sayeed vai er kas theke .. 
    // INFO :  karon shei nam ta audit log e dekhano lagbe .. 

    let attachments = [];

    if (req.files && req.files.attachments) {
      attachments.push(
        ...(await Promise.all(
        //@ts-ignore
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

    const result = await this.service.createAndPopulateSpecificFields({
        title: req.body.title,
        creatorId : req.user.userId,  //////// Who create this report 
        reportType: req.body.reportType,
        incidentSevearity: req.body.incidentSevearity,
        siteId: req.body.siteId,
        description: req.body.description,
        status: req.body.status, 
        attachments: req.body.attachments,
        long: req.body.long, // 🆕 New requirement
        lat : req.body.lat, // 🆕 New requirement
    }, populateOptions);
    
    let actionPerformed = '';

    if(result._id){

      // need to check if the manager exist or not  

      /*******
       * 🆕 As we need to send this report directly to the customer's site's employee
       * ****** */
      // const employeeForThisSite = await userSite.findOne({
      //   siteId: req.body.siteId,
      //   role: TRole.user, // as user means employee 
      //   isDeleted: false
      // });

      // Create both relations in parallel

      const [customerForReport, employeeForThisSite] = await Promise.all([
        // create relation between report and customer [person who is creating this report]
        this.customerReportService.create({
          personId: req.user.userId,
          reportId: result._id,
          role: req.user.role,
          reportType: req.body.reportType
        }),
        // now create relation between report and employee [person who is assigned to this report]
        userSite.findOne({
          siteId: req.body.siteId,
          role: TRole.user, // as user means employee 
          isDeleted: false
        })
      ]);


      // now create relation between report and employee [person who is assigned to this report]
      const employeeForReport = await this.customerReportService.create({
        personId: employeeForThisSite.personId,
        reportId: result._id,
        role: employeeForThisSite.role,
        reportType: req.body.reportType
      });

      /*************
      // create relation between report and customer [person who is creating this report]
      const customerForReport = await this.customerReportService.create({
        personId: req.user.userId,
        reportId: result._id,
        role: req.user.role,
        reportType: req.body.reportType
      });

      // now create relation between report and employee [person who is assigned to this report]
      const employeeForReport = await this.customerReportService.create({
        personId: employeeForThisSite.personId,
        reportId: result._id,
        role: employeeForThisSite.role,
        reportType: req.body.reportType
      });
      *********** */

      console.log(" 🆕 Flow employeeForThisSite", employeeForReport);

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

  /*********  ⚠️ V2 Found 
   * 
   * 🆕 User(Employee) | Create Report 
   * -----------------
   * must send customerId in req.body .. 
   * **** */
  createForEmployee = catchAsync(async (req: Request, res: Response) => {
   
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

    const result = await this.service.createAndPopulateSpecificFields({
        title: req.body.title,
        reportType: req.body.reportType,
        creatorId : req.user.userId,
        incidentSevearity: req.body.incidentSevearity,
        siteId: req.body.siteId,
        description: req.body.description,
        status: req.body.status, 
        attachments: req.body.attachments,
    }, populateOptions);
    
    let actionPerformed = '';

    if(result._id){
    
      const [customerForReport] = await Promise.all([
        // create relation between report and customer [person who is creating this report]
        this.customerReportService.create({
          personId: req.user.userId, // employeeId .. as he is creating this report
          reportId: result._id, // report Id
          role: req.user.role,
          reportType: req.body.reportType
        }),
      ]);

      // now create relation between report and employee [person who is assigned to this report]
      if(req.body.customerId){
        const employeeForThisSite =  this.customerReportService.create({
          personId: req.body.customerId, // as customer needs to see this report also
          reportId: result._id,
          role: TRole.customer, // as role is customer 
          reportType: req.body.reportType
        })
      }
    
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

  // 🆕 this is V2 .. which send report creators lat and long also .. 
  createForEmployeeV2 = catchAsync(async (req: Request, res: Response) => {
   
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

    const result = await this.service.createAndPopulateSpecificFields({
        title: req.body.title,
        reportType: req.body.reportType,
        creatorId : req.user.userId,
        incidentSevearity: req.body.incidentSevearity,
        siteId: req.body.siteId,
        description: req.body.description,
        status: req.body.status, 
        attachments: req.body.attachments,
        long: req.body.long, // 🆕 New requirement
        lat : req.body.lat, // 🆕 New requirement
    }, populateOptions);
    
    let actionPerformed = '';

    if(result._id){
    
      const [customerForReport] = await Promise.all([
        // create relation between report and customer [person who is creating this report]
        this.customerReportService.create({
          personId: req.user.userId, // employeeId .. as he is creating this report
          reportId: result._id, // report Id
          role: req.user.role,
          reportType: req.body.reportType
        }),
      ]);

      // now create relation between report and employee [person who is assigned to this report]
      if(req.body.customerId){
        const employeeForThisSite =  this.customerReportService.create({
          personId: req.body.customerId, // as customer needs to see this report also
          reportId: result._id,
          role: TRole.customer, // as role is customer 
          reportType: req.body.reportType
        })
      }
    
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

  /*********
   * 🆕 User(Employee) | Get All Customer For A Site
   * ----------------
   * **** */
  getAllCustomersForSite= catchAsync(async (req: Request, res: Response) => {
   
    if(req.user.role !== TRole.user){
      sendResponse(res, {
      code: StatusCodes.OK,
      data: {
        hasCustomers: false,
        customers: []
      },
      message: `No customer found as you are not an employee`,
      success: true,
    });
    }

    const siteId = req.params.siteId;

    const getAllCustomerForASite = await userSite.find({
      siteId: siteId,
      role: { $in: [TRole.customer, TRole.manager] }, //TRole.customer, // as we need to get all customers for a site 
      isDeleted: false
    })
    .select('personId role')
    .populate(
      {
        path: 'personId',
        select: 'name profileImage'
      }
    );
    
    sendResponse(res, {
      code: StatusCodes.OK,
      data: {
        hasCustomers: getAllCustomerForASite.length > 0,
        customers: getAllCustomerForASite
      },
      message: `all customers for site ${siteId}`,
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
      },
      {
        path: 'creatorId',
        select: 'name email profileImage role' // phoneNumber 
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

    /**********
     * 
     * As result.person returns multiple person who is related to this report
     * 
     * but we need to show only the person who is submitting this report
     * 
     * so, we will filter the person based on the reportId
     * 
     * ********** */

    // let find out who is submitting this report .. 
    const customerReportRes = await customerReport.find({
      reportId: id,
      personId: req.user.userId, // only the person who is submitting this report
    }).select('personId role').populate({
      path: 'personId',
      select: 'name email profileImage', // phoneNumber
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


  getAllWithPagination = catchAsync(async (req: Request, res: Response) => {
    //const filters = pick(req.query, ['_id', 'title']); // now this comes from middleware in router
    const filters =  omit(req.query, ['sortBy', 'limit', 'page', 'populate']); ;
    const options = pick(req.query, ['sortBy', 'limit', 'page', 'populate']);
    
    options.sortBy = '-createdAt';

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

    // const select = ''; // -role

    const result = await this.service.getAllWithPagination(filters, options, populateOptions/*, select*/);

    sendResponse(res, {
      code: StatusCodes.OK,
      data: result,
      message: `All ${this.modelName} with pagination`,
      success: true,
    });
  });

  // add more methods here if needed or override the existing ones 
}
