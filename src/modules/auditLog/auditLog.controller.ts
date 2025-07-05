import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import { GenericController } from '../__Generic/generic.controller';
import { auditLog } from './auditLog.model';
import { IauditLog } from './auditLog.interface';
import { auditLogService } from './auditLog.service';
import catchAsync from '../../shared/catchAsync';
import omit from '../../shared/omit';
import pick from '../../shared/pick';
import sendResponse from '../../shared/sendResponse';


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
