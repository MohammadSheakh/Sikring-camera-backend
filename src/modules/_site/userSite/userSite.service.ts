import { StatusCodes } from 'http-status-codes';
import { userSite } from './userSite.model';
import { IuserSite } from './userSite.interface';
import { GenericService } from '../../__Generic/generic.services';
import mongoose from 'mongoose';
import { User } from '../../user/user.model';

export class UserSiteService extends GenericService<
  typeof userSite,
  IuserSite
> {
  constructor() {
    super(userSite);
  }

  async getUnknownUserForSiteForAssign(siteId: string, 
    // options: PaginateOptions = {}
    filters : any,
    options :any
  ) {
    // Business logic: Build the aggregation pipeline
    const pipeline = [
        // Match all specialists
        {
          $match: {
            role: 'user',
            isDeleted: { $ne: true }
          }
        },
        // Left join with specialistpatient relationship
        {
          $lookup: {
            from: 'usersites',
            let: { userId: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$userId', '$$userId'] },
                      { $eq: ['$siteId', new mongoose.Types.ObjectId(siteId)] },
                      { $ne: ['$isDeleted', true] }
                    ]
                  }
                }
              }
            ],
            as: 'relationship'
          }
        },
        // Filter out doctors with existing relationship
        {
          $match: {
            'relationship.0': { $exists: false }
          }
        },
        /********************************* */

      /********************************* */
      // Project only needed fields
      {
        $project: {
          _id: 1,
          name: 1,
          profileImage : 1,
        }
      }
    ];


    const result = await User.aggregate(pipeline).exec();

    return result;

    /************
    // Use pagination service for aggregation
    return await PaginationService.aggregationPaginate(User, pipeline,
      //  {
      //   page: options.page,
      //   limit: options.limit
      // }
      options
    );
    ********* */
  }

  async getUnknownManagerForSiteForAssign(siteId: string, 
    // options: PaginateOptions = {}
    filters : any,
    options :any
  ) {
    // Business logic: Build the aggregation pipeline
    const pipeline = [
        // Match all specialists
        {
          $match: {
            role: 'manager',
            isDeleted: { $ne: true }
          }
        },
        // Left join with specialistpatient relationship
        {
          $lookup: {
            from: 'usersites',
            let: { userId: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$userId', '$$userId'] },
                      { $eq: ['$siteId', new mongoose.Types.ObjectId(siteId)] },
                      { $ne: ['$isDeleted', true] }
                    ]
                  }
                }
              }
            ],
            as: 'relationship'
          }
        },
        // Filter out doctors with existing relationship
        {
          $match: {
            'relationship.0': { $exists: false }
          }
        },
        /********************************* */

      /********************************* */
      // Project only needed fields
      {
        $project: {
          _id: 1,
          name: 1,
          profileImage : 1,
        }
      }
    ];


    const result = await User.aggregate(pipeline).exec();

    return result;

    /************
    // Use pagination service for aggregation
    return await PaginationService.aggregationPaginate(User, pipeline,
      //  {
      //   page: options.page,
      //   limit: options.limit
      // }
      options
    );
    ********* */
  }
}
