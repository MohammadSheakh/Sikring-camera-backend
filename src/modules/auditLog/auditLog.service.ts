import { StatusCodes } from 'http-status-codes';
import { auditLog } from './auditLog.model';
import { IauditLog } from './auditLog.interface';
import { GenericService } from '../__Generic/generic.services';
import EventEmitter from 'events';
import { TStatus } from './auditLog.constant';
const eventEmitterForAuditLog = new EventEmitter(); // functional way


eventEmitterForAuditLog.on('eventEmitForAuditLog', (valueFromRequest: IauditLog) => {
  try {
      auditLog.create({
        userId: valueFromRequest.userId,
        role: valueFromRequest.role,
        actionPerformed: valueFromRequest.actionPerformed,
        status: valueFromRequest.status,
      });
    }catch (error) {
      auditLog.create({
        userId: valueFromRequest.userId,
        role: valueFromRequest.role,
        actionPerformed: "Error occurred 🌋 while creating audit log :: "+valueFromRequest.actionPerformed,
        status: TStatus.failed,
      });
    }
  
});

export default eventEmitterForAuditLog;

export class auditLogService extends GenericService<
  typeof auditLog,
  IauditLog
> {
  constructor() {
    super(auditLog);
  }


  

}
