export default class MutationManager {
  constructor({
    api,
    onUpdated = () => {},
    onDeleted = () => {},
    onError = () => {}
  } = {}) {
    if (!api) {
      throw new TypeError('MutationManager requires an API adapter.');
    }

    this.api = api;
    this.onUpdated = onUpdated;
    this.onDeleted = onDeleted;
    this.onError = onError;
  }

  async update(payload) {
    try {
      const result = await this.api.update(payload);
      this.onUpdated(result, payload);
      return result;
    } catch (error) {
      this.onError(error, payload);
      throw error;
    }
  }

  async delete(payload) {
    try {
      const result = await this.api.delete(payload);
      this.onDeleted(result, payload);
      return result;
    } catch (error) {
      this.onError(error, payload);
      throw error;
    }
  }
}
