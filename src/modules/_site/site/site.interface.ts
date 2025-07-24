import { Model, Types } from 'mongoose';
import { PaginateOptions, PaginateResult } from '../../../types/paginate';
import { TSiteType } from './site.constant';
import { TStatusType } from '../../user/user.constant';


export interface ISite {
  // _taskId: undefined | Types.ObjectId;
  _id?: Types.ObjectId; // undefined |  Types.ObjectId |
  // userId: Types.ObjectId;
  name : String;
  address? : String;
  type: TSiteType.liveEvent | 
  TSiteType.construction | 
  TSiteType.residential | 
  TSiteType.commercial | 
  TSiteType.industrial | 
  TSiteType.other;
  
  lat? : String;
  long? : String;
  phoneNumber : String;
  customerName? : String;
  status: TStatusType.active | TStatusType.inactive;
  attachments: Types.ObjectId[];

  assignedUserId? : String; // 🟢 just for show this userId
  assignedManagerId? : String; // 🟢 just for show this managerId
  
  isDeleted? : Boolean;  
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IsiteModel extends Model<ISite> {
  paginate: (
    query: Record<string, any>,
    options: PaginateOptions
  ) => Promise<PaginateResult<ISite>>;
}