'use strict';

var Utils = require('../../utils');
var Component = require('../../component');
var Paragrarph = require('../../paragraph');
var Loader = require('../../loader');
var I18n = require('../../i18n');


/**
 * @typedef {{
 *   url: string,
 *   title: string,
 *   description: string,
 *   image: string,
 *   caption: ?string,
 * }} */
var EmbeddedLinkParamsDef;

/**
 * Figure placeholder when source has not persisted correctly.
 */
// eslint-disable-next-line max-len
var THUMB_PLACEHOLDER = 'data:image/svg+xml,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20viewBox%3D%220%200%2020%2020%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Ctitle%3E20x20%2FPhoto%20Copy%3C%2Ftitle%3E%3Cg%20stroke%3D%22%2336434D%22%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cpath%20d%3D%22M1.5%2016.5v-13c0-1.1.9-2%202-2h13c1.1%200%202%20.9%202%202v13c0%201.1-.9%202-2%202h-13c-1.1%200-2-.9-2-2z%22%2F%3E%3Cpath%20d%3D%22M18.196%2016.224l-4.539-4.552-2.5%202.5-3.5-3.5-5.94%205.939M15.25%206.5a1.5%201.5%200%201%201-3.001-.001%201.5%201.5%200%200%201%203.001.001z%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fg%3E%3C%2Fsvg%3E';

/**
 * EmbeddedLink main.
 * @param {EmbeddedLinkParamsDef=} opt_params Optional params to initialize the object.
 * Default:
 *   {
 *     caption: null,
 *     url: string,
 *     title: string,
 *     description: string,
 *     image: string,
 *     name: Utils.getUID()
 *   }
 * @extends {../../component}
 * @constructor
 */
var EmbeddedLink = function(opt_params) {
  // Override default params with passed ones if any.
  var params = /** @type {EmbeddedLinkParamsDef} */ (Utils.extend({
    url: null,
    title: null,
    description: null,
    image: null,
    caption: null,
  }, opt_params));

  Component.call(this, params);

  /**
   * URL to embed.
   * @type {string}
   */
  this.url = params.url;

  /**
   * Title of link to embed.
   * @type {string}
   */
  this.title = params.title;

  /**
   * Description of link to embed.
   * @type {string}
   */
  this.description = params.description;

  /**
   * Image of link to embed.
   * @type {string}
   */
  this.image = params.image;

  /**
   * Placeholder text to show if the EmbeddedLink is empty.
   * @type {string}
   */
  this.caption = params.caption || '';

  /**
   * Placeholder text to show if the Figure is empty.
   * @type {../../paragraph}
   */
  this.captionParagraph = new Paragrarph({
    placeholderText: I18n.get('placeholder.embed') || '',
    text: this.caption,
    paragraphType: Paragrarph.Types.Caption,
    parentComponent: this,
    inline: true,
  });

  /**
   * DOM element tied to this object.
   * @type {!Element}
   */
  this.dom = document.createElement(EmbeddedLink.TAG_NAME);
  this.dom.setAttribute('contenteditable', false);
  this.dom.setAttribute('name', this.name);
  // TODO(mkhatib): Allow this once embeddable stuff works and
  // we have a better responsive solutions on mobile.
  this.dom.setAttribute('draggable', true);
  this.dom.className = EmbeddedLink.COMPONENT_CLASS_NAME;

  /**
   * DOM element tied title DOM.
   * @type {!Element}
   */
  this.titleDom = document.createElement('h3');

  /**
   * DOM element tied to description DOM.
   * @type {!Element}
   */
  this.descriptionDom = document.createElement('p');

  /**
   * DOM element tied image DOM.
   * @type {!Element}
   */
  this.thumbContainerDom = document.createElement('div');

  /**
   * DOM element tied image DOM.
   * @type {!Element}
   */
  this.imgDom = document.createElement('img');
  this.imgDom.src = THUMB_PLACEHOLDER;

  this.imgDom.addEventListener('error', function() {
    this.imgDom.src = THUMB_PLACEHOLDER;
  }.bind(this));

};
EmbeddedLink.prototype = Object.create(Component.prototype);
module.exports = EmbeddedLink;

