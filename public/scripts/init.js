/*
*  authentication & data loading
*  + anything else that should happen on document ready
*  follow the events.init pattern to keep things tidy
*/

var pipes;
var db;

$(document).ready(function()
{
  db = firebase.firestore();

  // using pipes authentication
  var pipesConfig = {
      apiKey: "****",
      authDomain: "bespin-dab30.firebaseapp.com",
      databaseURL: "https://bespin-dab30.firebaseio.com",
      storageBucket: "bespin-dab30.appspot.com",
      messagingSenderId: "****"
    };

  pipes = firebase.initializeApp(pipesConfig, "pipes");
  pipes.auth().onAuthStateChanged(init.storePipesUser);

  events.init();
});

var init = function()
{
  var storePipesUser = function(user)
  {
    if(user)
    {
      settings.user = {};
      settings.user.name = user.displayName;
      settings.user.id = md5(user.email);
      settings.user.email = user.email;
      settings.user.pic = user.photoURL;

      //need function here (from central API)
      //settings.user.department = "Programmatic";

      registerUser(function(){
        events.updateEmail(false);
        listenDb();
      });
    }
    else
    {
      var provider = new firebase.auth.GoogleAuthProvider();
      pipes.auth().signInWithPopup(provider);
    }
  }

  var registerUser = function(callback)
  {
    db.collection("tables/users/all").doc(settings.user.id).get().then(function(snapshot)
    {
      if(!snapshot.exists)
      {
        var recordChoice = function(choice)
        {
          settings.user.department = choice;
          db.collection("tables/users/all").doc(settings.user.id).set({department: choice});
          callback();
        }

        events.makeDeptChoice(recordChoice);
      }
      else
      {
        settings.user.department = snapshot.data().department;
        callback();
      }
    });
  }

  var listenDb = function()
  {
    var gotJob = function(data)
    {
      //console.log(data);
      var changed = data.docChanges;

      for(var i = 0; i < changed.length; i++)
      {
        var change = changed[i];
        var key = change.doc.id;

        if(change.type == "removed")
        {
          events.removeJob(key);
          events.countJobs();
        }
        else
        {
          var jobInfo = change.doc.data();
          events.updateJob(key, jobInfo);
        }
      }
    }

    var lookups = [data.getSkills(), data.getJobStatuses()];

    Promise.all(lookups).then(function()
    {
      db.collection("tables/jobs/" + settings.user.department).orderBy("created", "asc").onSnapshot(gotJob);
    })
  }

  return{
    storePipesUser: storePipesUser,
    listenDb: listenDb
  }

}();
