export default class SmQLAdapter {
  constructor({
    client,
    resources = {}
  } = {}) {
    if (!client) {
      throw new TypeError('smQLAdapter requires an smQL client.');
    }

    this.client = client;
    this.resources = resources;
  }

  resolveResource(model) {
    // If the resource is explicitly registered, use it
    if (this.resources[model]) {
      return this.resources[model];
    }

    // Otherwise, derive the endpoint from the model name
    const endpoint = this._deriveEndpoint(model);
    return { endpoint };
  }

  _deriveEndpoint(model) {
    // Convert model name to pluralized endpoint with resource prefix
    // Examples:
    //   Resident → /resident/residents
    //   ResidentRepresentative → /resident/residentrepresentatives
    const lower = model.toLowerCase();
    const plural = this._pluralize(lower);
    return `/${lower}/${plural}`;
  }

  _pluralize(word) {
    // Basic pluralization for model names
    if (word.endsWith('y') && !word.endsWith('ay') && !word.endsWith('ey') && !word.endsWith('oy') && !word.endsWith('uy')) {
      return word.slice(0, -1) + 'ies';
    }
    if (word.endsWith('s') || word.endsWith('x') || word.endsWith('z') || word.endsWith('ch') || word.endsWith('sh')) {
      return word + 'es';
    }
    return word + 's';
  }

  async create({
    model,
    data
  }) {
    const resource = this.resolveResource(model);

    const response =
      await this.client.post(
        resource.endpoint,
        data
      );

    if (
      response &&
      response._ok === false
    ) {
      const error =
        new Error(
          response.error ||
          `smQL create failed with status ${response._status}.`
        );

      error.status =
        response._status;

      error.response =
        response;

      throw error;
    }

    return response;
  }

  async update({
    model,
    recordId,
    field,
    value,
    changes
  }) {
    const resource = this.resolveResource(model);
    const payload = changes || { [field]: value };

    const response =
      await this.client.put(
        `${resource.endpoint}/${recordId}`,
        payload
      );

    if (
      response &&
      response._ok === false
    ) {
      const error =
        new Error(
          response.error ||
          `smQL update failed with status ${response._status}.`
        );

      error.status =
        response._status;

      error.response =
        response;

      throw error;
    }

    return response;
  }

  async delete({
    model,
    recordId
  }) {
    const resource = this.resolveResource(model);

    const response =
      await this.client.delete(
        `${resource.endpoint}/${recordId}`
      );

    if (
      response &&
      response._ok === false
    ) {
      const error =
        new Error(
          response.error ||
          `smQL delete failed with status ${response._status}.`
        );

      error.status =
        response._status;

      error.response =
        response;

      throw error;
    }

    return response;
  }
}