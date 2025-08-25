import { StatusCodes } from 'http-status-codes';
import { Site } from './site.model';
import { ISite } from './site.interface';
import { GenericService } from '../../__Generic/generic.services';
import { userSite } from '../userSite/userSite.model';
import { PaginateOptions } from '../../../types/paginate';
import ApiError from '../../../errors/ApiError';
import { cameraSite } from '../cameraSite/cameraSite.model';

export class siteService extends GenericService<
  typeof Site,
  ISite
> {
  constructor() {
    super(Site);
  }

  // TODO :  INFO : Must Need to learn this technique to enrich paginated results with related data

  async getAllSitesWithUsersAndManagers(filters: any, options: PaginateOptions) {
  // Step 1: Use your existing paginate method
  const paginatedResult = await Site.paginate(filters, options);

  
  // Step 2: Extract site IDs from current page's results
  const siteIds = paginatedResult.results.map(site => site._id);
  

  // Step 3: Find all associated UserSite entries
  const userSites = await userSite.find({
    siteId: { $in: siteIds },
    isDeleted: false,
  }).populate('personId', 'name');
  
  // Step 4: Map userSites by siteId
  const siteUserMap = userSites.reduce((acc, us) => {
    
    const key = us.siteId.toString();
    if (!acc[key]) acc[key] = { users: [], managers: [] };

    if (us.role === 'user') {
      acc[key].users.push(us.personId?.name || 'Unknown');
    } else if (us.role === 'manager') {
      acc[key].managers.push(us.personId?.name || 'Unknown');
    }

    return acc;
  }, {});

  // Step 5: Format results to include userName and managerName
  const formattedResults = paginatedResult.results.map(site => {
    const userNames = siteUserMap[site._id.toString()]?.users || [];
    const managerNames = siteUserMap[site._id.toString()]?.managers || [];

    return {
      siteId : site._id,
      siteName: site.name,
      address: site.address,
      phoneNumber: site.phoneNumber,
      status: site.status,
      userName: userNames[0] || 'No User Assigned',
      managerName: managerNames[0] || 'No Manager Assigned'
    };
  });

  // Step 6: Return same pagination structure but with enriched data
  return {
    ...paginatedResult,
    results: formattedResults
  };
  }

  async getAllLocationOfSite(){
    const sites = await Site.find({
      lat: { $exists: true, $ne: null },
      long: { $exists: true, $ne: null }
    }).select('long lat'); // { isDeleted: false }

    if (!sites || sites.length === 0) {
      throw new Error('No sites found');
    }
    
    return sites; 
  }


  async softDeleteById(id: string) {

    const object = await this.model.findById(id).select('-__v');

    if (!object) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'No Object Found');
      //   return null;
    }

    if (object.isDeleted === true) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Item already deleted');
    }


    /********
     * 
     * UserSite
     * 
     * CameraSite gulao remove korte hobe .. 🧪 logic gula test korte hobe .. 
     * 
     * ******* */

    // Soft delete logic
    await cameraSite.updateMany(
      { siteId: id },
      { isDeleted: true }
    );

    await userSite.updateMany(
      { siteId: id },
      { isDeleted: true }
    );

    return await this.model.findByIdAndUpdate(
      id,
      { isDeleted: true },
      { new: true }
    );
  }
}
