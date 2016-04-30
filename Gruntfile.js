module.exports = function(grunt){

  // loadnpmTasksで使用したいタスクを読み込んでおく
  grunt.loadNpmTasks("grunt-contrib-cssmin");
  //grunt.loadNpmTasks("grunt-contrib-uglify");
  grunt.loadNpmTasks('grunt-contrib-watch');

  // initConfigで基本設定
  grunt.initConfig({
    /*
    uglify : {
      min : {
        options : {
          sourceMap: true,
          sourceMapName: function(name) { return name.replace(/.js/,".map");}
        },
        files: {
          "static/javascripts/devhub.min.js" : [
            "static/javascripts/libs/bootstrap.min.js",
            "static/javascripts/libs/knockout.js",
            "static/javascripts/libs/knockout.mapping.js",
            "static/javascripts/libs/jquery.cookie.js",
            "static/javascripts/libs/jquery.inview.min.js",
            "static/javascripts/libs/jquery.finger.min.js",
            "static/javascripts/libs/jquery.autofit.js",
            "static/javascripts/libs/jquery.autosize.js",
            "static/javascripts/libs/jquery.colorbox-min.js",
            "static/javascripts/libs/jquery.selection.js",
            "static/javascripts/libs/jquery.exfixed.js",
            "static/javascripts/libs/jquery.exresize.js",
            "static/javascripts/libs/perfect-scrollbar.jquery.min.js",
            "static/javascripts/libs/prettify.js",
            "static/javascripts/libs/sanitize.js",
            "static/javascripts/libs/emojify.min.js",
            "static/javascripts/libs/jquery.decora.js",
            "static/javascripts/libs/jquery.caret.js",
            "static/javascripts/libs/flipsnap.min.js",
            "static/javascripts/libs/moment.js",
            "static/javascripts/libs/moment.lang_ja.js",
            "static/javascripts/libs/livestamp.js",
            "static/javascripts/libs/difflib.js",
            "static/javascripts/libs/diffview.js",
            "static/javascripts/libs/favico-0.3.4.min.js",
            "static/javascripts/libs/favicon-number.js",
            "static/javascripts/libs/emojies.js",
            "static/javascripts/libs/jquery.textcomplete.min.js",
            "static/javascripts/libs/ion.sound.min.js",
            "static/javascripts/libs/dropzone.js",
            "static/javascripts/libs/textarea-helper.js",
            "static/javascripts/libs/message_date.js",
            "static/javascripts/libs/knockout.devhub_custom.js",
            "static/javascripts/app/chat_view_model.js",
            "static/javascripts/app/chat_controller.js",
            "static/javascripts/app/memo_view_model.js",
            "static/javascripts/app/memo_controller.js",
            "static/javascripts/app/client.js",
          ],
          "static/javascripts/upload.min.js" : [
            "static/javascripts/libs/bootstrap.min.js",
            "static/javascripts/libs/jquery.colorbox-min.js",
            "static/javascripts/libs/jquery.lazyload.min.js",
            "static/javascripts/app/upload.js",
          ],
          "static/javascripts/blog.min.js" : [
            "static/javascripts/libs/bootstrap.min.js",
            "static/javascripts/libs/knockout.js",
            "static/javascripts/libs/knockout.mapping.js",
            "static/javascripts/libs/jquery.autofit.js",
            "static/javascripts/libs/jquery.autosize.js",
            "static/javascripts/libs/jquery.cookie.js",
            "static/javascripts/libs/jquery.colorbox-min.js",
            "static/javascripts/libs/jquery.inview.min.js",
            "static/javascripts/libs/perfect-scrollbar.jquery.min.js",
            "static/javascripts/libs/prettify.js",
            "static/javascripts/libs/sanitize.js",
            "static/javascripts/libs/emojify.min.js",
            "static/javascripts/libs/emojies.js",
            "static/javascripts/libs/jquery.decora.js",
            "static/javascripts/libs/jquery.caret.js",
            "static/javascripts/libs/moment.js",
            "static/javascripts/libs/moment.lang_ja.js",
            "static/javascripts/libs/dropzone.js",
            "static/javascripts/libs/livestamp.js",
            "static/javascripts/libs/clipboard.min.js",
            "static/javascripts/libs/knockout.devhub_custom.js",
            "static/javascripts/app/blog_view_model.js",
            "static/javascripts/app/blog.js",
          ],
          "static/javascripts/blog_permalink.min.js" : [
            "static/javascripts/libs/bootstrap.min.js",
            "static/javascripts/libs/knockout.js",
            "static/javascripts/libs/knockout.mapping.js",
            "static/javascripts/libs/jquery.autofit.js",
            "static/javascripts/libs/jquery.cookie.js",
            "static/javascripts/libs/jquery.colorbox-min.js",
            "static/javascripts/libs/jquery.inview.min.js",
            "static/javascripts/libs/perfect-scrollbar.jquery.min.js",
            "static/javascripts/libs/prettify.js",
            "static/javascripts/libs/sanitize.js",
            "static/javascripts/libs/emojify.min.js",
            "static/javascripts/libs/emojies.js",
            "static/javascripts/libs/jquery.decora.js",
            "static/javascripts/libs/jquery.caret.js",
            "static/javascripts/libs/moment.js",
            "static/javascripts/libs/moment.lang_ja.js",
            "static/javascripts/libs/dropzone.js",
            "static/javascripts/libs/livestamp.js",
            "static/javascripts/libs/clipboard.min.js",
            "static/javascripts/libs/knockout.devhub_custom.js",
            "static/javascripts/app/blog_view_model.js",
            "static/javascripts/app/blog_permalink.js",
          ]
        }
      }
    },
    */
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
            "static/stylesheets/app/upload.css",
          ],
          "static/stylesheets/blog.min.css" : [
            "static/stylesheets/libs/prettify.css",
            "static/stylesheets/libs/perfect-scrollbar.min.css",
            "static/stylesheets/libs/emolett.css",
            "static/stylesheets/libs/colorbox.css",
            "static/stylesheets/app/blog.css",
          ],
          "static/stylesheets/blog_permalink.min.css" : [
            "static/stylesheets/libs/prettify.css",
            "static/stylesheets/libs/perfect-scrollbar.min.css",
            "static/stylesheets/libs/emolett.css",
            "static/stylesheets/libs/colorbox.css",
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
        'static/javascripts/app/*.js',
        'static/javascripts/libs/*.js',
        'static/stylesheets/app/*.css',
        'static/stylesheets/libs/*.css'
        ],
      //tasks: ['uglify','cssmin']
      tasks: ['cssmin']
    }
  });

  //grunt.registerTask("default", ["uglify", "cssmin","watch"]);
  //grunt.registerTask("build", ["uglify", "cssmin"]);
  grunt.registerTask("default", ["cssmin","watch"]);
  grunt.registerTask("build", ["cssmin"]);
};

