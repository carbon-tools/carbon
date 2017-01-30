'use strict';

var AbstractExtension = require('../core/abstract-extension');
var Selection = require('../selection');
var Toolbar = require('../toolbars/toolbar');
var Button = require('../toolbars/button');
var I18n = require('../i18n');
var Figure = require('../figure');
var Layout = require('../layout');
var Utils = require('../utils');
var Loader = require('../loader');
var EmbeddedComponent = require('./embedding/embeddedComponent');


/**
 * LayoutingExtension extension for the editor.
 *   Adds an extendable toolbar for components to add buttons to.
 * @param {../editor} editor Editor instance this installed on.
 * @param {Object=} opt_params Optional parameters.
 * @extends {../core/abstract-extension}
 * @constructor
 */
var LayoutingExtension = function(editor, opt_params) {

  /**
   * The editor this toolbelt belongs to.
   * @type {../editor}
   */
  this.editor = editor;

  /**
   * The layouting toolbar.
   * @type {../toolbars/toolbar}
   */
  this.toolbar = null;

  /** @private */
  this.bindedHandleSelection_ = this.handleSelectionChangedEvent.bind(this);

  Loader.register(LayoutingExtension.CLASS_NAME, this);
  this.init();
};
LayoutingExtension.prototype = Object.create(AbstractExtension.prototype);
module.exports = LayoutingExtension;


/**
 * Extension class name.
 * @type {string}
 */
LayoutingExtension.CLASS_NAME = 'LayoutingExtension';


/**
 * Initiates the toolbelt extension.
 */
LayoutingExtension.prototype.init = function() {
  // Create a new toolbar for the toolbelt.
  this.toolbar = new Toolbar({
    name: LayoutingExtension.TOOLBAR_NAME,
    classNames: [LayoutingExtension.TOOLBAR_CLASS_NAME],
    rtl: this.editor.rtl,
  });

  // TODO(mkhatib): Use Icons for buttons here.
  // Add layouting buttons to the toolbar.
  var buttons = [{
    label: I18n.get('button.layout.single'),
    icon: I18n.get('button.layout.icon.single'),
    name: 'layout-single-column',
  }, {
    label: I18n.get('button.layout.bleed'),
    icon: I18n.get('button.layout.icon.bleed'),
    name: 'layout-bleed',
  }, {
    label: I18n.get('button.layout.staged'),
    icon: I18n.get('button.layout.icon.staged'),
    name: 'layout-staged',
  }, {
    label: I18n.get('button.layout.left'),
    icon: I18n.get('button.layout.icon.left'),
    name: 'layout-float-left',
  }, {
    label: I18n.get('button.layout.right'),
    icon: I18n.get('button.layout.icon.right'),
    name: 'layout-float-right',
  }, {
    label: I18n.get('button.layout.grid'),
    icon: I18n.get('button.layout.icon.grid'),
    name: 'layout-responsive-grid',
  }];

  for (var i = 0; i < buttons.length; i++) {
    var button = new Button({
      label: buttons[i].label,
      name: buttons[i].name,
      icon: buttons[i].icon,
      data: {
        name: buttons[i].name,
      },
    });
    button.addEventListener(
        'click', this.handleLayoutButtonClick.bind(this), false);
    this.toolbar.addButton(button);
  }

  // Register the toolbelt toolbar with the editor.
  this.editor.registerToolbar(LayoutingExtension.TOOLBAR_NAME, this.toolbar);

  // Listen to selection changes.
  this.editor.article.selection.addEventListener(
      Selection.Events.SELECTION_CHANGED,
      this.bindedHandleSelection_, false);
};


/**
 * Cleanup layouting dom elements and event listeners.
 */
LayoutingExtension.prototype.onDestroy = function() {
  Loader.unregister(LayoutingExtension.CLASS_NAME);
  this.editor.unregisterToolbar(LayoutingExtension.TOOLBAR_NAME, this.toolbar);
  this.editor.article.selection.removeEventListener(
      Selection.Events.SELECTION_CHANGED,
      this.bindedHandleSelection_, false);
  this.toolbar.onDestroy();
};

/**
 * LayoutingExtension toolbar name.
 * @type {string}
 */
LayoutingExtension.TOOLBAR_NAME = 'layouting-toolbar';


/**
 * LayoutingExtension toolbar class name.
 * @type {string}
 */
LayoutingExtension.TOOLBAR_CLASS_NAME = 'layouting-toolbar';


/**
 * Handles clicking the insert button to expand the toolbelt.
 */
LayoutingExtension.prototype.handleLayoutButtonClick = function(e) {
  var target = e.detail.target;
  this.toolbar.setActiveButton(target);
  var clickedLayout = target.name;
  this.applyLayout(clickedLayout);
};


/**
 * Applies the passed layout name to the selected component.
 * @param {string} layoutName
 */
