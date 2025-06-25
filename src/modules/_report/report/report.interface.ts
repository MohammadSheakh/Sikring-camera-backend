import { Model, Types } from 'mongoose';
import { PaginateOptions, PaginateResult } from '../../../types/paginate';
import { TIncidentSevearity, TReportType, TStatus } from './report.constant';

export interface Ireport {
  // _taskId: undefined | Types.ObjectId;
  _id?: Types.ObjectId; // undefined |  Types.ObjectId |
  siteId: Types.ObjectId;
  reportType : TReportType.alarmPatrol  | TReportType.patrolReport | TReportType.service | TReportType.emergency_call_out;
  incidentSevearity : TIncidentSevearity.low | TIncidentSevearity.medium | TIncidentSevearity.high; 
  title : String;
  description : String;
  location? : String;
  person? : Object; // this is just for show in front end who is create the report .. 
  status : TStatus.accept | TStatus.deny;
  attachments: Types.ObjectId[];
  isDeleted? : Boolean;  
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IreportModel extends Model<Ireport> {
  paginate: (
    query: Record<string, any>,
    options: PaginateOptions
  ) => Promise<PaginateResult<Ireport>>;
}