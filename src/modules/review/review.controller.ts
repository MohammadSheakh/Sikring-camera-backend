import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { GenericController } from '../__Generic/generic.controller';
import { IReview } from './review.interface';
import { Review } from './review.model';
import { ReviewService } from './review.service';
import catchAsync from '../../shared/catchAsync';
import sendResponse from '../../shared/sendResponse';

// let conversationParticipantsService = new ConversationParticipentsService();
// let messageService = new MessagerService();

export class ReviewController extends GenericController<
  typeof Review,
  IReview
> {
  ReviewService = new ReviewService();

  constructor() {
    super(new ReviewService(), 'Review');
  }

  create = catchAsync(async (req: Request, res: Response) => {
    const data = req.body;
    const result = await Review.create({
      userId: req.user.userId, 
      rating: req.body.rating,
      comment: req.body.comment,
    });

    if (!result) {
      return sendResponse(res, {
        code: StatusCodes.BAD_REQUEST,
        message: `Failed to create ${this.modelName}`,
        success: false,
      });
    }

    sendResponse(res, {
      code: StatusCodes.OK,
      data: result,
      message: `${this.modelName} created successfully`,
      success: true,
    });
  });

  // add more methods here if needed or override the existing ones 
  
}
