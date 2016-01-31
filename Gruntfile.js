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

    shell: {
      deployCDN: {
        command: 'gsutil rsync -R <%= distDir %> gs://cdn.carbon.tools && gsutil acl ch -u AllUsers:R gs://cdn.carbon.tools/*'
      }
    },

    // Builds one js file from all require('..') statements.
    browserify: {
      // For use in browser. 'carbon' is going to be the name space.
      standalone: {
        options: {
          browserifyOptions: {
            standalone: 'carbon'
          }
        },
        files: {
          '<%= buildDir %>/<%=pkg.name%>.js': '<%= srcDir %>/main.js'
        }
      },

      thirdparty: {
        options: {
          browserifyOptions: {
            standalone: 'carbon3p'
          }
        },
        files: {
          '<%= buildDir %>/<%=pkg.name%>3p.js': '<%= srcDir %>/3rdparty/carbon3p.js'
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
          '<%= distDir %>/<%= pkg.name %>.js': '<%= buildDir %>/<%= pkg.name %>.js',
        }
      },
      css: {
        src: 'styles/*.css',
        dest: '<%= distDir %>/<%= pkg.name %>.css'
      }
    },

    copy: {
      main: {
        files: [{
            src: '<%= srcDir %>/3rdparty/iframe.html',
            dest: '<%= distDir %>/iframe.html'
        }, {
            src: '<%= buildDir %>/<%= pkg.name %>3p.js',
            dest: '<%= distDir %>/<%= pkg.name %>3p.js'
        }],
      },
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
          '<%= distDir %>/<%= pkg.name %>.min.js': '<%= buildDir %>/<%= pkg.name %>.js',
          '<%= distDir %>/<%= pkg.name %>3p.min.js': '<%= buildDir %>/<%= pkg.name %>3p.js',
        }
      }
    },

    cssmin: {
      options: {
        advanced: false
      },
      target: {
        files: {
          '<%= distDir %>/<%= pkg.name %>.min.css': '<%= distDir %>/<%= pkg.name %>.css'
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
        files: [
          '<%= srcDir %>/{,*/}*.js',
          '<%= testDir %>/{,*/}*.spec.js',
          '<%= demoDir %>/{,*/}*.js',
          '<%= demoDir %>/{,*/}*.css',
        ],
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
          '<%= srcDir %>/{,*/}*.html',
          'styles/{,*/}*.css',
          'images/{,*/}*.{png,jpg,jpeg,gif,webp,svg}'
        ],
        tasks: [
          'clean',
          'browserify:standalone',
          'browserify:thirdparty',
          'concat',
          'copy',
        ]
      },
      test: {
        files: [
          '<%= srcDir %>/**/*.js',
          '<%= testDir %>/**/*.spec.js',
          '<%= demoDir %>/**/*.js'
        ],
        tasks: ['test']
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
          open: 'http://localhost:8000',
          base: [
            '.',
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
      'connect:livereload:dist',
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
    'karma:continous',
    'watch:test'
  ]);

  grunt.registerTask('build', [
    'clean',
    'browserify:standalone',
    'browserify:thirdparty',
    'concat',
    'copy',
    'uglify',
    'cssmin',
    'jshint'
  ]);

  grunt.registerTask('default', [
    'build',
    'karma:unit'
  ]);

  grunt.registerTask('deployCDN', [
    'build',
    'shell:deployCDN'
  ]);

};
