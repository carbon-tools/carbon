var modRewrite = require('connect-modrewrite');
var splittable = require('splittable');

module.exports = function(grunt) {
  'use strict';

  require('load-grunt-tasks')(grunt);

  /* eslint max-len: 0 */
  grunt.initConfig({

    pkg: grunt.file.readJSON('package.json'),
    srcDir: 'src',
    stylesDir: 'styles',
    buildDir: 'build',
    testDir: 'test',
    distDir: 'dist',
    demoDir: 'demo',

    clean: ['<%= buildDir %>', '<%= distDir %>'],

    shell: {
      deployCDN: {
        command: 'gsutil -m rsync -R <%= distDir %> gs://cdn.carbon.tools/<%= pkg.version %> && gsutil -m acl ch -u AllUsers:R gs://cdn.carbon.tools/<%= pkg.version %>/*',
      },
      deployLatest: {
        command: 'gsutil -m rsync -R <%= distDir %> gs://cdn.carbon.tools/latest && gsutil -m acl ch -u AllUsers:R gs://cdn.carbon.tools/latest/*',
      },
    },

    // Builds one js file from all require('..') statements.
    browserify: {
      // For use in browser. 'carbon' is going to be the name space.
      standalone: {
        options: {
          transform: [
            'browserify-versionify',
          ],
          browserifyOptions: {
            standalone: 'carbon',
            debug: grunt.option('debug'),
          },
        },
        files: {
          '<%= buildDir %>/<%=pkg.name%>.js': '<%= srcDir %>/main.js',
        },
      },

      thirdparty: {
        options: {
          transform: [
            'browserify-versionify',
          ],
          browserifyOptions: {
            standalone: 'carbon3p',
            debug: grunt.option('debug'),
          },
        },
        files: {
          '<%= buildDir %>/<%=pkg.name%>3p.js': '<%= srcDir %>/3rdparty/carbon3p.js',
        },
      },
    },

    concat: {
      options: {
        separator: '\n\n',
      },
      dist: {
        files: {
          '<%= distDir %>/<%= pkg.name %>.js': '<%= buildDir %>/<%= pkg.name %>.js',
        },
      },
      css: {
        src: 'styles/*.css',
        dest: '<%= distDir %>/<%= pkg.name %>.css',
      },
    },

    copy: {
      main: {
        files: [{
          src: '<%= srcDir %>/3rdparty/iframe.html',
          dest: '<%= distDir %>/iframe.html',
        }, {
          src: '<%= srcDir %>/3rdparty/nomagic-iframe.html',
          dest: '<%= distDir %>/nomagic-iframe.html',
        }, {
          src: '<%= buildDir %>/<%= pkg.name %>3p.js',
          dest: '<%= distDir %>/<%= pkg.name %>3p.js',
        }],
      },
    },

    eslint: {
      target: [
        '<%= srcDir %>/**/*.js',
        '<%= testDir %>/**/*.spec.js',
      ],
      options: {
        fix: true,
      },
    },

    uglify: {
      options: {
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("dd-mm-yyyy") %> */\n',
      },
      dist: {
        files: {
          '<%= distDir %>/<%= pkg.name %>.min.js': '<%= buildDir %>/<%= pkg.name %>.js',
          '<%= distDir %>/<%= pkg.name %>3p.min.js': '<%= buildDir %>/<%= pkg.name %>3p.js',
        },
      },
    },

    cssmin: {
      options: {
        advanced: false,
      },
      target: {
        files: {
          '<%= distDir %>/<%= pkg.name %>.min.css': '<%= distDir %>/<%= pkg.name %>.css',
        },
      },
    },

    karma: {
      options: {
        configFile: 'karma.conf.js',
        autoWatch: false,
      },

      unit: {
        background: true,
        singleRun: false,
      },

      continous: {
        singleRun: true,
      },

      unitCoverage: {
        configFile: 'karma.conf.js',
        autoWatch: false,
        singleRun: true,
        reporters: ['progress', 'coverage'],
        preprocessors: {
          'src/**/*.js': ['coverage'],
        },
        coverageReporter: {
          reporters: [
            {type: 'text'},
            {type: 'html', dir: 'coverage'},
          ],
        },
      },
    },

    watch: {
      dist: {
        files: [
          '<%= srcDir %>/**/*.js',
          '<%= stylesDir %>/**/*.css',
          '<%= demoDir %>/**/*.js',
          '<%= demoDir %>/**/*.css',
        ],
        tasks: ['build'],
      },
      gruntfile: {
        files: ['Gruntfile.js'],
      },
      livereload: {
        options: {
          livereload: '<%= connect.options.livereload %>',
        },
        files: [
          '<%= srcDir %>/**/*.html',
          'styles/**/*.css',
          'images/**/*.{png,jpg,jpeg,gif,webp,svg}',
        ],
        tasks: [
          'clean',
          'browserify:standalone',
          'browserify:thirdparty',
          'concat',
          'copy',
        ],
      },
      test: {
        files: [
          '<%= srcDir %>/**/*.js',
          '<%= testDir %>/**/*.spec.js',
        ],
        tasks: ['test'],
      },
    },

    connect: {
      options: {
        port: grunt.option('port') || 8000,
        hostname: 'localhost',
        livereload: 35729,
        debug: true,
        middleware: function(connect, options) {
          var isString = typeof options.base === 'string';
          var optBase = isString ? [options.base] : options.base;
          var regexStr = '!\\.html|\\.js|\\.svg|\\.ttf|\\.woff|\\.woff2|' +
              '\\.css|\\.png|\\.jpg\\.gif|\\swf$ / [L]';
          var middleware = [modRewrite([regexStr])]
                .concat(optBase.map(function(path) {
                  if (path.indexOf('rewrite|') === -1) {
                    return connect.static(path);
                  } else {
                    path = path.replace(/\\/g, '/').split('|');
                    return connect().use(path[1], connect.static(path[2]));
                  }
                }));

          return middleware;
        },
      },
      livereload: {
        options: {
          base: [
            '.',
            '.tmp',
            '<%= pkg.name %>',
          ],
        },
      },
      test: {
        options: {
          port: 9001,
          base: [
            '.tmp',
            'test',
            '<%= pkg.name %>',
          ],
        },
      },
      dist: {
        options: {
          base: '<%= distDir %>',
        },
      },
      coverage: {
        options: {
          open: true,
          base: 'coverage/',
          port: 5555,
          keepalive: true,
        },
      },
    },

    filesizegzip: {
      dist: {
        options: {
          gzip: true,
        },
        src: 'dist/*.*',
      },
    },

  });

  grunt.registerTask('serve', function() {
    grunt.task.run([
      'clean',
      'build',
      'connect:livereload:dist',
      'watch:dist',
      'watch:gruntfile',
      'watch:livereload',
    ]);
  });

  grunt.registerTask('coverage', [
    'karma:unitCoverage',
    'connect:coverage',
  ]);

  grunt.registerTask('test', [
    'eslint',
    'karma:continous',
    'watch:test',
  ]);

  grunt.registerTask('build', [
    'clean',
    'browserify:standalone',
    'browserify:thirdparty',
    'concat',
    'copy',
    'uglify',
    'cssmin',
    'eslint',
    'filesizegzip:dist',
  ]);

  grunt.registerTask('default', [
    'build',
    'karma:unit',
  ]);

  grunt.registerTask('deploy', [
    'build',
    'shell:deployCDN',
    'shell:deployLatest',
  ]);

  grunt.registerTask('compile', ['closure-compiler:dist']);

  grunt.registerTask('split', 'Builds, minifies and split modules', function() {
    var done = this.async();
    return splittable({
      // Create bundles from 2 entry modules `./lib/a` and `./lib/b`.
      modules: [
        './src/newmain.js',
        // './src/defs.js',
        //'./src/3rdparty/carbon3p.js'
      ],
      writeTo: 'dist/modules/',
      warnings: true,
    }).then(function(info) {
      if (info.warnings) {
        grunt.fail.warn(info.warnings);
        grunt.log.writeln('Compilation successful with warnings.');
      } else {
        grunt.log.writeln('Compilation successful.');
      }
      done(true);
    }, function(reason) {
      grunt.fail.fatal(reason, 'Compilation failed');
      done(false);
    });
  });

};
