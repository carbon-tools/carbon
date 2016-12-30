# Carbon

Carbon is an extendable rich text editor in the browser that is consistent and beautiful. Carbon is inspired by Medium Editor. It is built on top of an internal model for an article that clients can translate to and from JSON and HTML.

The browser is built with extendability in mind and supports operations and history to allow proper undo-redo management with support for embeddable objects and uploading attachments.

Carbon is an open source project by your friends at [Manshar](https://github.com/manshar/manshar) - an open source publishing platform for Arabic content. Carbon supports both LTR and RTL languages.

Carbon is still in early alpha and you might run into bugs. If you do, please file a bug request or send a pull request with the proper fix.
:mineral:
## Compatibility And Tests
**Carbon is still in alpha**. Carbon is not yet compatible with all major browsers and platforms. Currently it only supports Desktop Browsers like *Chrome*, *Firefox* and *Safari*. We’re still working on adding more compatibility, especially on mobile browsers, feel free to send us pull requests :smile:. We also don’t have a good unit tests coverage yet and we’ll continue working on adding those.

## Usage

You can load Carbon from our CDN (Recommended)
```html
<link href="https://cdn.carbon.tools/0.2.62/carbon.min.css"></script>
<script src="https://cdn.carbon.tools/0.2.62/carbon.min.js"></script>
```


To use the latest version use `latest` (Be careful this will most likey keep breaking until Carbon APIs are stable).
```html
<link href="https://cdn.carbon.tools/latest/carbon.min.css"></script>
<script src="https://cdn.carbon.tools/latest/carbon.min.js"></script>
```


Or you can grab carbon source code (including minified files) using bower:
```sh
bower install carbon-tools/carbon
```

And then include the main Carbon scripts and css:
```html
<link href="bower_components/carbon/dist/carbon.min.css"/>
<script src="bower_components/carbon/dist/carbon.min.js"></script>
```


After that you can create a new Carbon object and pass it the element you want to transfer into your editor.

```html
<div id="my-editor"></div>
<script>
  var editor = new carbon.Editor(document.getElementById('my-editor'));
  editor.render();
</script>
```

That’s it. You now have Carbon enabled. See [demo/index.html](https://github.com/manshar/carbon/blob/master/demo/index.html) source code and [demo/rtl-demo.html](https://github.com/manshar/carbon/blob/master/demo/rtl-demo.html) for more usage examples.

carbon.Editor accepts a second optional parameters you can use to configure the editor with. Here’s a table of the parameters you can pass with their explanation:

<table>
  <tr>
    <td>Parameter</td>
    <td>Explanation</td>
    <td>Values</td>
  </tr>
  <tr>
    <td>modules</td>
    <td>A list of custom components and extensions you’d like to enable in the editor.

The editor has built in extensions and components enabled for every editor, these include:
[Section, Paragraph, List, Figure, FormattingExtension, ToolbeltExtension, UploadExtension]</td>
    <td>A list of classes for each module you want to enable.

Default: []

Example: [YouTubeComponent, VimeoComponent]</td>
  </tr>
  <tr>
    <td>rtl</td>
    <td>Whether this editor is an RTL editor or not.</td>
    <td>Boolean

Default: false</td>
  </tr>
  <tr>
    <td>article</td>
    <td>A carbon.Article object to initiate the editor with.</td>
    <td>carbon.Article object.

Default: A carbon.Article instance with one Paragraph with placeholder ‘Editor’
</td>
  </tr>
</table>


The editor also exposes methods to allow the clients to interact with it.

<table>
  <tr>
    <td>Method</td>
    <td>Args</td>
    <td>Explanation</td>
  </tr>
  <tr>
    <td>registerRegex</td>
    <td>regexStr: A regex string to listen to.

callback: A callback function to call when the regex is matched.</td>
    <td>Registers a regex with the editor.</td>
  </tr>
  <tr>
    <td>getHTML</td>
    <td></td>
    <td>Returns HTML string represents the whole article</td>
  </tr>
  <tr>
    <td>getJSONModel</td>
    <td></td>
    <td>Returns JSON model for the article</td>
  </tr>
  <tr>
    <td>loadJSON
classmethod</td>
    <td>json: JSON model to create article model from</td>
    <td>Creates and sets a new article model from JSON format</td>
  </tr>
  <tr>
    <td>install
</td>
    <td>module: The module to install in the editor.</td>
    <td></td>
  </tr>
  <tr>
    <td>getModule</td>
    <td>name: Name of the module to return</td>
    <td>Returns the module with the given name</td>
  </tr>
  <tr>
    <td>registerToolbar</td>
    <td>name: Toolbar name
toolbar: The toolbar object to register</td>
    <td>Registers a toolbar with the editor</td>
  </tr>
  <tr>
    <td>getToolbar</td>
    <td>name: Name of the toolbar to return</td>
    <td>Returns toolbar with the given name</td>
  </tr>
  <tr>
    <td>addEventListener</td>
    <td>name: Event name
handler: Callback handler for the event</td>
    <td></td>
  </tr>
  <tr>
    <td>registerShortcut</td>
    <td>shortcutId: A String representing the shortcut (e.g. "cmd+alt+1")
handler: A function to call when the shortcut is triggered
optForce: Optional argument whether to override an already registered shortcut</td>
    <td>Registers a shortcut listener with the editor</td>
  </tr>
  <tr>
    <td>isEmpty</td>
    <td></td>
    <td>Returns true if the editor is empty</td>
  </tr>
  <tr>
    <td>getTitle</td>
    <td></td>
    <td>Returns the first header paragraph text in the editor</td>
  </tr>
  <tr>
    <td>getSnippet</td>
    <td></td>
    <td>Returns the first non-header paragraph text in the editor</td>
  </tr>
</table>


### Installing More Modules

The editor by default installs:

* Section, Paragraph, List and Figure Components

* Formatting, Toolbelt and Upload Extensions

Carbon also package one other components that are not installed by default, you can install them by providing them to the *modules* attribute of the editor params, or by calling `editor.install(module)` method.

```javascript
editor.install(carbon.YouTubeComponent);
```

## Article Model

The editor relies on carbon.Article to render and control the model. Article is made of Sections. A section is made of Components. A component can be a Paragraph, Figure, List or others that inherit from carbon.Component.

### Component

Component is an abstract construct that all components in the editor extend and inherits from. All components have these attributes and are setup by passing them as an object parameter to the constructor.

<table>
  <tr>
    <td>Parameter</td>
    <td>Explanation</td>
    <td>Values</td>
  </tr>
  <tr>
    <td>name</td>
    <td>A unique name of the component instance.</td>
    <td>String

Default: Randomly generated unique ID using Utils.getUID()</td>
  </tr>
  <tr>
    <td>editor</td>
    <td>A reference to the editor that contains this component instance.</td>
    <td>Editor instance</td>
  </tr>
  <tr>
    <td>section</td>
    <td>A reference to the section that contains this component instance</td>
    <td>Section instance</td>
  </tr>
  <tr>
    <td>inline</td>
    <td>Whether this component is a single line component</td>
    <td>If set to True in a paragraph, the editor will not allow the component to create more siblings.

Default: False</td>
  </tr>
  <tr>
    <td>parentComponent</td>
    <td>If the component is nested and initialized in another component this points to the parent component</td>
    <td></td>
  </tr>
</table>


Each component will also inherit Component methods. Components are responsible of overriding and implementing some of these methods.

<table>
  <tr>
    <td>Method</td>
    <td>Explanation</td>
    <td>Should Override?</td>
  </tr>
  <tr>
    <td>getNextComponent</td>
    <td>Returns the next component</td>
    <td>No</td>
  </tr>
  <tr>
    <td>getPreviousComponent</td>
    <td>Returns the previous component</td>
    <td>No</td>
  </tr>
  <tr>
    <td>getIndexInSection</td>
    <td>Returns the index of the component in its section</td>
    <td>No</td>
  </tr>
  <tr>
    <td>getJSONModel</td>
    <td>Returns a JSON representation of the component. This representation must have at least a ‘component’ and ‘name’ attributes with component being the CLASS_NAME of the component and the unique name of the component instance.</td>
    <td>Must Override</td>
  </tr>
  <tr>
    <td>getDeleteOps</td>
    <td>Returns the operations needed to delete this component</td>
    <td>Must Override</td>
  </tr>
  <tr>
    <td>getInsertOps</td>
    <td>Returns the operations needed to be executed to insert this component in the editor</td>
    <td>Must Override</td>
  </tr>
  <tr>
    <td>getLength</td>
    <td>Returns the length of the component content. For text components this is the text length and for other components this should be 1.</td>
    <td>Optional Override</td>
  </tr>
  <tr>
    <td>getInsertCharsOps</td>
    <td>Returns operations needed to insert characters in a component (only needed for text-based components)</td>
    <td>Optional Override</td>
  </tr>
  <tr>
    <td>getRemoveCharsOps</td>
    <td>Returns operations needed to remove characters in a component (only needed for text-based components)</td>
    <td>Optional Override</td>
  </tr>
  <tr>
    <td>getUpdateOps</td>
    <td>Returns operations needed to update component’s attributes.</td>
    <td>Optional Override</td>
  </tr>
</table>


Every component must also:

* Expose a `dom` property that is the container element of the component. The dom element must set a `name` attribute equals to the component.name property

* Define a class variable `CLASS_NAME` with a string name for its class, usually matching its constructor name.

* Register its constructor with the `carbon.Loader` module. This needs to happen at the load time

```javascript
carbon.Loader.register(Compnent.CLASS_NAME, Component);
```

* Implement an `onInstall(editor)` class method that is called when a component is installed in an editor.

* Implement a `fromJSON` class method that allows the component to be recreated from its JSON representation.

* Optionally worry about its selection and how users interact with it

### Article

Article consists of sections. Article is also responsible of transaction operations on the article and keeping history of the changes to allow undo and redo operations.

### Section

Section consists of components and is responsible of inserting and removing components in the section.

### Paragraph

A paragraph takes few arguments when initializing it programmatically. Paragraph is any text-element that allow users to input text.

<table>
  <tr>
    <td>Parameter</td>
    <td>Explanation</td>
    <td>Values</td>
  </tr>
  <tr>
    <td>text</td>
    <td>Text in this paragraph.</td>
    <td>String</td>
  </tr>
  <tr>
    <td>placeholderText</td>
    <td>A placeholder text to show in the paragraph when it’s empty.</td>
    <td></td>
  </tr>
  <tr>
    <td>paragraphType</td>
    <td>The type of paragraph.</td>
    <td>Paragraph.Types = {
  Paragraph: 'p',
  MainHeader: 'h1',
  SecondaryHeader: 'h2',
  ThirdHeader: 'h3',
  Quote: 'blockquote',
  Code: 'pre',
  Caption: 'figcaption',
  ListItem: 'li'
};

Default: Paragraph.Types.Paragraph</td>
  </tr>
  <tr>
    <td>formats</td>
    <td>A list of objects representing formatting of the paragraph.

This attribute is mostly managed by the FormattingExtension.

Example:
[{from: 3, to: 10, type: ‘em’}]</td>
    <td></td>
  </tr>
</table>


### Figure

Figure component registers a regex to match any image links pasted in a new paragraph and replaces the link with an image. Figure component also handles its own selection by adding a click listener on the image.

<table>
  <tr>
    <td>Parameter</td>
    <td>Explanation</td>
    <td>Values</td>
  </tr>
  <tr>
    <td>src</td>
    <td>The source attribute for the image inside the figure.</td>
    <td>Data URI, Remote absolute or relative URL</td>
  </tr>
  <tr>
    <td>caption</td>
    <td>The caption text for the figure.

Internally the caption is implemented by nesting a Paragraph component with inline:true and placeholder:params.captionPlaceholder</td>
    <td></td>
  </tr>
  <tr>
    <td>captionPlaceholder</td>
    <td>Placeholder for the caption.

</td>
    <td></td>
  </tr>
  <tr>
    <td>width</td>
    <td>Width of the figure in the editor.</td>
    <td>String

Default: ‘100%’</td>
  </tr>
</table>


### List

<table>
  <tr>
    <td>Parameter</td>
    <td>Explanation</td>
    <td>Values</td>
  </tr>
  <tr>
    <td>tagName</td>
    <td>The tag name to use for the container of the component.</td>
    <td>Values:
‘ol’ (List.ORDERED_LIST_TAG) or
‘ul’ (List.UNORDERED_LIST_TAG)

Default:
List.UNORDERED_LIST_TAG</td>
  </tr>
  <tr>
    <td>components</td>
    <td>List of paragraphs components of type ListItem representing list items.</td>
    <td>Default:
A list with a single empty Paragraph of type listItem.</td>
  </tr>
</table>


## Attachment

Attachment is a class to track the progress of an upload in progress and update the inserted component attributes after it is done.

UploadExtension creates attachments when the user upload images and insert a pending figures into the editor by reading the image as data URL. The client is notified through an event and should handle persisting the file remotely. After the client is done persisting the file, they need to update the attachment attributes - e.g. Update the source to a remote URL.

Attachment has the following attributes.

<table>
  <tr>
    <td>Parameter</td>
    <td>Explanation</td>
  </tr>
  <tr>
    <td>file</td>
    <td>The file the user choose in the file picker</td>
  </tr>
  <tr>
    <td>figure</td>
    <td>Figure object tied to this file upload to update its attributes</td>
  </tr>
  <tr>
    <td>insertedOps</td>
    <td>Operations used to insert the figure object. This allows attachment to update the history of insertedOps to match the new attributes to avoid any discrepancies.</td>
  </tr>
</table>


And the following method can be used to update the attributes of the attachment.

<table>
  <tr>
    <td>Method</td>
    <td>Args</td>
    <td>Explanation</td>
  </tr>
  <tr>
    <td>setAttributes</td>
    <td>attrs: An object with the attributes and their value to update to.</td>
    <td>Update attachment attributes</td>
  </tr>
</table>


## Editor Shortcuts

The editor supports formatting shortcuts:

* Ctrl/Cmd+B to **bold**

* Ctrl/Cmd+i to *Italic*

* Ctrl/Cmd+u to Underscore

* Ctrl/Cmd+s to Strikethrough

* Ctrl/Cmd+k to Activate link field to type a URL and hit enter to apply it

* Ctrl/Cmd+Alt+1/2/3 to apply header format (h1, h2, h3)

* Ctrl/Cmd+Alt+4 to apply Quote

* Ctrl/Cmd+Alt+5 to apply Code

## Styling Carbon Editor

Carbon includes a default styling for the editor components and the toolbars. You can override these in your own stylesheet or not include the main stylesheet for carbon and build your own.

## Extending Carbon Editor

There are currently two ways to extend the editor: Custom Components and Extensions. The difference is in the definition.

**Custom Components** are built to create multiple instances of and insert into the editor - e.g. YouTubeComponent allows people to insert multiple YouTube videos by creating multiple YouTubeComponent’s.

Whereas **Extensions** are meant to be initialized once and add functionality to the editor. For example, FormattingExtension enables formatting toolbars in the editor to allow formatting paragraphs and text.

### Custom Components

Developers can write custom components to extend the editor with, currently there are two ways your component can interface with the editor and allow insertion: **RegEx Triggers** and **Toolbelt**.

#### RegEx Triggers

A custom component can register a regex to listen to with the editor. When that RegEx is matched when the user hits enter on the current paragraph the editor will notify the component that matched that regex. For example, YouTubeComponent registers a RegEx to match a YouTube link typed in a new paragraph and then replaces that paragraph with a YouTubeComponent which embeds the YouTube video in the editor!

See [YouTubeComponent](https://github.com/manshar/carbon/blob/master/src/extensions/youtubeComponent.js) and [GiphySearch](https://github.com/manshar/carbon/blob/master/src/extensions/giphy-search/giphy-search.js) to learn more about extending the editor.

#### Editor Toolbelt

A component (or an extension) can also add a button on the editor toolbelt to allow insertion into the editor. For example, YouTubeComponent could add a "Embed YouTube" Button to the toolbelt that prompts the user to paste a link URL.

See [UploadExtension](https://github.com/manshar/carbon/blob/master/src/extensions/uploadExtension.js) to see how you can add your own actions to the Toolbelt.

### Extensions

An extension is used to enable new global functionality to the editor. For example, UploadExtension adds an "Upload Image" button to the editor’s toolbelt which allows users to upload images and insert the image in the editor.

See [ToolbeltExtension](https://github.com/manshar/carbon/blob/master/src/extensions/toolbeltExtension.js) to see how you can extend the editor with extensions.

## Serializing and Deserializing Article

You can store and load the article model you can serialize and deserialize the article to and from JSON format using `editor.getJSONModel()` and `editor.loadJSON(json)`. For example, the following example saves the article in localStorage and loads it back.

```javascript
var saveBtn = document.getElementById('saveBtn');
saveBtn.addEventListener('click', function() {
  var json = editor.getJSONModel();
  localStorage.setItem('article', JSON.stringify(json));
});
```

```javascript
var loadBtn = document.getElementById('loadBtn');
loadBtn.addEventListener('click', function() {
  var jsonStr = localStorage.getItem('article');
  editor.loadJSON(JSON.parse(jsonStr));
});
```

See [demo/index.html](https://github.com/manshar/carbon/blob/master/demo/index.html) for an example of storing and loading from the `localStorage`.

## Editor Events

**change**

Fired when the editor content changes.

**attachment-added**

Fired after an attachment has been added to the editor to allow clients to upload the attachment and update the source. The client can access the attachment object from `event.detail.attachment`. See [Attachment](#attachment) for more details. The following example listens to the event and update the attachment source and caption after uploading to a remote resource.

```javascript
editor.addEventListener('attachment-added', function(event) {
  var attachment = event.detail.attachment;
  ajax.uploadFile(attachment.file, function uploadComplete(data) {
    attachment.updateAttributes({
      src: data.src,
      caption: data.caption
    });
  });
});
```

**selection-changed**

Fires when the selection in the editor changes.


## Contributing
We'll check out your contribution if you:

* Provide a comprehensive suite of tests for your fork.
* Have a clear and documented rationale for your changes.
* Package these up in a pull request (all squashed and neat if possible).

We'll do our best to help you out with any contribution issues you may have.

Feel free to send pull requests implementing new components.

### Development
```bash
# clone
git clone --recursive git://github.com/manshar/carbon.git

cd carbon
npm install
bower install

# start coding with live reloading
grunt serve
```

Run `grunt test` to run the tests and run `grunt serve` to build the project and open the demo page. Any changes will be built and you'd need to refresh the demo to see them. You can also run `grunt` to just build and watch files, you can use this when you want to write some tests and see them running as you change files.

### License

Simplified BSD. See `LICENSE` in this directory.
