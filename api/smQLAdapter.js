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
    const resource = this.resources[model];

    if (!resource) {
      throw new Error(`No smQL resource configured for model "${model}".`);
    }

    return resource;
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

    return this.client.put(
      `${resource.endpoint}/${recordId}`,
      payload
    );
  }

  async delete({
    model,
    recordId
  }) {
    const resource = this.resolveResource(model);

    return this.client.delete(
      `${resource.endpoint}/${recordId}`
    );
  }
}
