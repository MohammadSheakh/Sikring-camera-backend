import { Model, Types } from 'mongoose';
import { PaginateOptions, PaginateResult } from '../../types/paginate';
import { Role } from '../user/user.constant';
import { TStatus } from './auditLog.constant';

export interface IauditLog {
  // _taskId: undefined | Types.ObjectId;
  _id?: Types.ObjectId; // undefined |  Types.ObjectId |
  userId: Types.ObjectId;
  role : Role;
  actionPerformed : String;
  status : TStatus.active | TStatus.failed | TStatus.pending | TStatus.success;

  isDeleted? : Boolean;  
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IauditLogModel extends Model<IauditLog> {
  paginate: (
    query: Record<string, any>,
    options: PaginateOptions
  ) => Promise<PaginateResult<IauditLog>>;
}