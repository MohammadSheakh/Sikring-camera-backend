import { StatusCodes } from 'http-status-codes';
import { GenericService } from '../__Generic/generic.services';
import { Review } from './review.model';
import { IReview } from './review.interface';


export class ReviewService extends GenericService<
  typeof Review,
  IReview
> {
  constructor() {
    super(Review);
  }
}
