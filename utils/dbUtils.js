import mongoose from 'mongoose';
import HttpError from './httpError.js';

const MIN_PAGE_LIMIT = 1;
const MIN_ITEM_LIMIT = 1;
const MAX_PAGE_LIMIT = 100;

/**
 * Create a DB utility for a given Mongoose model
 * @param {mongoose.Model} Model
 */
function createDbUtils(Model) {
  return {
    // Find by ID
    async findById(id, populate = null, lean = false) {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new HttpError(`${Model.modelName} not found`, 404);
      }

      let queryBuilder = Model.findById(id);
      if (populate) {
        queryBuilder = queryBuilder.populate(populate);
      }

      if (lean) {
        queryBuilder = queryBuilder.lean();
      }

      const doc = await queryBuilder;

      if (!doc) {
        throw new HttpError(`${Model.modelName} not found`, 404);
      }

      return doc;
    },

    // Find one with a query
    async findOne(
      query = {},
      projection = {},
      options = {},
      populate = null,
      throwWhenNotFound = true,
      lean = false
    ) {
      if (query._id && !mongoose.Types.ObjectId.isValid(query._id)) {
        throw new HttpError(`${Model.modelName} not found`, 404);
      }

      let queryBuilder = Model.findOne(query, projection, options);
      if (populate) {
        queryBuilder = queryBuilder.populate(populate);
      }

      if (lean) {
        queryBuilder = queryBuilder.lean();
      }

      const doc = await queryBuilder;

      if (!doc && throwWhenNotFound) {
        throw new HttpError(`${Model.modelName} not found`, 404);
      }

      return doc;
    },

    // Find all with optional query
    async findAll(query = {}, projection = {}, options = {}, populate = null, lean = false) {
      let queryBuilder = Model.find(query, projection, options);

      if (populate) {
        queryBuilder = queryBuilder.populate(populate);
      }

      if (lean) {
        queryBuilder = queryBuilder.lean();
      }

      return await queryBuilder;
    },

    // Create a new document
    async create(data) {
      const doc = new Model(data);
      return await doc.save();
    },

    // Update by ID
    async updateById(id, update, options = { new: true }) {
      const doc = await Model.findByIdAndUpdate(id, update, options);

      if (!doc) {
        throw new HttpError(`${Model.modelName} not found`, 404);
      }

      return doc;
    },

    // Delete by ID
    async deleteById(id) {
      const doc = await Model.findByIdAndDelete(id);

      if (!doc) {
        throw new HttpError(`${Model.modelName} not found`, 404);
      }

      return doc;
    },

    // Delete one by field and value
    async deleteByField(field, value) {
      if (!field || typeof field !== 'string') {
        throw new HttpError('Invalid field name', 400);
      }

      const query = { [field]: value };

      const doc = await Model.findOneAndDelete(query);

      if (!doc) {
        throw new HttpError(`${Model.modelName} not found`, 404);
      }

      return {
        message: `${Model.modelName} deleted successfully`,
        deleted: doc,
      };
    },

    // Paginated fetch
    async paginate({
      query = {},
      page = 1,
      limit = 10,
      sort = { createdAt: -1 },
      projection = {},
      populate = null,
    }) {
      if (isNaN(limit)) {
        throw new HttpError('Limit must be a number', 400);
      }

      if (isNaN(page)) {
        throw new HttpError('Page number must be a number', 400);
      }

      if (page < MIN_PAGE_LIMIT) {
        throw new HttpError(`Page number must be greater than ${MIN_PAGE_LIMIT}`, 400);
      }

      if (limit < MIN_ITEM_LIMIT) {
        throw new HttpError(`Limit must be greater than ${MIN_ITEM_LIMIT}`, 400);
      }

      if (limit > MAX_PAGE_LIMIT) {
        throw new HttpError(`Limit must be less than ${MAX_PAGE_LIMIT}`, 400);
      }

      const parsedPageNo = parseInt(page);
      const skip = (parsedPageNo - 1) * limit;

      let queryBuilder = Model.find(query, projection).sort(sort).skip(skip).limit(limit);

      if (populate) {
        queryBuilder = queryBuilder.populate(populate);
      }

      const [results, total] = await Promise.all([queryBuilder, Model.countDocuments(query)]);

      return {
        results,
        total,
        totalPages: Math.ceil(total / limit),
        currentPage: parsedPageNo,
      };
    },

    // Delete multiple by IDs
    async deleteManyByIds(ids = []) {
      if (!Array.isArray(ids) || ids.length === 0) {
        throw new HttpError('Please provide a non-empty array of IDs', 400);
      }

      const invalidIds = ids.filter((id) => !mongoose.Types.ObjectId.isValid(id));
      if (invalidIds.length > 0) {
        throw new HttpError(`Invalid ID(s): ${invalidIds.join(', ')}`, 400);
      }

      const result = await Model.deleteMany({ _id: { $in: ids } });

      if (result.deletedCount === 0) {
        throw new HttpError(`${Model.modelName} not found for given IDs`, 404);
      }

      return {
        deletedCount: result.deletedCount,
        message: `${result.deletedCount} ${Model.modelName}(s) deleted.`,
      };
    },

    // Run custom aggregation pipeline
    async aggregate(pipeline = []) {
      return await Model.aggregate(pipeline);
    },

    async countDocuments(query = {}) {
      return await Model.countDocuments(query);
    },
  };
}

export default createDbUtils;
