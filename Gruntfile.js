module.exports = function(grunt){

  // loadnpmTasksで使用したいタスクを読み込んでおく
  grunt.loadNpmTasks("grunt-contrib-cssmin");
  grunt.loadNpmTasks('grunt-contrib-watch');

  // initConfigで基本設定
  grunt.initConfig({
    cssmin : {
      min : {
        files : {
          "static/stylesheets/devhub.min.css" : [
            "static/stylesheets/libs/diffview.css",
            "static/stylesheets/libs/prettify.css",
            "static/stylesheets/libs/perfect-scrollbar.min.css",
            "static/stylesheets/libs/emolett.css",
            "static/stylesheets/libs/colorbox.css",
            "node_modules/fullcalendar/dist/fullcalendar.min.css",
            "node_modules/sweetalert/dist/sweetalert.css",
            "static/stylesheets/app/devhub.css",
          ],
          "static/stylesheets/upload.min.css" : [
            "static/stylesheets/libs/colorbox.css",
            "node_modules/sweetalert/dist/sweetalert.css",
            "static/stylesheets/app/upload.css",
          ],
          "static/stylesheets/blog.min.css" : [
            "static/stylesheets/libs/prettify.css",
            "static/stylesheets/libs/perfect-scrollbar.min.css",
            "static/stylesheets/libs/emolett.css",
            "static/stylesheets/libs/colorbox.css",
            "node_modules/sweetalert/dist/sweetalert.css",
            "static/stylesheets/app/blog.css",
          ],
          "static/stylesheets/blog_permalink.min.css" : [
            "static/stylesheets/libs/prettify.css",
            "static/stylesheets/libs/perfect-scrollbar.min.css",
            "static/stylesheets/libs/emolett.css",
            "static/stylesheets/libs/colorbox.css",
            "node_modules/sweetalert/dist/sweetalert.css",
            "static/stylesheets/app/blog_permalink.css",
          ],
          "static/stylesheets/calendar.min.css" : [
            "node_modules/fullcalendar/dist/fullcalendar.min.css",
          ],
        }
      }
    },
    watch: {
      files: [
        'static/stylesheets/app/*.css',
        'static/stylesheets/libs/*.css'
        ],
      tasks: ['cssmin']
    }
  });

  grunt.registerTask("default", ["cssmin","watch"]);
  grunt.registerTask("build", ["cssmin"]);
};

