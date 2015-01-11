var fs = require('fs');
var ejs = require('ejs');
var FeedSub = require('feedsub');
var mandrill = require('mandrill-api/mandrill');
var mandrill_client = new mandrill.Mandrill('gw4-onyTFNf536P2tuKcCA');
var csvFile = fs.readFileSync('friends_list.csv', 'utf8');
var emailTemplate = fs.readFileSync('emailTemplate.ejs', 'utf8');
//var csvData = csvParse(csvFile);
var friendList = csvParse(csvFile);
var templateCopy;
var customTemplate;
var blogContent = new FeedSub('http://crullian.github.io/atom.xml', {
  emitOnStart: true
});
var latestPosts = [];

function csvParse(file) {
  var newArr = [];

  file = file.split('\n');
  for (var i = 1; i < file.length; i++) {
    var obj = {};
    var line = file[i].split(',');
    if (typeof file[i] == 'undefined') {
      continue;
    }
    obj.firstName = line[0];
    obj.lastName = line[1];
    obj.monthsSinceContact = line[2];
    obj.emailAddress = line[3];
    newArr.push(obj);
  }
  return newArr;
}

function sendEmail(to_name, to_email, from_name, from_email, subject, message_html) {
  var message = {
    "html": message_html,
    "subject": subject,
    "from_email": from_email,
    "from_name": from_name,
    "to": [{
      "email": to_email,
      "name": to_name
    }],
    "important": false,
    "track_opens": true,
    "auto_html": false,
    "preserve_recipients": true,
    "merge": false,
    "tags": [
      "Fullstack_Hexomailer_Workshop"
    ]
  };
  var async = false;
  var ip_pool = "Main Pool";
  mandrill_client.messages.send({
    "message": message,
    "async": async,
    "ip_pool": ip_pool
  }, function(result) {
    // console.log(message);
    // console.log(result);   
  }, function(e) {
    // Mandrill returns the error as an object with name and message keys
    console.log('A mandrill error occurred: ' + e.name + ' - ' + e.message);
    // A mandrill error occurred: Unknown_Subaccount - No subaccount exists with the id 'customer-123'
  });
}

// blogPosts = array of objects from atom.xml
blogContent.read(function(err, blogPosts) {
  if (err) throw err;
  blogPosts.forEach(function(post) {
    var thisDate = new Date();
    var postDate = post.published.split('T')[0]; // make xml date js parse-worthy
    if (Date.parse(thisDate) - Date.parse(postDate) < 1728000000) {
      latestPosts.push(post);
    }

  });

  console.log(latestPosts);

  friendList.forEach(function(row) {
    firstName = row.firstName;
    monthsSinceContact = row.monthsSinceContact;
    email = row.emailAddress;

    // we make a copy of the emailTemplate variable to a new variable to ensure
    // we don't edit the original template text since we'll need to us it for 
    // multiple emails

    templateCopy = emailTemplate;

    customTemplate = ejs.render(templateCopy, {
      firstName: firstName,
      monthsSinceContact: monthsSinceContact,
      latestPosts: latestPosts
    });

    // console.log(customTemplate);
    console.log(firstName, email);
    sendEmail(firstName, email, "Chris", "crullian@gmail.com", "Just sayin hi again!", customTemplate);
  });

});



//yay