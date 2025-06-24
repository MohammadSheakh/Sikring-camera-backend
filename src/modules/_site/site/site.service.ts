import { StatusCodes } from 'http-status-codes';
import { Site } from './site.model';
import { ISite } from './site.interface';
import { GenericService } from '../../__Generic/generic.services';

export class siteService extends GenericService<
  typeof Site,
  ISite
> {
  constructor() {
    super(Site);
  }
}
