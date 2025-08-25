import { Model, Types } from 'mongoose';
import { PaginateOptions, PaginateResult } from '../../../types/paginate';
import { Role } from '../../user/user.constant';

export interface IuserSite {
  // _taskId: undefined | Types.ObjectId;
  _id?: Types.ObjectId; // undefined |  Types.ObjectId |
  personId: Types.ObjectId;
  siteId: Types.ObjectId;
  role: Role;
  workHours?: Number;

  isDeleted? : Boolean;  
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IuserSiteModel extends Model<IuserSite> {
  paginate: (
    query: Record<string, any>,
    options: PaginateOptions
  ) => Promise<PaginateResult<IuserSite>>;
}