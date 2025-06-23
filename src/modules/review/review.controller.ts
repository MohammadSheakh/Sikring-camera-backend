import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { GenericController } from '../__Generic/generic.controller';
import { IReview } from './review.interface';
import { Review } from './review.model';
import { ReviewService } from './review.service';

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

  // add more methods here if needed or override the existing ones 
  
}
