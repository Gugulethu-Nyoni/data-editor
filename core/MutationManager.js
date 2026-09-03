export default class MutationManager {

  constructor({

    api,

    onUpdated = () => {},

    onDeleted = () => {},

    onCreated = () => {},

    onError = () => {}

  } = {}) {

    if (!api) {

      throw new TypeError(
        'MutationManager requires an API adapter.'
      );

    }

    this.api = api;

    this.onUpdated = onUpdated;

    this.onDeleted = onDeleted;

    this.onCreated = onCreated;

    this.onError = onError;

  }


  async create(payload) {

    try {

      const result =
        await this.api.create(
          payload
        );

      this.onCreated({

        model:
          payload.model,

        recordId:
          result.id,

        data:
          payload.data,

        response:
          result

      });

      return result;

    } catch (error) {

      this.onError(
        error,
        payload
      );

      throw error;

    }

  }


  async update(payload) {

    try {

      const result =
        await this.api.update(
          payload
        );

      this.onUpdated({

        model:
          payload.model,

        recordId:
          payload.recordId,

        field:
          payload.field,

        value:
          payload.value,

        response:
          result

      });

      return result;

    } catch (error) {

      this.onError(
        error,
        payload
      );

      throw error;

    }

  }


  async delete(payload) {

    try {

      const result =
        await this.api.delete(
          payload
        );

      this.onDeleted({

        model:
          payload.model,

        recordId:
          payload.recordId,

        response:
          result

      });

      return result;

    } catch (error) {

      this.onError(
        error,
        payload
      );

      throw error;

    }

  }

}