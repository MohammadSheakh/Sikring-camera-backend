import { StatusCodes } from 'http-status-codes';
import { userSite } from './userSite.model';
import { IuserSite } from './userSite.interface';
import { GenericService } from '../../__Generic/generic.services';


export class UserSiteService extends GenericService<
  typeof userSite,
  IuserSite
> {
  constructor() {
    super(userSite);
  }
}
