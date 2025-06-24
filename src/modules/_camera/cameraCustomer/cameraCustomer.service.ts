import { StatusCodes } from 'http-status-codes';
import { cameraCustomer } from './cameraCustomer.model';
import { IcameraCustomer } from './cameraCustomer.interface';
import { GenericService } from '../../__Generic/generic.services';


export class cameraCustomerService extends GenericService<
  typeof cameraCustomer,
  IcameraCustomer
> {
  constructor() {
    super(cameraCustomer);
  }
}
