import { Model, Types } from 'mongoose';
import { PaginateOptions, PaginateResult } from '../../../types/paginate';

export interface IcameraSite {
  // _taskId: undefined | Types.ObjectId;
  _id?: Types.ObjectId; // undefined |  Types.ObjectId |
  cameraId: Types.ObjectId;
  siteId: Types.ObjectId;
  
  isDeleted? : Boolean;  
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IcameraSiteModel extends Model<IcameraSite> {
  paginate: (
    query: Record<string, any>,
    options: PaginateOptions
  ) => Promise<PaginateResult<IcameraSite>>;
}