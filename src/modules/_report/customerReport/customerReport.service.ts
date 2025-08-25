import { StatusCodes } from 'http-status-codes';
import { customerReport } from './customerReport.model';
import { IcustomerReport } from './customerReport.interface';
import { GenericService } from '../../__Generic/generic.services';
import { PaginateOptions } from '../../../types/paginate';

/*****************
// Updated type definitions
interface PopulateOption {
  path: string;
  select?: string;
  model?: string;
  populate?: PopulateOption | PopulateOption[];
}

type PopulateOptions = string[] | PopulateOption[];

**************** */

export class CustomerReportService extends GenericService<
  typeof customerReport,
  IcustomerReport
> {
  constructor() {
    super(customerReport);
  }
}
