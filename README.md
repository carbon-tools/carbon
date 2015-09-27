###### Still Under Development... Not Ready for Usage...

# editor

An open source rich document editor in the browser.

## About

A JavaScript library by Manshar that implements a medium-inspired rich document editor in the browser.

See the [project homepage](http://manshar.github.io/editor).

## Installation

Using Bower:

    bower install editor

Or grab the [source](https://github.com/manshar/editor/dist/editor.standalone.js) ([minified](https://github.com/manshar/editor/dist/editor.standalone.min.js)).

## Usage

Basic usage is as follows:

    var editor = manshar.Editor(document.getElementById('editor'));

For advanced usage, see the documentation.

## Documentation

Start with `docs/MAIN.md`.

## Contributing

We'll check out your contribution if you:

* Provide a comprehensive suite of tests for your fork.
* Have a clear and documented rationale for your changes.
* Package these up in a pull request (all squashed and neat if possible).

We'll do our best to help you out with any contribution issues you may have.

## Development

### Installation
```bash
# clone
git clone --recursive git://github.com/manshar/editor.git

# start coding with live reloading
grunt serve
```

Run `grunt test` to run the tests and run `grunt serve` to build the project and open the demo page. Any changes will be built and you'd need to refresh the demo to see them. You can also run `grunt` to just build and watch files, you can use this when you want to write some tests and see them running as you change files.

## License

Simplified BSD. See `LICENSE` in this directory.
