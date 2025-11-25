import { StatusCodes } from 'http-status-codes';
import { PredefinedCustomDescription } from './predefinedCustomDescription.model';
import { IPredefinedCustomDescription } from './predefinedCustomDescription.interface';
import { GenericService } from '../../__Generic/generic.services';


export class PredefinedCustomDescriptionService extends GenericService<
  typeof PredefinedCustomDescription,
  IPredefinedCustomDescription
> {
  constructor() {
    super(PredefinedCustomDescription);
  }
}
