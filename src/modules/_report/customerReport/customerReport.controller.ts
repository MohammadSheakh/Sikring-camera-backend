import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import { GenericController } from '../../__Generic/generic.controller';
import { customerReport } from './customerReport.model';
import { IcustomerReport } from './customerReport.interface';
import { CustomerReportService } from './customerReport.service';
import catchAsync from '../../../shared/catchAsync';
import omit from '../../../shared/omit';
import pick from '../../../shared/pick';
import sendResponse from '../../../shared/sendResponse';

// let conversationParticipantsService = new ConversationParticipentsService();

export class customerReportController extends GenericController<
  typeof customerReport,
  IcustomerReport
> {
  customerReportService = new CustomerReportService();

  constructor() {
    super(new CustomerReportService(), 'customerReport');
  }

  getAllWithPagination = catchAsync(async (req: Request, res: Response) => {
      //const filters = pick(req.query, ['_id', 'title']); // now this comes from middleware in router
      const filters =  omit(req.query, ['sortBy', 'limit', 'page', 'populate']); ;
      const options = pick(req.query, ['sortBy', 'limit', 'page', 'populate']);
      
      const populateOptions = [
        {
          path: 'reportId',
          select: 'title incidentSevearity reportType'
        },
      ];

      const dontWantToInclude = ['']; 

      const result = await this.service.getAllWithPagination(filters, options, populateOptions, dontWantToInclude);
  
      sendResponse(res, {
        code: StatusCodes.OK,
        data: result,
        message: `All ${this.modelName} with pagination`,
        success: true,
      });
  });


  /************
   * 
   * Customer (APP) | Home Page | getTodaysReports  
   * 
   * ********** */
  getAllWithPaginationForCustomer = catchAsync(async (req: Request, res: Response) => {
      const filters =  omit(req.query, ['sortBy', 'limit', 'page', 'populate']); ;
      const options = pick(req.query, ['sortBy', 'limit', 'page', 'populate']);
      
      const populateOptions = [
        {
          path: 'reportId',
          select: 'title incidentSevearity reportType'
        },
      ];

      const dontWantToInclude = "-__v -updatedAt -isDeleted -reportType"; 

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