/**
 * String name for the component class.
 * @type {string}
 */
EmbeddedLink.CLASS_NAME = 'EmbeddedLink';
Loader.register(EmbeddedLink.CLASS_NAME, EmbeddedLink);


/**
 * EmbeddedLink component element tag name.
 * @type {string}
 */
EmbeddedLink.TAG_NAME = 'figure';


/**
 * EmbeddedLink element tag name.
 * @type {string}
 */
EmbeddedLink.COMPONENT_CLASS_NAME = 'embedded-link';


/**
 * EmbeddedLink component inner container element tag name.
 * @type {string}
 */
EmbeddedLink.CONTAINER_TAG_NAME = 'div';


/**
 * EmbeddedLink component inner container element class name.
 * @type {string}
 */
EmbeddedLink.CONTAINER_CLASS_NAME = 'inner-container';


/**
 * Video element tag name.
 * @type {string}
 */
EmbeddedLink.OVERLAY_TAG_NAME = 'div';


/**
 * Video element tag name.
 * @type {string}
 */
EmbeddedLink.EMBED_TAG_NAME = 'div';


/**
 * Caption element tag name.
 * @type {string}
 */
EmbeddedLink.CAPTION_TAG_NAME = 'figcaption';


/**
 * Video element tag name.
 * @type {string}
 */
EmbeddedLink.OVERLAY_CLASS_NAME = 'embed-overlay';


/**
 * Returns the class name of the component.
 * @return {string} Class name of the component.
 */
EmbeddedLink.prototype.getComponentClassName = function() {
  return EmbeddedLink.CLASS_NAME;
};


/**
 * Create and initiate an embedded link component from JSON.
 * @param  {EmbeddedLinkParamsDef} json JSON representation of the embedded component.
 * @return {EmbeddedLink} EmbeddedLink object representing JSON data.
 */
EmbeddedLink.fromJSON = function(json) {
  return new EmbeddedLink(json);
};


/**
 * Handles onInstall when the EmbeddedLink module installed in an editor.
 */
EmbeddedLink.onInstall = function() {
};

/**
 * @override
 */
EmbeddedLink.prototype.render = function(element, options) {
  if (!this.isRendered) {
    Component.prototype.render.call(this, element, options);

    this.containerDom = document.createElement(
        EmbeddedLink.CONTAINER_TAG_NAME);
    this.containerDom.className = EmbeddedLink.CONTAINER_CLASS_NAME;

    const link = document.createElement('a');
    link.href = this.url;
    link.target = '_blank';

    this.containerDom.appendChild(link);

    this.thumbContainerDom.className = 'thumb-container';

    this.imgDom.src = this.image;
    this.thumbContainerDom.appendChild(this.imgDom);
    link.appendChild(this.thumbContainerDom);

    const detailsCont = document.createElement('div');
    detailsCont.className = 'details-container';
    link.appendChild(detailsCont);

    this.titleDom.innerText = this.title;
    this.descriptionDom.innerText = this.description;
    detailsCont.appendChild(this.titleDom);
    detailsCont.appendChild(this.descriptionDom);

    var urlDom = document.createElement('span');
    urlDom.className = 'url-meta';
    urlDom.innerText = (link.host || '').replace('www.', '');
    detailsCont.appendChild(urlDom);

    this.dom.appendChild(this.containerDom);

    this.captionParagraph.render(this.dom, {editMode: this.editMode});


    if (this.editMode) {
      this.overlayDom = document.createElement(
          EmbeddedLink.OVERLAY_TAG_NAME);
      this.overlayDom.className = EmbeddedLink.OVERLAY_CLASS_NAME;
      this.containerDom.appendChild(this.overlayDom);
      this.overlayDom.addEventListener('click', this.handleClick.bind(this));

      this.selectionDom = document.createElement('div');
      this.selectionDom.innerHTML = '&nbsp;';
      this.selectionDom.className = 'selection-pointer';
      this.selectionDom.setAttribute('contenteditable', true);
      this.selectionDom.addEventListener(
          'focus', this.handleClick.bind(this));
      this.containerDom.appendChild(this.selectionDom);

      this.captionParagraph.dom.setAttribute('contenteditable', true);
    }
  }
};


