import { StatusCodes } from 'http-status-codes';
import { Site } from './site.model';
import { ISite } from './site.interface';
import { GenericService } from '../../__Generic/generic.services';
import { userSite } from '../userSite/userSite.model';
import { PaginateOptions } from '../../../types/paginate';

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

  // console.log("paginatedResult 🧪1🧪", paginatedResult)

  // Step 2: Extract site IDs from current page's results
  const siteIds = paginatedResult.results.map(site => site._id);
  // console.log("siteIds 🧪2🧪", siteIds)

  // Step 3: Find all associated UserSite entries
  const userSites = await userSite.find({
    siteId: { $in: siteIds },
    isDeleted: false,
  }).populate('personId', 'name');
  // console.log("userSites 🧪3🧪", userSites)

  // Step 4: Map userSites by siteId
  const siteUserMap = userSites.reduce((acc, us) => {
    console.log("us 🧪3.5 🧪3.5🧪", us)
    const key = us.siteId.toString();
    if (!acc[key]) acc[key] = { users: [], managers: [] };

    if (us.role === 'user') {
      acc[key].users.push(us.personId?.name || 'Unknown');
    } else if (us.role === 'manager') {
      acc[key].managers.push(us.personId?.name || 'Unknown');
    }

    return acc;
  }, {});

  console.log("siteUserMap 🧪3.5🧪", siteUserMap)

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

  // console.log("formattedResults 🧪4🧪", formattedResults)

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
}
