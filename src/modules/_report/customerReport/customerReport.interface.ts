import { Model, Types } from 'mongoose';
import { PaginateOptions, PaginateResult } from '../../../types/paginate';
import { Role } from '../../user/user.constant';
import { TReportType } from '../report/report.constant';

export interface IcustomerReport {
  // _taskId: undefined | Types.ObjectId;
  _id?: Types.ObjectId; // undefined |  Types.ObjectId |
  personId: Types.ObjectId;
  
  reportId: Types.ObjectId;
  role  :Role
  reportType : TReportType.alarmPatrol |
              TReportType.patrolReport |
              TReportType.service |
              TReportType.emergency_call_out;

  isDeleted? : Boolean;  
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IcustomerReportModel extends Model<IcustomerReport> {
  paginate: (
    query: Record<string, any>,
    options: PaginateOptions
  ) => Promise<PaginateResult<IcustomerReport>>;
}