import { Model, Types } from 'mongoose';
import { PaginateOptions, PaginateResult } from '../../../types/paginate';
import { Role } from '../../../middlewares/roles';
import { ViewPermission } from './cameraPerson.constant';

export interface ICameraPerson {
  // _taskId: undefined | Types.ObjectId;
  _id?: Types.ObjectId; // undefined |  Types.ObjectId |
  cameraId: Types.ObjectId;
  personId: Types.ObjectId;
  siteId: Types.ObjectId;
  status : ViewPermission.disable  | ViewPermission.enable
  role : Role
  isDeleted : Boolean;  
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ICameraPersonModel extends Model<ICameraPerson> {
  paginate: (
    query: Record<string, any>,
    options: PaginateOptions
  ) => Promise<PaginateResult<ICameraPerson>>;
}