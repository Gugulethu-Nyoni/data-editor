import MetadataResolver from './MetadataResolver.js';
import MutationManager from './MutationManager.js';
import createDefaultRegistry from './createDefaultRegistry.js';

export default class DataEditor {
  constructor({
    root = document,
    metadata = {},
    api = null,
    registry = null,
    themeColor = null,
    onUpdated = () => {},
    onDeleted = () => {},
    onError = () => {}
  } = {}) {
    this.root = root;
    this.metadata = metadata;
    this.api = api;
    this.registry = registry || createDefaultRegistry();
    this.themeColor = themeColor;
    this.metadataResolver = new MetadataResolver({
  metadata,
  registry: this.registry
});

    this.mutations = api
      ? new MutationManager({
          api,
          onUpdated,
          onDeleted,
          onError
        })
      : null;

    this.boundElements = new Set();
  }

  mount() {
    this._applyTheme();
    this._bindEditableElements();
    return this;
  }

  _bindEditableElements() {
    const elements = this.root.querySelectorAll?.('.smq-data-editable') || [];

    elements.forEach((element) => {
      if (this.boundElements.has(element)) return;

      element.dataset.smqDataEditorBound = 'true';
      this.boundElements.add(element);
    });
  }

  resolveElement(element) {
    if (!element) return null;

    return this.metadataResolver.resolve(
      element.dataset.model,
      element.dataset.recordId,
      element.dataset.field
    );
  }

  _applyTheme() {
    if (!this.themeColor || !this.root) return;

    const target =
      this.root.documentElement ||
      this.root.querySelector?.(':root') ||
      document.documentElement;

    target.style.setProperty(
      '--smq-data-editor-accent',
      this.themeColor
    );

    target.style.setProperty(
      '--smq-data-editor-accent-hover',
      this._lightenColor(this.themeColor, -10)
    );

    target.style.setProperty(
      '--smq-data-editor-focus',
      this._toRgba(this.themeColor, 0.16)
    );
  }

  _lightenColor(hex, amount) {
    if (!/^#[0-9a-f]{6}$/i.test(hex)) {
      return hex;
    }

    const value = parseInt(hex.slice(1), 16);
    const clamp = (number) => Math.max(0, Math.min(255, number));

    const r = clamp((value >> 16) + amount);
    const g = clamp(((value >> 8) & 255) + amount);
    const b = clamp((value & 255) + amount);

    return `#${[r, g, b]
      .map((channel) => channel.toString(16).padStart(2, '0'))
      .join('')}`;
  }

  _toRgba(hex, alpha) {
    if (!/^#[0-9a-f]{6}$/i.test(hex)) {
      return `color-mix(in srgb, ${hex} ${alpha * 100}%, transparent)`;
    }

    const value = parseInt(hex.slice(1), 16);

    const r = value >> 16;
    const g = (value >> 8) & 255;
    const b = value & 255;

    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  destroy() {
    this.boundElements.forEach((element) => {
      delete element.dataset.smqDataEditorBound;
    });

    this.boundElements.clear();
  }
}
