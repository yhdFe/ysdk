module.exports = function (grunt) {

    // Project configuration.
    grunt.initConfig({

        concat: {
            options: {
                stripBanners: true,
                banner: '/* build on <%= grunt.template.today("yyyy-mm-dd") %> */ \n'
            },
            dist: {
                src: ['js/src/YSDK.js', 'js/src/YSDK-overlay.js', 'js/src/YSDK-switchable.js', 'js/src/jquery.easing.1.3.js'],
                dest: 'js/YSDK.pkg.js'
            }
        },

        // 复制文件
        copy: {
            main: {
                files: [{
                    expand: true,
                    src: ['js/YSDK.pkg.js'],
                    dest: 'dist/'
                }, {
                    expand: true,
                    src: ['css/*.css'],
                    dest: 'dist/'
                }, {
                    expand: true,
                    src: ['images/*.*'],
                    dest: 'dist/'
                }, {
                    expand: true,
                    src: ['*.html'],
                    dest: 'dist/'
                }]
            }
        },
        //      css属性排序
        csscomb: {
            mu: {
                expand: true,
                cwd: 'css/',
                src: ['*.css'],
                dest: 'css/',
                ext: '.css'
            }
        },
        //清理文件
        clean: {
            build: {
                src: 'dist/'
            }
        },
        uglify: {
            options: {
                mangle: true
            },
            my_target: {
                files: {
                    'dist/js/YSDK.pkg.min.js': ['dist/js/YSDK.pkg.js']
                }
            }
        }

    });

    //    加载所需模块
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-csscomb');
    grunt.loadNpmTasks('grunt-contrib-clean');

    //    开发时task
    grunt.task.registerTask('default','concat');

    //    构建task
    grunt.task.registerTask('build', ['csscomb', 'concat', 'clean', 'copy', 'uglify']);
};
