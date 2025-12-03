import { StatusCodes } from 'http-status-codes';
import { CompanyLogo } from './companyLogo.model';
import { ICompanyLogo } from './companyLogo.interface';
import { GenericService } from '../__Generic/generic.services';


export class CompanyLogoService extends GenericService<
  typeof CompanyLogo,
  ICompanyLogo
> {
  constructor() {
    super(CompanyLogo);
  }
}
