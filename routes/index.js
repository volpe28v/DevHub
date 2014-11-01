exports.get = function(req, res, app) {
  console.log('/');

  res.render('index',{
    locals:{
      title_name: app.get('title_name'),
      menu_links: app.get('menu_links')
    }
  });
}
