import { StatusCodes } from 'http-status-codes';
import { site } from './site.model';
import { Isite } from './site.interface';
import { GenericService } from '../../__Generic/generic.services';


export class siteService extends GenericService<
  typeof site,
  Isite
> {
  constructor() {
    super(site);
  }
}
