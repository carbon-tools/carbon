var modRewrite = require('connect-modrewrite');

module.exports = function(grunt) {
  'use strict';

  require('load-grunt-tasks')(grunt);

  grunt.initConfig({

    pkg: grunt.file.readJSON('package.json'),
    srcDir: "src",
    buildDir: "build",
    testDir: "test",
    distDir: "dist",
    demoDir: "demo",

    clean: [ "<%= buildDir %>", "<%= distDir %>" ],

    // Builds one js file from all require('..') statements.
    browserify: {
      // For use in browser. 'manshar' is going to be the name space.
      standalone: {
        options: {
          browserifyOptions: {
            standalone: 'manshar'
          }
        },
        files: {
          '<%= buildDir %>/<%=pkg.name%>.standalone.js': '<%= srcDir %>/main.js'
        }
      },

      // For running tests.
      tests: {
        options: {
          // Embed source map for tests
          debug: true
        },
        files: {
          '<%= buildDir %>/<%= pkg.name %>.spec.js': '<%= testDir %>/**/*.spec.js'
        }
      }
    },

    concat: {
      options: {
        separator: '\n\n'
      },
      dist: {
        files: {
          '<%= distDir %>/<%= pkg.name %>.standalone.js': '<%= buildDir %>/<%= pkg.name %>.standalone.js',
          '<%= demoDir %>/<%= pkg.name %>.standalone.js': '<%= buildDir %>/<%= pkg.name %>.standalone.js',
        }
      }
    },

    jshint: {
      dist: ['<%= srcDir %>/**/*.js'],
      test: ['<%= testDir %>/**/*.spec.js'],
      options: {
        globals: {
          console: true,
          module: true,
          document: true
        },
        jshintrc: '.jshintrc'
      }
    },

    uglify: {
      options: {
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("dd-mm-yyyy") %> */\n'
      },
      dist: {
        files: {
          '<%= distDir %>/<%= pkg.name %>.standalone.min.js': '<%= buildDir %>/<%= pkg.name %>.standalone.js'
        }
      }
    },

    karma: {
      options: {
        configFile: 'karma.conf.js',
        autoWatch: false
      },

      unit: {
        background: true,
        singleRun: false
      },

      continous: {
        singleRun: true
      },

      unitCoverage: {
        configFile: 'karma.conf.js',
        autoWatch: false,
        singleRun: true,
        reporters: ['progress', 'coverage'],
        preprocessors: {
          'src/{,*/}*.js': ['coverage']
        },
        coverageReporter: {
          reporters: [
            {type : 'text'},
            {type: 'html', dir: 'coverage'}
          ]
        }
      }
    },

    watch: {
      dist: {
        files: ['<%= srcDir %>/**/*.js', '<%= testDir %>/**/*.spec.js', '<%= demoDir %>/**/*.js'],
        tasks: ['build']
      },
      gruntfile: {
        files: ['Gruntfile.js']
      },
      livereload: {
        options: {
          livereload: '<%= connect.options.livereload %>'
        },
        files: [
          '<%= pkg.name %>/{,*/}*.html',
          '.tmp/styles/{,*/}*.css',
          '<%= pkg.name %>/images/{,*/}*.{png,jpg,jpeg,gif,webp,svg}'
        ]
      }
    },

    connect: {
      options: {
        port: grunt.option('port') || 8000,
        hostname: 'localhost',
        livereload: 35729,
        debug: true,
        middleware: function (connect, options) {
          var optBase = (typeof options.base === 'string') ? [options.base] : options.base,
              middleware = [modRewrite(['!\\.html|\\.js|\\.svg|\\.ttf|\\.woff|\\.woff2|\\.css|\\.png|\\.jpg\\.gif|\\swf$ / [L]'])]
                .concat(optBase.map(function (path) {
                  if (path.indexOf('rewrite|') === -1) {
                    return connect.static(path);
                  } else {
                    path = path.replace(/\\/g, '/').split('|');
                    return connect().use(path[1], connect.static(path[2]));
                  }
                }));

          return middleware;
        }
      },
      livereload: {
        options: {
          open: true,
          base: [
            'demo/',
            '.tmp',
            '<%= pkg.name %>'
          ]
        }
      },
      test: {
        options: {
          port: 9001,
          base: [
            '.tmp',
            'test',
            '<%= pkg.name %>'
          ]
        }
      },
      dist: {
        options: {
          base: '<%= distDir %>'
        }
      },
      coverage: {
        options: {
          open: true,
          base: 'coverage/',
          port: 5555,
          keepalive: true
        }
      }
    }

  });

  grunt.registerTask('serve', function (target) {
    grunt.task.run([
      'clean',
      'build',
      'connect:livereload',
      'watch'
    ]);
  });

  grunt.registerTask('coverage', [
    'karma:unitCoverage',
    'connect:coverage'
  ]);

  grunt.registerTask('test', [
    'browserify:tests',
    'jshint',
    'karma:continous'
  ]);

  grunt.registerTask('build', [
    'clean',
    'browserify:standalone',
    'uglify',
    'concat',
    'karma:unit',
    'jshint'
  ]);

  grunt.registerTask('default', [
    'build',
    'watch'
  ]);

};
