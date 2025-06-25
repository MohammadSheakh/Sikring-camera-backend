import { StatusCodes } from 'http-status-codes';
import { report } from './report.model';
import { Ireport } from './report.interface';
import { GenericService } from '../../__Generic/generic.services';


export class ReportService extends GenericService<
  typeof report,
  Ireport
> {
  constructor() {
    super(report);
  }
}
