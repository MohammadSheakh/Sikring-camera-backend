import { Model, Types } from 'mongoose';

import { ICustomersPermission } from './cameraCustomer.constant';
import { Role } from '../../user/user.constant';
import { PaginateOptions, PaginateResult } from '../../../types/paginate';

export interface IcameraCustomer {
  // _taskId: undefined | Types.ObjectId;
  _id?: Types.ObjectId; // undefined |  Types.ObjectId |
  cameraId: Types.ObjectId;
  personId: Types.ObjectId;
  siteId: Types.ObjectId;
  status : ICustomersPermission.disable  | ICustomersPermission.enable
  role : Role
  isDeleted : Boolean;  
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IcameraCustomerModel extends Model<IcameraCustomer> {
  paginate: (
    query: Record<string, any>,
    options: PaginateOptions
  ) => Promise<PaginateResult<IcameraCustomer>>;
}