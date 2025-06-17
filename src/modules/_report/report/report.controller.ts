import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import { GenericController } from '../../__Generic/generic.controller';
import { report } from './report.model';
import { Ireport } from './report.interface';
import { reportService } from './report.service';


// let conversationParticipantsService = new ConversationParticipentsService();
// let messageService = new MessagerService();

export class reportController extends GenericController<
  typeof report,
  Ireport
> {
  reportService = new reportService();

  constructor() {
    super(new reportService(), 'report');
  }

  // add more methods here if needed or override the existing ones 
  
}
