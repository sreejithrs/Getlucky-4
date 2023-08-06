const commonService = {
  /**
  * @Method create
  * @Description Method for render reset password page
  *
  */
  save: async (model, data) => {
    try {
      const save = await model.create(data);
      if (!save) {
        return null;
      }
      return save;
    } catch (err) {
      return err;
    }
  },
  /**
  * @Method updateById
  * @Description Method for render reset password page
  *
  */
  updateById: async (model, id, data) => {
    try {
      const update = await model.findByIdAndUpdate(id, data, { new: true });
      if (!update) {
        return null;
      }
      return update;
    } catch (err) {
      return err;
    }
  },
  /**
   * @Method updateOneByFields
   * @Description Method for render reset password page
   *
   */
  updateOneByFields: async (model, query, data) => {
    try {
      await model.updateOne(query, data);
      return true;
    } catch (err) {
      return err;
    }
  },
  /**
   * @Method insertIfExistsElseUpdate
   * @Description Method for render reset password page
   *
   */
  insertIfNotExists: async (model, query, data) => {
    try {
      await model.updateOne(query, data, { upsert: true });
      return true;
    } catch (err) {
      return err;
    }
  },
  /**
  * @Method findOneAndUpdateFields
  * @Description Method for render reset password page
  *
  */
  findOneAndUpdateFields: async (model, query, data) => {
    try {
      const update = await model.findOneAndUpdate(query, data, { new: true });
      if (!update) {
        return null;
      }
      return update;
    } catch (err) {
      return err;
    }
  },
  /**
  * @Method findAllByFields
  * @Description Method for render reset password page
  *
  */
  findAllByFields: async (model, query) => {
    try {
      const getAll = await model.find(query).exec();
      if (!getAll) {
        return null;
      }
      return getAll;
    } catch (err) {
      return err;
    }
  },
  /**
  * @Method findOneByFields
  * @Description Method for render reset password page
  *
  */
  findOneByFields: async (model, query) => {
    try {
      const find = await model.findOne(query).exec();
      if (!find) {
        return null;
      }
      return find;
    } catch (err) {
      return err;
    }
  },
  /**
  * @Method findOneById
  * @Description Method for render reset password page
  *
  */
  findOneById: async (model, id) => {
    try {
      const find = await model.findById(id).exec();
      if (!find) {
        return null;
      }
      return find;
    } catch (err) {
      return err;
    }
  },
  /**
  * @Method delete
  * @Description Method for render reset password page
  *
  */
  delete: async (model, id) => {
    try {
      const dataDelete = await model.remove({ _id: id }).exec();
      if (!dataDelete) {
        return null;
      }
      return dataDelete;
    } catch (err) {
      return err;
    }
  },
  /**
  * @Method count
  * @Description Method for render reset password page
  *
  */
  count: async (model, query) => {
    try {
      const count = await model.countDocuments(query);
      if (!count) {
        return null;
      }
      return count;
    } catch (err) {
      return err;
    }
  },
  /**
  * @Method delete one
  * @Description Method for deleting data by fields
  *
  */
  deleteOneByFields: async (model, query) => {
    try {
      const data = await model.deleteOne(query);
      if (!data) {
        return null;
      }
      return data;
    } catch (err) {
      return err;
    }
  },
  /**
  * @Method includePasswordById
  * @Description Method for including password in response
  *
  */
  includePasswordById: async (model, id) => {
    try {
      const data = await model.findById(id).select('+password');
      if (!data) {
        return null;
      }
      return data;
    } catch (err) {
      return err;
    }
  },
  /**
  * @Method includePasswordByEmail
  * @Description Method for including password in response
  *
  */
  includePasswordByEmail: async (model, key, type) => {
    try {
      const data = await model.findOne({ ...key, userType: type }).select('+password');
      if (!data) {
        return null;
      }
      return data;
    } catch (err) {
      return err;
    }
  },

};

module.exports = commonService;
