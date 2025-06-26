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

  async getAllWithPagination(
      filters: any, // Partial<INotification> // FixMe : fix type
      options: PaginateOptions,
      populateOptions?: any, // Add populate options parameter
      //dontWantToInclude ? : string | string[],
    ) {
      
  
       const result = await this.model.paginate(filters, options, populateOptions);
      //const result = await this.model.paginateV2(filters, options, populateOptions);
  
      /*****************


      const result = await this.model.paginate(
         filters, // ISSUE :  may be issue thakte pare .. Test korte hobe .. 
        { ...filters, isDeleted : false },
        options);

      *********************/
      return result;
    }
}