LayoutingExtension.prototype.applyLayout = function(layoutName) {
  var ops = [];
  var insertLayoutAtIndex;
  var selectedComponent = this.editor.selection.getComponentAtStart();
  var componentClassName = selectedComponent.getComponentClassName();
  var ComponentClass = Loader.load(componentClassName);
  var component;
  var newLayout;

  if (selectedComponent instanceof Figure ||
      selectedComponent instanceof EmbeddedComponent) {
    var currentLayout = /** @type {../layout} */ (selectedComponent.section);
    var componentIndexInLayout = selectedComponent.getIndexInSection();
    var isComponentAtStartOfLayout = componentIndexInLayout === 0;
    var isComponentAtEndOfLayout = (
        componentIndexInLayout === currentLayout.getLength() - 1);
    if (currentLayout.type !== layoutName) {
      // If figure is the only element in the layout, just change
      // the layout type.
      if (currentLayout.getLength() === 1) {
        Utils.arrays.extend(ops, currentLayout.getUpdateOps({
          type: layoutName,
        }));
      }

      // If figure is the first/last element in the layout, create a new
      // layout and append it to the section before/after the current layout
      // with the figure in it.
      else if (isComponentAtStartOfLayout || isComponentAtEndOfLayout) {
        insertLayoutAtIndex = currentLayout.getIndexInSection();
        if (isComponentAtEndOfLayout) {
          insertLayoutAtIndex++;
        }
        newLayout = new Layout({
          type: layoutName,
          section: currentLayout.section,
          components: [],
        });
        Utils.arrays.extend(ops, newLayout.getInsertOps(insertLayoutAtIndex));
        Utils.arrays.extend(ops, selectedComponent.getDeleteOps());

        component = ComponentClass.fromJSON(selectedComponent.getJSONModel());
        component.section = newLayout;
        Utils.arrays.extend(ops, component.getInsertOps(0));
      }

      // If figure is in the middle of a layout. Split layout in that index.
      // Create a new layout and insert it in the middle.
      else {
        insertLayoutAtIndex = currentLayout.getIndexInSection() + 1;
        newLayout = new Layout({
          type: layoutName,
          section: currentLayout.section,
          components: [],
        });

        Utils.arrays.extend(
            ops, currentLayout.getSplitOps(componentIndexInLayout));
        Utils.arrays.extend(ops, selectedComponent.getDeleteOps());
        Utils.arrays.extend(ops, newLayout.getInsertOps(insertLayoutAtIndex));

        component = ComponentClass.fromJSON(selectedComponent.getJSONModel());
        component.section = newLayout;
        Utils.arrays.extend(ops, component.getInsertOps(0));
      }

      this.editor.article.transaction(ops);
      this.editor.dispatchEvent(new Event('change'));
    }
  }

  this.handleSelectionChangedEvent();
};


/**
 * Creates a new layout just before the passed component. If the component is
 * at the start of a layout, the new layout is created right above that layout.
 * Otherwise, the current layout is split in two and a new layout is inserted
 * between them.
 * @param {string} layoutName the type of the layout to create.
 * @param {../component} component anchor component to insert layout at.
 * @return {../layout} The newly created layout.
 */
LayoutingExtension.prototype.newLayoutAt = function(layoutName, component) {
  var insertLayoutAtIndex;
  var newLayout;
  var ops = [];

  var currentLayout = /** @type {../layout} */ (component.section);
  var componentIndexInLayout = component.getIndexInSection();
  var isComponentAtStartOfLayout = componentIndexInLayout === 0;

  // If component is the first element in the layout, create a new
  // layout and prepend it to the section before the current layout.
  if (isComponentAtStartOfLayout) {
    insertLayoutAtIndex = currentLayout.getIndexInSection();
    newLayout = new Layout({
      type: layoutName,
      section: currentLayout.section,
      components: [],
    });
    Utils.arrays.extend(ops, newLayout.getInsertOps(insertLayoutAtIndex));
  }

  // If component is in the middle of a layout. Split layout in that index.
  // Create a new layout and insert it in the middle.
  else {
    insertLayoutAtIndex = currentLayout.getIndexInSection() + 1;
    newLayout = new Layout({
      type: layoutName,
      section: currentLayout.section,
      components: [],
    });

    Utils.arrays.extend(
        ops, currentLayout.getSplitOps(componentIndexInLayout));
    Utils.arrays.extend(ops, newLayout.getInsertOps(insertLayoutAtIndex));
  }

  this.editor.article.transaction(ops);
  return Utils.getReference(newLayout.name);
};


/**
 * Handles selection change event on the editor to hide the toolbelt.
 */
LayoutingExtension.prototype.handleSelectionChangedEvent = function() {
  var selectedComponent = this.editor.selection.getComponentAtStart();
  // Refocus the component.
  selectedComponent.focus();
  if ((selectedComponent instanceof Figure && !selectedComponent.isDataUrl) ||
      selectedComponent instanceof EmbeddedComponent) {
    var activeLayout = /** @type {../layout} */ (
        selectedComponent.section).type;
    var activeLayoutButton = this.toolbar.getButtonByName(activeLayout);
    if (activeLayoutButton) {
      this.toolbar.setActiveButton(activeLayoutButton);
    }

    this.toolbar.setPositionToTopOf(selectedComponent.dom);
    this.toolbar.setVisible(true);
  } else {
    this.toolbar.setVisible(false);
  }
};
