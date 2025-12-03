import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import { GenericController } from '../__Generic/generic.controller';
import { CompanyLogo } from './companyLogo.model';
import { ICompanyLogo } from './companyLogo.interface';
import { CompanyLogoService } from './companyLogo.service';
import catchAsync from '../../shared/catchAsync';
import { AttachmentService } from '../attachments/attachment.service';
import { TAttachedToType, TFolderName } from '../attachments/attachment.constant';
import sendResponse from '../../shared/sendResponse';
import ApiError from '../../errors/ApiError';


// let conversationParticipantsService = new ConversationParticipentsService();
let attachmentService = new AttachmentService();

export class CompanyLogoController extends GenericController<
  typeof CompanyLogo,
  ICompanyLogo
> {
  CompanyLogoService = new CompanyLogoService();

  constructor() {
    super(new CompanyLogoService(), 'CompanyLogo');
  }

  create = catchAsync(async (req: Request, res: Response) => {
    
    let attachments = [];

    if (req.files && req.files.attachments) {
      attachments.push(
          ...(await Promise.all(
          req.files.attachments.map(async file => {
              const attachmenId = await attachmentService.uploadSingleAttachment(
                  file, // file to upload 
                  TFolderName.site, // folderName
                  req.user.userId, // uploadedByUserId
                  TAttachedToType.site
              );
              return attachmenId;
          })
          ))
      );
    }

    req.body.attachments = attachments;

    const result = await this.service.create({
        companyName: req.body.companyName,
        attachments: req.body.attachments
    });

    sendResponse(res, {
      code: StatusCodes.OK,
      data: result,
      message: `${this.modelName} created successfully`,
      success: true,
    });
  });

  getAll = catchAsync(async (req: Request, res: Response) => {
    const result = await CompanyLogo.find(
      {
        companyName: { $exists: true, $ne: "" },
        attachments: { $exists: true, $ne: [] },
        isDeleted: false,
      }
    ).select("-createdAt -updatedAt -__v -isDeleted").populate({
      path: "attachments",
      select: "-createdAt -updatedAt -__v"
    });

    sendResponse(res, {
      code: StatusCodes.OK,
      data: result,
      message: `All ${this.modelName}s`,
      success: true,
    });
  });


  updateById = catchAsync(async (req: Request, res: Response) => {
    if (!req.params.id) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        `id is required for update ${this.modelName}`
      );
    }
    const id = req.params.id;

    let attachments = [];

    if (req.files && req.files.attachments) {
      attachments.push(
          ...(await Promise.all(
          req.files.attachments.map(async file => {
              const attachmenId = await attachmentService.uploadSingleAttachment(
                  file, // file to upload 
                  TFolderName.site, // folderName
                  req.user.userId, // uploadedByUserId
                  TAttachedToType.site
              );
              return attachmenId;
          })
          ))
      );
    }

    if(attachments.length > 0){
      req.body.attachments = attachments;
    }
    
    const updatedObject = await this.service.updateById(id, req.body);

    if (!updatedObject) {
      throw new ApiError(
        StatusCodes.NOT_FOUND,
        `Object with ID ${id} not found`
      );
    }
    
    //   return res.status(StatusCodes.OK).json(updatedObject);
    sendResponse(res, {
      code: StatusCodes.OK,
      data: updatedObject,
      message: `${this.modelName} updated successfully`,
    });
  });

  // add more methods here if needed or override the existing ones 
}
