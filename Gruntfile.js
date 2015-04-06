module.exports = function(grunt) {
  'use strict';

  require('load-grunt-tasks')(grunt);

  grunt.initConfig({

    pkg: grunt.file.readJSON('package.json'),
    srcDir: "src",
    buildDir: "build",
    testDir: "test",
    distDir: "dist",

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
          '<%= distDir %>/<%= pkg.name %>.standalone.js': '<%= buildDir %>/<%= pkg.name %>.standalone.js'
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
        files: ['<%= srcDir %>/**/*.js', '<%= testDir %>/**/*.spec.js'],
        tasks: ['browserify', 'uglify', 'concat', 'karma:continous', 'jshint']
      }
    },

    connect: {
      dist: {
        options: {
          port: 8000
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

  grunt.registerTask('coverage', [
    'karma:unitCoverage',
    'connect:coverage'
  ]);

  grunt.registerTask('test', [
    'browserify:tests',
    'jshint',
    'karma:continous'
  ]);

  grunt.registerTask('default', [
    'clean',
    'browserify:standalone',
    'uglify',
    'concat',
    'karma:unit',
    'jshint',
    'watch'
  ]);

};
