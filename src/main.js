'use strict';

module.exports.Editor = require('./editor');
module.exports.Article = require('./article');
module.exports.Paragraph = require('./paragraph');
module.exports.List = require('./list');
module.exports.Figure = require('./figure');
module.exports.YouTubeComponent = require('./extensions/youtubeComponent');
module.exports.Section = require('./section');
module.exports.Selection = require('./selection');
module.exports.Formatting = require('./extensions/formatting');

// TODO(mkhatib): Find a better way to expose the classes and without making
// them part of the whole editor Javascript.
module.exports.GiphyComponent = require('./extensions/giphyComponent');
