/** @typedef {{
 *    name: string,
 *    components: Array<ComponentJsonDef>
 *  }}
 */
export var ArticleJsonDef;


/** @typedef {{
 *    name: string,
 *    component: string,
 *    formats: ?Array,
 *  }}
 */
export var ComponentJsonDef;


/** @typedef {{
 *    name: string,
 *    component: string,
 *    tagName: string,
 *    type: string,
 *    components: Array<!ComponentJsonDef>,
 *  }}
 */
export var LayoutJsonDef;


/**
 * @typedef {{
 *    component: string,
 *    name: string,
 *    text: string,
 *    placeholderText: string,
 *    paragraphType: string,
 *    formats: (Array<./defs.InlineFormattingDef>|undefined),
 * }}
 */
export var ParagraphJsonDef;

/**
 * @typedef {{
 *    name: string,
 *    tagName: string,
 *    components: Array<!ComponentJsonDef>,
 * }}
 */
export var ListJsonDef;


/** @typedef {{
 *    component: ./component,
 *    offset: number
 * }}
 */
export var SelectionPointDef;

/** @typedef {{
 *    component: string,
 *    offset: number
 * }}
 */
export var SerializedSelectionPointDef;


/** @typedef {{
 *    op: string,
 *    component: string,
 *    componentClass: (?string|undefined),
 *    value: (?string|undefined),
 *    index: (?number|undefined),
 *    section: (?string|undefined),
 *    cursorOffset: (number|undefined),
 *    selectRange: (number|undefined),
 *    cursor: (?SerializedSelectionPointDef|undefined),
 *    formats: (Array<Object>|undefined),
 *    attrs: (?Object|undefined),
 * }}
 */
export var ActionDef;


/** @typedef {{do: ActionDef, undo: ActionDef}} */
export var OperationDef;


/** @typedef {function(./paragraph, function(Array<OperationDef>))} */
export var ComponentFactoryMethodDef;


/**
 * @typedef {{
 *    from: number,
 *    to: number,
 *    type: (string|null),
 *    attrs: (?FormattingActionAttrsDef|undefined)
 * }}
 */
export var InlineFormattingDef;


/**
 * @typedef {{
 *    label: string,
 *    value: string,
 *    shortcuts: (?Array<string>|undefined),
 *    tagNames: (?Array<string>|undefined),
 *    attrs: (?FormattingActionAttrsDef|undefined),
 * }}
 */
export var FormattingActionDef;


/**
 * @typedef {{
 *    href: ({
 *      required: (?boolean|undefined),
 *      placeholder: (?string|undefined),
 *    }|undefined),
 * }}
 */
export var FormattingActionAttrsDef;
