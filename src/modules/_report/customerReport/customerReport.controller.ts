import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import { GenericController } from '../../__Generic/generic.controller';
import { customerReport } from './customerReport.model';
import { IcustomerReport } from './customerReport.interface';
import { customerReportService } from './customerReport.service';


// let conversationParticipantsService = new ConversationParticipentsService();
// let messageService = new MessagerService();

export class customerReportController extends GenericController<
  typeof customerReport,
  IcustomerReport
> {
  customerReportService = new customerReportService();

  constructor() {
    super(new customerReportService(), 'customerReport');
  }

  // add more methods here if needed or override the existing ones 
  
}
