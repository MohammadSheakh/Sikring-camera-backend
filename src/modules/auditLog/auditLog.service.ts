import { StatusCodes } from 'http-status-codes';
import { auditLog } from './auditLog.model';
import { IauditLog } from './auditLog.interface';
import { GenericService } from '../__Generic/generic.services';


export class auditLogService extends GenericService<
  typeof auditLog,
  IauditLog
> {
  constructor() {
    super(auditLog);
  }
}
