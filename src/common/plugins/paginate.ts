import { FilterQuery, Schema } from 'mongoose';
import { PaginateOptions, PaginateResult } from '../../types/paginate';

// Plugin function for pagination
const paginate = <T>(schema: Schema<T>) => {
  schema.statics.paginate = async function (
    filter: FilterQuery<T>,
    options: PaginateOptions,
    dontWantToInclude?: string | string[]
  ): Promise<PaginateResult<T>> {
    const limit = options.limit ?? 5; // ?? 10 //  Number.MAX_SAFE_INTEGER
    const page = options.page ?? 1;
    const skip = (page - 1) * limit;
    const sort = options.sortBy ?? 'createdAt';
    const countPromise = this.countDocuments(filter).exec();
    let query = this.find(filter).select(dontWantToInclude).sort(sort).skip(skip).limit(limit);
    // TODO : This gives us exact Match .. we have to add partial match ..

    if (options.populate) {
      query = query.populate(options.populate);
    }

    const [totalResults, results] = await Promise.all([
      countPromise,
      query.exec(),
    ]);

    return {
      results,
      page,
      limit,
      totalPages: Math.ceil(totalResults / limit),
      totalResults,
    };
  };
};

export const paginateV1 = <T>(schema: Schema<T>) => {
  schema.statics.paginate = async function (
    filter: FilterQuery<T>,
    options: PaginateOptions,
    populateOptions?: any,
    dontWantToInclude?: string | string[]

  ): Promise<PaginateResult<T>> {
    const limit = options.limit ?? 5; // ?? 10 //  Number.MAX_SAFE_INTEGER
    const page = options.page ?? 1;
    const skip = (page - 1) * limit;
    const sort = options.sortBy ?? 'createdAt';
    const countPromise = this.countDocuments(filter).exec();
    let query = this.find(filter).select(dontWantToInclude).sort(sort).skip(skip).limit(limit);
    // TODO : This gives us exact Match .. we have to add partial match ..


    if (populateOptions && populateOptions.length > 0) {
        
        // Check if it's the old format (array of strings)
        if (typeof populateOptions[0] === 'string') {
            // Old format: ['attachments', 'siteId']
            populateOptions.forEach(field => {
                query = query.populate(field as string);
            });
        } else {
            // New format: [{path: 'attachments', select: 'filename'}, ...]
            populateOptions.forEach(option => {
                query = query.populate(option);
            });
        }
    }

    // if (options.populate) {
    //   query = query.populate(options.populate);
    // }
    
    const [totalResults, results] = await Promise.all([
      countPromise,
      query.exec(),
    ]);

    return {
      results,
      page,
      limit,
      totalPages: Math.ceil(totalResults / limit),
      totalResults,
    };
  };
};


// Updated type definitions
interface PopulateOption {
  path: string;
  select?: string;
  model?: string;
  populate?: PopulateOption | PopulateOption[];
}

type PopulateOptions = string[] | PopulateOption[];

interface PaginateOptions {
  limit?: number;
  page?: number;
  sortBy?: string;
  populate?: string | PopulateOption | PopulateOption[]; // Keep existing populate for backward compatibility
}


// Updated paginate static method
export const paginateV2 = <T>(schema: Schema<T>) => {
  schema.statics.paginate = async function (
    filter: FilterQuery<T>,
    options: PaginateOptions,
    populateOptions?: PopulateOptions // Updated parameter type
  ): Promise<PaginateResult<T>> {

    console.log('Pagination Hit 🔴🔴🔴');

    const limit = options.limit ?? 5;
    const page = options.page ?? 1;
    const skip = (page - 1) * limit;
    const sort = options.sortBy ?? 'createdAt';
    
    const countPromise = this.countDocuments(filter).exec();
    let query = this.find(filter).sort(sort).skip(skip).limit(limit);

    // Handle dontWantToInclude (select fields to exclude)
    if (options.select) {
      query = query.select(options.select);
    } else {
      query = query.select('-__v'); // Default exclude __v
    }

    // Handle populate options with flexible format support
    if (populateOptions && populateOptions.length > 0) {
      // Check if it's the old format (array of strings)
      if (typeof populateOptions[0] === 'string') {
        // Old format: ['attachments', 'siteId']
        populateOptions.forEach(field => {
          query = query.populate(field as string);
        });
      } else {
        // New format: [{path: 'attachments', select: 'filename'}, ...]
        populateOptions.forEach(option => {
          query = query.populate(option as PopulateOption);
        });
      }
    }

    // Keep backward compatibility with options.populate
    if (options.populate) {
      query = query.populate(options.populate);
    }

    const [totalResults, results] = await Promise.all([
      countPromise,
      query.exec(),
    ]);

    return {
      results,
      page,
      limit,
      totalPages: Math.ceil(totalResults / limit),
      totalResults,
    };
  };
};

// DEBUGGING VERSION: Add more logging to see what's happening
export const paginateDebug = <T>(schema: Schema<T>) => {
  schema.statics.paginate = async function (
    filter: FilterQuery<T>,
    options: PaginateOptions,
    populateOptions?: any
  ): Promise<PaginateResult<T>> {
    console.log('🔴 Pagination Debug Info:');
    console.log('Filter:', JSON.stringify(filter, null, 2));
    console.log('Options:', JSON.stringify(options, null, 2));
    console.log('PopulateOptions:', JSON.stringify(populateOptions, null, 2));
    console.log('PopulateOptions type:', typeof populateOptions);
    console.log('Is Array:', Array.isArray(populateOptions));
    
    const limit = options.limit ?? 5;
    const page = options.page ?? 1;
    const skip = (page - 1) * limit;
    const sort = options.sortBy ?? 'createdAt';
   
    const countPromise = this.countDocuments(filter).exec();
    let query = this.find(filter).sort(sort).skip(skip).limit(limit);
    
    if (options.select) {
      query = query.select(options.select);
    } else {
      query = query.select('-__v');
    }
    
    if (populateOptions && Array.isArray(populateOptions)) {
      console.log('🟢 Processing populate options...');
      populateOptions.forEach((option, index) => {
        console.log(`Option ${index}:`, option, 'Type:', typeof option);
        if (typeof option === 'string') {
          console.log('🔵 Populating string:', option);
          query = query.populate(option);
        } else if (typeof option === 'object' && option.path) {
          console.log('🔵 Populating object:', option);
          query = query.populate(option);
        }
      });
    }
    
    const [totalResults, results] = await Promise.all([
      countPromise,
      query.exec(),
    ]);
    
    return {
      results,
      page,
      limit,
      totalPages: Math.ceil(totalResults / limit),
      totalResults,
    };
  };
};

export default paginate ;