/**
 * Creates and return a JSON representation of the model.
 * @return {Object} JSON representation of this EmbeddedLink.
 */
EmbeddedLink.prototype.getJSONModel = function() {
  var embed = {
    component: this.getComponentClassName(),
    name: this.name,
    url: this.url,
    title: this.title,
    description: this.description,
    image: this.image,
    caption: this.captionParagraph.text,
  };

  return embed;
};


/**
 * Handles clicking on the embedded component to update the selection.
 */
EmbeddedLink.prototype.handleClick = function() {
  this.select();

  // TODO(mkhatib): Unselect the component when the embed plays to allow the
  // user to select it again and delete it.
  return false;
};


/**
 * Returns the operations to execute a deletion of the embedded component.
 * @param  {number=} opt_indexOffset An offset to add to the index of the
 * component for insertion point.
 * @param {../../defs.SerializedSelectionPointDef=} opt_cursorAfterOp Where to move cursor to after deletion.
 * @return {Array<../../defs.OperationDef>} List of operations needed to be executed.
 */
EmbeddedLink.prototype.getDeleteOps = function(
    opt_indexOffset, opt_cursorAfterOp) {
  var ops = [{
    do: {
      op: 'deleteComponent',
      component: this.name,
      cursor: opt_cursorAfterOp,
    },
    undo: {
      op: 'insertComponent',
      componentClass: this.getComponentClassName(),
      section: this.section.name,
      component: this.name,
      index: this.getIndexInSection() + (opt_indexOffset || 0),
      attrs: {
        url: this.url,
        title: this.title,
        description: this.description,
        image: this.image,
        caption: this.caption,
      },
    },
  }];

  // If this is the only child of the layout delete the layout as well.
  if (this.section.getLength() < 2) {
    Utils.arrays.extend(ops, this.section.getDeleteOps());
  }

  return ops;
};


/**
 * Returns the operations to execute inserting a embedded component.
 * @param {number} index Index to insert the embedded component at.
 * @param {../../defs.SerializedSelectionPointDef=} opt_cursorBeforeOp Cursor before the operation executes,
 * this helps undo operations to return the cursor.
 * @return {Array<../../defs.OperationDef>} Operations for inserting the embedded component.
 */
EmbeddedLink.prototype.getInsertOps = function(index, opt_cursorBeforeOp) {
  return [{
    do: {
      op: 'insertComponent',
      componentClass: this.getComponentClassName(),
      section: this.section.name,
      cursorOffset: 0,
      component: this.name,
      index: index,
      attrs: {
        url: this.url,
        title: this.title,
        description: this.description,
        image: this.image,
        caption: this.caption,
      },
    },
    undo: {
      op: 'deleteComponent',
      component: this.name,
      cursor: opt_cursorBeforeOp,
    },
  }];
};


/**
 * Returns the length of the embedded component content.
 * @return {number} Length of the embedded component content.
 */
EmbeddedLink.prototype.getLength = function() {
  return 1;
};

/**
 * @override
 */
EmbeddedLink.prototype.canBeLaidOut = function() {
  return true;
};



/**
 * Updates figure attributes.
 * @param {Object} attrs Attributes to update.
 */
EmbeddedLink.prototype.updateAttributes = function(attrs) {
  if (attrs.image) {
    this.updateImage(attrs.image);
  }

  if (attrs.title) {
    this.updateTitle(attrs.title);
  }

  if (attrs.description) {
    this.updateDescription(attrs.description);
  }
};


/**
 * Updates the source attribute for the figure and its dom.
 * @param {string} image Image source.
 */
EmbeddedLink.prototype.updateImage = function(image) {
  this.image = image;
  this.imgDom.setAttribute('src', image);
};


/**
 * Update the title of the link
 * @param {string} title
 */
EmbeddedLink.prototype.updateTitle = function(title) {
  this.title = title;
  this.titleDom.innerText = title;
  this.imgDom.setAttribute('title', title);
};


/**
 * Update the description of the link
 * @param {string} description
 */
EmbeddedLink.prototype.updateDescription = function(description) {
  this.description = description;
  this.descriptionDom.innerText = description;
};
