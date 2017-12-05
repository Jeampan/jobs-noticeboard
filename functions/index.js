const functions = require('firebase-functions');
//  https://firebase.google.com/docs/functions/write-firebase-functions

const nodemailer = require('nodemailer');
// Configure the email transport using the default SMTP transport and a GMail account.
// For Gmail, enable these:
// 1. https://www.google.com/settings/security/lesssecureapps
// 2. https://accounts.google.com/DisplayUnlockCaptcha
// For other types of transports such as Sendgrid see https://nodemailer.com/transports/
// TODO: Configure the `gmail.email` and `gmail.password` Google Cloud environment variables.
const gmailEmail = functions.config().gmail.email;
const gmailPassword = functions.config().gmail.password;
const mailTransport = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: gmailEmail,
    pass: gmailPassword
  }
});

const APP_NAME = 'Jobs Noticeboard';

exports.userAssignedSearch = functions.firestore
  .document('tables/jobs/Search/{jobId}')
  .onUpdate(onJobUpdated);

exports.userAssignedProgrammatic = functions.firestore
  .document('tables/jobs/Programmatic/{jobId}')
  .onUpdate(onJobUpdated);

  function onJobUpdated(event)
  {
      var newValue = event.data.data();
      var previousValue = event.data.previous.data();

      console.log(previousValue);
      console.log(newValue);

      if(!newValue.assigned)
      {
        return;
      }

      var prevAssigned = (!previousValue.assigned ? [] : Object.keys(previousValue.assigned));
      var newAssigned = Object.keys(newValue.assigned);

      if(prevAssigned.length && newAssigned.length > prevAssigned.length)
      {
        console.log("changed");

        var newKey = newAssigned.filter(function(user){ return prevAssigned.indexOf(user); });

        if(newKey.length == 0)
        {
          return null;
        }

        var newUser = newValue.assigned[newKey[0]].name;
        var owner = newValue.createdBy.email;
        var jobName = newValue.title;
        var totalAssigned = newAssigned.length;
        var askedFor = newValue.people;

        return sendEmail(owner, newUser, jobName, totalAssigned, askedFor);
      }

      return null;
  };

function sendEmail(email, newAssigned, jobName, totalAssigned, askedFor)
{
  const mailOptions = {
    from: `${APP_NAME} <${gmailEmail}>`,
    to: email
  };

  mailOptions.subject = `Someone assigned themselves to your job`;
  mailOptions.text = `Hey\n\n${newAssigned} has signed up for your job "${jobName}", that's ${totalAssigned} out of ${askedFor} now.`;
  return mailTransport.sendMail(mailOptions).then(() => {
    console.log('Assigned email sent to:', email);
  });
}
