import { Model, Types } from 'mongoose';
import { PaginateOptions, PaginateResult } from '../../../types/paginate';
import { TStatusType } from '../../user/user.constant';

export interface Isite {
  // _taskId: undefined | Types.ObjectId;
  _id?: Types.ObjectId; // undefined |  Types.ObjectId |
  userId: Types.ObjectId;
  name : String;
  address : String;
  phoneNumber : String;
  customerName? : String;
  status: TStatusType.active | TStatusType.inactive;
  attachments: Types.ObjectId[];
  
  isDeleted : Boolean;  
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IsiteModel extends Model<Isite> {
  paginate: (
    query: Record<string, any>,
    options: PaginateOptions
  ) => Promise<PaginateResult<Isite>>;
}