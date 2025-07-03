import { Model, Types } from 'mongoose';
import { PaginateOptions, PaginateResult } from '../../types/paginate';
import {AttachmentType, TAttachedToType } from './attachment.constant';

export interface IAttachment {
  _id?: Types.ObjectId;
  attachment: string;
  attachmentType: AttachmentType.image | AttachmentType.document 
   | AttachmentType.unknown;

  attachedToType: 
    TAttachedToType.site|
    TAttachedToType.user;

  attachedToId?: string;
  uploadedByUserId?: Types.ObjectId | string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IAttachmentModel extends Model<IAttachment> {
  paginate: (
    query: Record<string, any>,
    options: PaginateOptions
  ) => Promise<PaginateResult<IAttachment>>;
}