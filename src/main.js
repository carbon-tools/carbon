'use strict';

module.exports.Editor = require('./editor');
module.exports.Article = require('./article');
module.exports.Paragraph = require('./paragraph');
module.exports.List = require('./list');
module.exports.Figure = require('./figure');
module.exports.Section = require('./section');
module.exports.Selection = require('./selection');
module.exports.Loader = require('./loader');

/**
 * Not exporting these as part of carbon.js but available for anybody to use.
 *
 * EmbeddingExtension, EmbeddedComponent along with EmbedlyProvider provide
 * support to a much larger providers base (incl. YouTube, Vine, Vimeo).
 *
 * module.exports.YouTubeComponent = require('./extensions/youtubeComponent');
 * module.exports.VineComponent = require('./extensions/vineComponent');
 * module.exports.VimeoComponent = require('./extensions/vimeoComponent');
 *
 */

// TODO(mkhatib): Find a better way to expose the classes and without making
// them part of the whole editor Javascript.
module.exports.GiphyComponent = require('./extensions/giphyComponent');
module.exports.EmbeddedComponent = require('./extensions/embeddedComponent');
module.exports.AbstractEmbedProvider = require('./extensions/abstractEmbedProvider');
module.exports.EmbedlyProvider = require('./extensions/embedlyProvider');
module.exports.CarbonEmbedProvider = require('./extensions/carbonEmbedProvider');
module.exports.EmbeddingExtension = require('./extensions/embeddingExtension');
module.exports.SelfieExtension = require('./extensions/selfieExtension');
