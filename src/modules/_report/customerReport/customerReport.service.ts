import { StatusCodes } from 'http-status-codes';
import { customerReport } from './customerReport.model';
import { IcustomerReport } from './customerReport.interface';
import { GenericService } from '../__Generic/generic.services';


export class customerReportService extends GenericService<
  typeof customerReport,
  IcustomerReport
> {
  constructor() {
    super(customerReport);
  }
}
