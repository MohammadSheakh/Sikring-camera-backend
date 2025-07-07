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

   /*************
   * 
   *  Admin > Site Management > (Give View Access to Customer) assign multiple persons for view access to camera
   *  Manager > 
   * 
   * ************* */
  assignMultiplePersonForViewAccess = async (
    cameraId: string,
    siteId: string,
    personIdsToEnableAccess: string[],
    personIdsToDisableAccess: string[]
  ) => {

  try{

    personIdsToEnableAccess.forEach(async(personIdToEnableAccess) => {
      
      // let user = await User.findById(personIdToEnableAccess);

      // console.log("user ----", user);

      let alreadyEnables = await CameraPerson.findOne({
        cameraId,
        personId: personIdToEnableAccess,
        siteId,
        //status: 'enable', // Check if the person already has 'enable' status
      });

      const userRole = await User.findById(personIdToEnableAccess).select('role');

      if(!alreadyEnables){
        await CameraPerson.insertOne({
          cameraId,
          personId : personIdToEnableAccess,
          siteId,
          status: 'enable', // default status
          role: userRole?.role , // default role if not specified
        })
      }else{
        // lets update the status 
        await CameraPerson.findOneAndUpdate(
          { cameraId, personId: personIdToEnableAccess, siteId },
          { status: 'enable' }, // Update status to 'enable'
          { upsert: true } // Create a new document if it doesn't exist
        );
      }
    });
      if(personIdsToDisableAccess.length !== 0){

        personIdsToDisableAccess.forEach(async(personIdToEnableAccess) => {
          // if (typeof personIdToEnableAccess !== 'string') {
          //   throw new Error('Invalid personId in personIds array');
          // }

          // let user = await User.findById(personIdToEnableAccess);

          await CameraPerson.findOneAndUpdate(
            { cameraId, personId: personIdToEnableAccess, siteId },
            { status: 'disable' }, // Update status to 'disable'
            { upsert: true } // Create a new document if it doesn't exist
          );
        })
      }
    }
    catch(error){
      console.error('Error assigning multiple persons for view access to camera:', error);
      throw error; // Re-throw the error to be handled by the caller
    }

    return null;
  }

  /************
   * 
   * Dashboard: (Admin) : Get all users who have access to a specific camera (Best Version)
   * 
   * *********** */
  getUsersWithAccessToCamera = async (cameraId) =>  {
    
    const cameraPersons = await CameraPerson.find({
      cameraId,
    })

    /***
     * 
     * cameraPersons gives us all users who have access to the camera
     *  cameraId personId siteId status (disable enable)  role
     * 
     ***/

    // Map cameraPersons by personId and siteId for quick access
    const cameraPersonStatusMap = {};

    let siteIdForThisCamera;

    if(cameraPersons[0]?.siteId){
      siteIdForThisCamera = cameraPersons[0].siteId;
    }

    const userSites = await userSite.find({
      siteId: siteIdForThisCamera,
      isDeleted: false
    }).select('-workHours');

    // console.log('userSites', userSites);
    // console.log('cameraPersons', cameraPersons);

    // Combine userSites and cameraPersons
      const result = userSites.map((userSite) => {
        // Find the corresponding entry in cameraPersons
        const cameraPerson = cameraPersons.find(
          (cp) => cp.personId.toString() === userSite.personId.toString()
        );

        // Determine the status based on cameraPerson existence
        const status = cameraPerson ? cameraPerson.status : 'disable';

        // Return the combined user details and status
        return {
          _id: userSite._id,
          personId: userSite.personId,
          // siteId: userSite.siteId,
          role: userSite.role,
          status: status, // Access status: enable or disable
        };
      });

    // console.log('usersWithStatus', result);

    return result;
  }

  /************
   * 
   * Dashboard: ( Manager ) : Get customers who have access to a specific camera (Best Version)
   * 
   * *********** */
  getUsersWithAccessToCameraForManager = async (cameraId) =>  {
    
    const cameraPersons = await CameraPerson.find({
      cameraId,
    })

    /***
     * 
     * cameraPersons gives us all users who have access to the camera
     *  cameraId personId siteId status (disable enable)  role
     * 
     ***/

    // Map cameraPersons by personId and siteId for quick access
    const cameraPersonStatusMap = {};

    let siteIdForThisCamera;

    if(cameraPersons[0]?.siteId){
      siteIdForThisCamera = cameraPersons[0].siteId;
    }

    const userSites = await userSite.find({
      siteId: siteIdForThisCamera,
      isDeleted: false,
      role: { $in: ['customer', 'manager'] } // Only include customers and managers
    }).select('-workHours');

    // console.log('userSites', userSites);
    // console.log('cameraPersons', cameraPersons);

    // Combine userSites and cameraPersons
      const result = userSites.map((userSite) => {
        // Find the corresponding entry in cameraPersons
        const cameraPerson = cameraPersons.find(
          (cp) => cp.personId.toString() === userSite.personId.toString()
        );

        // Determine the status based on cameraPerson existence
        const status = cameraPerson ? cameraPerson.status : 'disable';

        // Return the combined user details and status
        return {
          _id: userSite._id,
          personId: userSite.personId,
          // siteId: userSite.siteId,
          role: userSite.role,
          status: status, // Access status: enable or disable
        };
      });

    // console.log('usersWithStatus', result);

    return result;
  }


  /*************
   * 
   *  App (Customer) : Live View of Camera that user is given access to:  
   * 
   * ************* */
  getAccessedCameraByPersonId = async (personId: string, siteId:string) => {
    // Find all cameras where the person has access
    const accessedCameras = await CameraPerson.find({
      personId,
      siteId,
      status: 'enable', // Only consider enabled access
    }).select('cameraId').populate({
      path: 'cameraId',
      select: 'rtspUrl cameraName',
    })
  
    // Return the list of cameras with access
    return accessedCameras;
  }
}

