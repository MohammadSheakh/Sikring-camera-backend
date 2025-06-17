import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import { GenericController } from '../__Generic/generic.controller';
import { auditLog } from './auditLog.model';
import { IauditLog } from './auditLog.interface';
import { auditLogService } from './auditLog.service';


// let conversationParticipantsService = new ConversationParticipentsService();
// let messageService = new MessagerService();

export class auditLogController extends GenericController<
  typeof auditLog,
  IauditLog
> {
  auditLogService = new auditLogService();

  constructor() {
    super(new auditLogService(), 'auditLog');
  }

  // add more methods here if needed or override the existing ones 
  
}
