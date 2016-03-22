var ghpages = require('gh-pages');
var path = require('path');

ghpages.publish(path.join(path.dirname(__dirname), 'doc'), function(err) {
  if (err) {
    console.log('error occured while publishing to gh-pages: ' + err);
  }
});
