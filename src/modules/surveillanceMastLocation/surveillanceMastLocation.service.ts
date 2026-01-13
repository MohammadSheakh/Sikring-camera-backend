//@ts-ignore
import { StatusCodes } from 'http-status-codes';
import { SurveillanceMastLocation } from './surveillanceMastLocation.model';
import { ISurveillanceMastLocation } from './surveillanceMastLocation.interface';
import { GenericService } from '../__Generic/generic.services';

export class SurveillanceMastLocationService extends GenericService<
  typeof SurveillanceMastLocation,
  ISurveillanceMastLocation
> {
  constructor() {
    super(SurveillanceMastLocation);
  }
}
