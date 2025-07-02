import { Model, Types } from 'mongoose';
import { PaginateOptions, PaginateResult } from '../../types/paginate';

export interface IReview {
  // _taskId: undefined | Types.ObjectId;
  _id?: Types.ObjectId; // undefined |  Types.ObjectId |
  userId: Types.ObjectId;
  rating : number;
  comment? : string; // Changed from message to comment to match the model
 
  isDeleted? : Boolean;  
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IReviewModel extends Model<IReview> {
  paginate: (
    query: Record<string, any>,
    options: PaginateOptions
  ) => Promise<PaginateResult<IReview>>;
}