module.exports = function(grunt){

  // loadnpmTasksで使用したいタスクを読み込んでおく
  grunt.loadNpmTasks("grunt-contrib-cssmin");
  grunt.loadNpmTasks("grunt-contrib-uglify");
  grunt.loadNpmTasks('grunt-contrib-watch');

  // initConfigで基本設定
  grunt.initConfig({
    uglify : {
      min : {
        options : {
          sourceMap: true,
          sourceMapName: function(name) { return name.replace(/.js/,".map");}
        },
        files: {
          "static/javascripts/devhub.min.js" : [
            "static/javascripts/libs/jsviews.min.js",
            "static/javascripts/libs/knockout.js",
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
            "static/javascripts/libs/chat_view_model.js",
            "static/javascripts/libs/chat_controller.js",
            "static/javascripts/libs/memo_view_model.js",
            "static/javascripts/libs/share_memo_controller.js",
            "static/javascripts/libs/client.js",
          ],
          "static/javascripts/upload.min.js" : [
            "static/javascripts/libs/jquery.colorbox-min.js",
            "static/javascripts/libs/jquery.lazyload.min.js",
            "static/javascripts/libs/upload.js",
          ],
          "static/javascripts/blog.min.js" : [
            "static/javascripts/libs/jsviews.min.js",
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
            "static/javascripts/libs/blog_view_model.js",
            "static/javascripts/libs/blog.js",
          ],
          "static/javascripts/blog_permalink.min.js" : [
            "static/javascripts/libs/jsviews.min.js",
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
            "static/javascripts/libs/blog_view_model.js",
            "static/javascripts/libs/blog_permalink.js",
          ]
        }
      }
    },
    cssmin : {
      min : {
        files : {
          "static/stylesheets/devhub.min.css" : [
            "static/stylesheets/libs/diffview.css",
            "static/stylesheets/libs/prettify.css",
            "static/stylesheets/libs/perfect-scrollbar.min.css",
            "static/stylesheets/libs/emolett.css",
            "static/stylesheets/libs/colorbox.css",
            "static/stylesheets/libs/devhub.css",
          ],
          "static/stylesheets/upload.min.css" : [
            "static/stylesheets/libs/colorbox.css",
            "static/stylesheets/libs/upload.css",
          ],
          "static/stylesheets/blog.min.css" : [
            "static/stylesheets/libs/prettify.css",
            "static/stylesheets/libs/perfect-scrollbar.min.css",
            "static/stylesheets/libs/emolett.css",
            "static/stylesheets/libs/colorbox.css",
            "static/stylesheets/libs/blog.css",
          ],
          "static/stylesheets/blog_permalink.min.css" : [
            "static/stylesheets/libs/prettify.css",
            "static/stylesheets/libs/perfect-scrollbar.min.css",
            "static/stylesheets/libs/emolett.css",
            "static/stylesheets/libs/colorbox.css",
            "static/stylesheets/libs/blog_permalink.css",
          ]
        }
      }
    },
    watch: {
      files: [
        'static/javascripts/libs/*.js',
        'static/stylesheets/libs/*.css'
        ],
      tasks: ['uglify','cssmin']
    }
  });

  grunt.registerTask("default", ["uglify", "cssmin","watch"]);
  grunt.registerTask("build", ["uglify", "cssmin"]);
};

