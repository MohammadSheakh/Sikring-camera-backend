import { StatusCodes } from 'http-status-codes';
import { cameraSite } from './cameraSite.model';
import { IcameraSite } from './cameraSite.interface';
import { GenericService } from '../../__Generic/generic.services';


export class CameraSiteService extends GenericService<
  typeof cameraSite,
  IcameraSite
> {
  constructor() {
    super(cameraSite);
  }
}
