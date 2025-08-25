import { Model, Types } from 'mongoose';
import { PaginateOptions, PaginateResult } from '../../../types/paginate';
import { TStatus } from './camera.constant';

export interface Icamera {
  // _taskId: undefined | Types.ObjectId;
  _id?: Types.ObjectId; // undefined |  Types.ObjectId |
  // userId: Types.ObjectId;
  cameraName : String;
  // siteName : String; 
  localLocation : String; 
  globalLocation? : String; 
  lat?: String; 
  long?: String; 
  status? : TStatus.offline | TStatus.working;  
  attachments?: Types.ObjectId[]; 
  assignedManagerId? : Types.ObjectId;
  assignedUserId? : Types.ObjectId;
  description?: String;
  cameraIp: String;
  cameraPort: String;
  cameraUsername: String;
  cameraPassword: String;
  cameraPath: String;

  rtspUrl?: String;
  
  isDeleted? : Boolean;  
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IcameraModel extends Model<Icamera> {
  paginate: (
    query: Record<string, any>,
    options: PaginateOptions
  ) => Promise<PaginateResult<Icamera>>;
}