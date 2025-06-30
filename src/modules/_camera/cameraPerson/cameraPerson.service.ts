import { GenericService } from '../../__Generic/generic.services';
import { cameraSite } from '../../_site/cameraSite/cameraSite.model';
import { userSite } from '../../_site/userSite/userSite.model';
import { User } from '../../user/user.model';
import { ICameraPerson } from './cameraPerson.interface';
import { CameraPerson } from './cameraPerson.model';

export class CameraPersonService extends GenericService<
  typeof CameraPerson,
  ICameraPerson
> {
  constructor() {
    super(CameraPerson);
  }

  assignMultiplePersonForViewAccess = async (
    cameraId: string,
    siteId: string,
    personIds: string[]
  ) => {
    //-------- as we use zod to validate ... 
    // Validate input
    // if (!cameraId || !Array.isArray(personIds) || personIds.length === 0) {
    //   throw new Error('Invalid input');
    // }

    personIds.forEach(async(personId) => {
      if (typeof personId !== 'string') {
        throw new Error('Invalid personId in personIds array');
      }

      let user = await User.findById(personId);

      await CameraPerson.insertOne({
        cameraId,
        personId,
        siteId,
        status: 'enable', // default status
        role: user?.role , // default role if not specified
      })
    })

    return null;
  }


  /************
   * 
   *  Get all users who have access to a specific camera (Good Version)
   * 
   * *********** */

  getUsersWithAccessToCameraV = async (cameraId : string) => {
  // Step 1: Find all sites associated with the given camera
  const cameraSites = await cameraSite.find({ cameraId, isDeleted: false }).select('siteId');

  const siteIds = cameraSites.map(site => site.siteId);

  // Step 2: Find all users associated with those sites
  const userSites = await userSite
    .find({ siteId: { $in: siteIds }, isDeleted: false })
    .select('personId');

  const siteUserIds = userSites.map(userSite => userSite.personId);

  // Step 3: Find all users who have direct access to the camera
  const cameraPersons = await CameraPerson
    .find({ cameraId, isDeleted: false })
    .select('personId');

  const cameraUserIds = cameraPersons.map(person => person.personId);

  // Step 4: Combine both sets of user IDs and remove duplicates
  const allUserIds = [...new Set([...siteUserIds, ...cameraUserIds])];

  // Step 5: Fetch detailed user information (optional)
  const users = await User.find({ _id: { $in: allUserIds }, isDeleted: false });

  return users;
}


  /************
   * 
   *  Get all users who have access to a specific camera (Best Version)
   * 
   * *********** */

  getUsersWithAccessToCameraV1 = async (cameraId) =>  {
  // Step 1: Find all sites associated with the given camera
  const cameraSites = await cameraSite.find({ cameraId, isDeleted: false }).select('siteId');

  const siteIds = cameraSites.map(site => site.siteId);

  // Step 2: Find all users associated with those sites
  const userSites = await userSite
    .find({ siteId: { $in: siteIds }, isDeleted: false })
    .select('personId');

  const siteUserIds = userSites.map(userSite => userSite.personId);

  // Step 3: Find all users who have direct access to the camera
  const cameraPersons = await CameraPerson
    .find({ cameraId, isDeleted: false })
    .select('personId');

  const cameraUserIds = cameraPersons.map(person => person.personId);

  // Step 4: Combine both sets of user IDs and remove duplicates
  const allUserIds = [...new Set([...siteUserIds, ...cameraUserIds])];

  // Step 5: Fetch detailed user information
  const users = await User.find({ _id: { $in: allUserIds }, isDeleted: false }).select('_id name');

  // Step 6: Create a mapping of user IDs to names
  const userIdToNameMap = {};
  users.forEach(user => {
    userIdToNameMap[user._id.toString()] = user.name;
  });

  // Step 7: Determine status for each user
  const result = users.map(user => ({
    personId: user._id,
    name: user.name,
    status: allUserIds.includes(user._id) ? 'enable' : 'disable',
  }));

  return result;
}




}

