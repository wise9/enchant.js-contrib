/*global module:false*/

module.exports = function(grunt) {
    grunt.loadNpmTasks('grunt-exec');

    // Project configuration.
    grunt.initConfig({
            meta: {
                version: 'v0.6.1',
            },
            lint: {
                files: ['dev/plugins/*.js']
            },
            qunit: {
                files: ['tests/qunit/*/*.html']
            },
            watch: {
                files: 'dev/src/*.js',
                tasks: 'concat min'
            },
            jshint: {
                options: {
                    curly: true,
                    eqeqeq: true,
                    immed: true,
                    latedef: true,
                    newcap: true,
                    noarg: true,
                    sub: true,
                    undef: true,
                    boss: true,
                    eqnull: true,
                    browser: true,
                    proto: true,
                    multistr: true
                },
                globals: {
                    enchant: true,
                    WebGLBuffer: true,
                    gl: true,
                    Ammo: true,
                    vec2: true,
                    vec3: true,
                    vec4: true,
                    mat2: true,
                    mat3: true,
                    mat4: true,
                    quat4: true
                }
            },
            exec: {
                lang: {
                    command: 'rake lang'
                },
                doc: {
                    command: 'rake doc'
                }
            }
        }
    )
    ;

// Default task.
    grunt.registerTask('default', 'lint qunit exec:lang');
};