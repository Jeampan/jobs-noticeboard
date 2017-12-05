/*
*  All the jQuery code for behaviour when
*  something is interacted with on the page
*/

var events = function()
{
  // init purely for event handlers
  var init = function()
  {
    $("#Emails").on("click", ".switch > label", updateEmail);
    $("#AddJob").on("click", newJob);
    $("body").on("click", "#Delete", deleteJob);
    $("body").on("submit", "form", saveJob);
    $("body").on("click", ".closeForm", closeForm);
    $(".forms").on("click", closeForm);
    $("body").on("click", ".people", function(){ $(this).parents(".job").find(".card-content .activator").click(); });
    $("body").on("click", ".assign, .isMe", assignSelf);
    $("body").on("click", ".moreInfo", flipCard);
    $("#Created").on("click", ".editJob", editJob);

    search.setup($("#Search"), "section .col");
  }

  var timeout;

  var countJobs = function()
  {
    clearTimeout(timeout);

    timeout = setTimeout(function()
    {
      var counts = $(".jobCount");

      for(var i = 0; i < counts.length; i++)
      {
        var countLabel = counts.eq(i);
        var section = countLabel.parent().attr("href");
        var count = $(section).find(".job:not(.removing)").length;

        if(count != countLabel.html())
        {
          countLabel.fadeOut(100, function(count){ $(this).html(count).fadeIn(100); }.bind(countLabel, count));
        }
      }

    }, 210);
  }

  var updateEmail = function(isClick)
  {
    db.collection("tables/emails/" + settings.user.department).doc(settings.user.email).get().then(function(snapshot)
    {
      var enabled;

      if(snapshot.exists)
      {
        var setting = snapshot.data();

        if(isClick)
        {
          var isOn = $("#EmailBox").is(":checked");

          db.collection("tables/emails/" + settings.user.department).doc(settings.user.email).set({enabled: isOn});
        }
        else
        {
          $("#EmailBox").prop('checked', setting.enabled);
        }
      }
      else
      {
          db.collection("tables/emails/" + settings.user.department).doc(settings.user.email).set({enabled: true});
          $("#EmailBox").prop('checked', true);
      }

      $("#EmailAddress").html("Receiving emails to: " + settings.user.email);
    });
  }

  var newJob = function(e, jobInfo)
  {
    var form = factory.buildNewJobForm();

    $(".forms").append(form).fadeIn(300);
    Materialize.updateTextFields();
    $('select').material_select();
    $("#NewJob").find(".datepicker").pickadate({
      selectMonths: true,
      selectYears: 1,
      today: 'Today',
      clear: 'Clear',
      close: 'Ok',
      closeOnSelect: false
    });

    if(jobInfo)
    {
      preFillForm(form, jobInfo);
    }
    else
    {
      $("#NewJob").find("#Delete").remove();
    }
  }

  var preFillForm = function(form, jobInfo)
  {
    var fields = Object.keys(jobInfo);
    var form = $("#NewJob form");

    for(var i = 0; i < fields.length; i++)
    {
      var fieldName = fields[i];
      fieldName = fieldName.charAt(0).toUpperCase() + fieldName.slice(1);
      var value = jobInfo[fieldName.toLowerCase()];
      form.find("#" + fieldName).val(value).trigger('autoresize').siblings("label").addClass("active");
    }

    form.find("#PeopleOutput").val(jobInfo.people);

    var statusSelect = form.find("#Status");
    statusSelect.find("option").removeAttr("selected");
    statusSelect.find("option[value='" + jobInfo.status + "']").attr("selected", true);
    statusSelect.material_select();

    var skills = Object.keys(jobInfo.skills);
    var skillsSelect = form.find("#Skills");
    skillsSelect.find("option").removeAttr("selected");

    for(var i = 0; i < skills.length; i++)
    {
      skillsSelect.find("option[value='" + skills[i] + "']").attr("selected", true);
    }

    skillsSelect.material_select();

    form.get(0).id = jobInfo.id;
  }

  var editJob = function(e)
  {
    var jobCard = $(this).parents(".job").get(0);
    var jobInfo = jobCard.jobInfo;
    jobInfo.id = jobCard.id;
    newJob(null, jobInfo);
  }

  var saveJob = function(e)
  {
    e.preventDefault();
    var jobInfo = {};
    $("#NewJob form").serializeArray().map(function(x){ jobInfo[x.name] = x.value; });

    jobInfo.skills = {};

    $("#NewJob form #Skills").val().map(function(item)
    {
      jobInfo.skills[item] = true;
    })

    jobInfo.createdBy = { id: settings.user.id, name: settings.user.name, email: settings.user.email};
    jobInfo.created = (new Date().getTime());

    var existingId = $("#NewJob form").get(0).id;
    var existingInfo = existingId ? $(".job[id=" + existingId + "]").get(0).jobInfo : null;
    jobInfo.assigned = existingInfo ? existingInfo.assigned : {};
    jobInfo.pic = existingInfo ? existingInfo.pic : "/images/" + mountains.getRandom();
    var jobId = existingId || db.collection("tables/jobs/" + settings.user.department).doc().id;

    db.collection("tables/jobs/" + settings.user.department).doc(jobId).set(jobInfo).then(function(docRef)
    {
      //docRef.id
    }).catch(errors.db);

    $("#NewJob").fadeOut(300, function(){ $(this).remove(); });
    $(".forms").fadeOut(300);
  }

  var deleteJob = function(e)
  {
    var jobId = $(this).parents("form").attr("id");

    db.collection("tables/jobs/" + settings.user.department).doc(jobId).delete().then(function()
    {
      removeJob(jobId);
    })

    e.stopImmediatePropagation();
    e.preventDefault();
    closeForm(e, true);
  }

  var updateJob = function(key, jobInfo)
  {
    var existing = $(".job[id=" + key + "]");

    if(!existing.length)
    {
      var newCard = factory.buildJobCard(key, jobInfo);
      positionJob(newCard, jobInfo);
    }
    else
    {
      updateJobCard(existing, jobInfo);
    }

    setTimeout(countJobs, 200);
    $(".tooltipped").tooltip({delay: 50});
  }

  var removeJob = function(key, overrideSections)
  {
    if(overrideSections)
    {
      $("#" + overrideSections).find(".job[id='" + key + "']").addClass("removing").finish().fadeOut(200, function(){ $(this).parents(".col").remove(); countJobs(); });
    }
    else
    {
      $("#Assigned, #OpenJobs, #Created").find(".job[id='" + key + "']").addClass("removing").finish().fadeOut(200, function(){ $(this).parents(".col").remove(); countJobs(); });
    }
  }

  // this is a bit of a nightmare, try to avoid changing it
  var positionJob = function(jobCard, jobInfo, moveTo)
  {
    var assignedTo = (jobInfo.assigned ? (Object.keys(jobInfo.assigned).indexOf(settings.user.id) > -1 ? true : false) : false);
    //var section = moveTo || (jobInfo.status == "Complete" ? ((jobInfo.createdBy.id == settings.user.id || assignedTo) ? "Completed" : "" ) : (assignedTo ? "Assigned" : "OpenJobs"));
    var section = moveTo || (jobInfo.status == "Complete" ? "Completed" : (assignedTo ? "Assigned" : "OpenJobs"));
    var createdBy = false;

    if(section == "")
    {
      return;
    }

    // if the card isn't being specifically added to a tab make sure it gets copied to the created tab if this user created it
    if(!moveTo && jobInfo.createdBy && jobInfo.createdBy.id == settings.user.id)
    {
      section += ",#Created";
      createdBy = true;
    }

    // containers is a jQuery collection of the containers above job cards on each tab
    var containers = $("#" + section).find(".container > .row:first-child");
    var jobId = $(jobCard).find(".job").attr("id");

    for(var i = 0; i < containers.length; i++)
    {
      var container = containers.eq(i);

      if(!container.find(".job[id='" + jobId + "']").length)
      {
        // add class to hide the card, then copy it and add it to the correct tab(s), then put a div around the copy and click the button on the back to make sure it's facing forward
        $(jobCard).addClass("preAdd").clone(true).appendTo(container).wrap('<div class="col s12 m6 l6 xl4"></div>').find(".card-reveal > .material-icons").click();
      }
    }

    if(moveTo == "Completed")
    {
      var existing = $("#Completed .job[id='" + jobId + "']");
      if(existing.length > 1)
      {
        existing.eq(existing.length - 1).parents(".col").remove();
        return;
      }
    }

    // attach jobInfo to copies of the card
    $(".job[id='" + jobId + "']").get().map(function(item){ item.jobInfo = jobInfo; });
    // take away editing from any copies of the card in different tabs
    $("section:not(#Created) .editJob").remove();
    // take away class to hide the new card
    setTimeout(function(){ $(".job[id='" + jobId + "']").removeClass("removing").parents(".flip-container").removeClass("preAdd"); }, 30);
  }

  var updateJobCard = function(jobCard, jobInfo)
  {
    var wasAssigned = jobCard.find(".isMe").length;
    var wasCompleted = jobCard.find(".status").hasClass("Complete");

    jobCard.find(".peopleCount").text((jobInfo.assigned ? Object.keys(jobInfo.assigned).length : 0) + "/" + jobInfo.people);
    jobCard.find(".duration").text(jobInfo.duration);
    jobCard.find(".due").text(jobInfo.due.split(",")[0]);
    jobCard.find(".front .card-content .card-title").text(jobInfo.title);
    jobCard.find(".frontDescription, .description").text(jobInfo.description);
    jobCard.find(".status").removeClass().addClass("status " + jobInfo.status.replace(/\s/g, "")).text(jobInfo.status).css("background-color", data.getStatusMap()[jobInfo.status].colour);
    jobCard.find(".skills").html((jobInfo.skills ? Object.keys(jobInfo.skills).map(function(skillName) { var skillInfo = data.getSkillsMap()[skillName]; return '<i class="material-icons tooltipped" data-position="bottom" data-tooltip="' + skillInfo.text + '">' + skillInfo.icon + '</i>'; }).join("") : ""));

    var peopleList = jobCard.find(".peopleList");
    var existingPeople = peopleList.find(".person:not('.assign')").remove()
    peopleList.prepend((jobInfo.assigned ? Object.keys(jobInfo.assigned).map(function(personId) { return factory.buildPerson(jobInfo.assigned[personId]); }).join("") : ""));
    existingPeople.remove();

    $(jobCard).get().map(function(item){ item.jobInfo = jobInfo; });

    var isCompleted = jobInfo.status == "Complete";
    var isCreated = jobInfo.createdBy.id == settings.user.id;

    if(isCreated)
    {
      jobCard = jobCard.not("#Created .job");
    }

    var jobKey = jobCard.get(0).id;
    jobCard = jobCard.parents(".flip-container");

    if(isCompleted && !wasCompleted)
    {
      positionJob(jobCard, jobInfo, "Completed");
      removeJob(jobKey, "Assigned, #OpenJobs");
      return;
    }
    else if(wasCompleted && !isCompleted)
    {
      removeJob(jobKey, "Completed");
    }

    if(wasAssigned && !jobCard.find(".isMe").length)
    {
      positionJob(jobCard, jobInfo, "OpenJobs");
    }
    else if(!wasAssigned && jobCard.find(".isMe").length)
    {
      positionJob(jobCard, jobInfo, "Assigned");
    }
    else
    {
      // still assigned
      positionJob(jobCard, jobInfo, jobCard.find(".isMe").length ? "Assigned" : "OpenJobs");
    }
  }

  var closeForm = function(e, override)
  {
    if (e.target !== this && ! override)
    {
      return;
    }

    var formCard = $(this).parents(".card-panel");

    if(formCard.length == 0)
    {
      formCard = $(".forms .card-panel");
    }

    formCard.eq(0).fadeOut(300, function(){ $(this).remove(); });
    $(".forms").fadeOut(300);
  }

  var assignSelf = function(e)
  {
    $(".material-tooltip").remove();
    var alreadyAssigned = $(this).siblings(".isMe").length || $(this).hasClass("isMe");

    var jobId = $(this).parents(".job").get(0).id;
    var assigned = $(this).parents(".job").get(0).jobInfo.assigned;

    if(alreadyAssigned)
    {
      //remove self
      $(".job[id=" + jobId + "] .isMe").tooltip("remove");
      $(".job[id=" + jobId + "] .isMe").tooltip({delay: 50});
      userInfo = firebase.firestore.FieldValue.delete();
      delete assigned[settings.user.id];
    }
    else
    {
      var userInfo = {
        id: settings.user.id,
        name: settings.user.name,
        pic: settings.user.pic
      };

      assigned[settings.user.id] = userInfo;
    }

    var countDiv = $(this).parents(".job").find(".peopleCount");
    var count = countDiv.text().split("/");
    count[0] = parseInt(count[0]) + (alreadyAssigned ? -1 : 1);

    countDiv.text(count.join("/"));

    var update = {
      assigned: assigned
    };

    db.collection("tables/jobs/" + settings.user.department).doc(jobId).update(update);

    if(alreadyAssigned)
    {
      $("#Assigned .job[id=" + jobId + "]").parents(".col").first().animate({opacity: 0}, 300, function(){ $(this).animate({width: 0}, 300, function(){$(this).remove(); countJobs(); }); });
    }
    else
    {
      $("#OpenJobs .job[id=" + jobId + "]").parents(".col").first().animate({opacity: 0}, 300, function(){ $(this).animate({width: 0}, 300, function(){$(this).remove(); countJobs(); }); });
    }

    e.stopImmediatePropagation();
  }

  var showToast = function(message, time, callback, actionName)
  {
    var toastContent = $('<span>message</span>');

    if(actionName)
    {
      toastContent.add($('<button class="btn-flat toast-action">' + actionName + '</button>'));
    }

    Materialize.toast(toastContent, time || 10000);
  }

  var makeDeptChoice = function(callback)
  {
    var choices = [
      {
        value: "Programmatic",
        image: "/images/programmatic.png",
        label: "Programmatic",
        colour: "cyan darken-2"
      },
      {
        value: "Search",
        image: "/images/search.png",
        label: "Search",
        colour: "amber darken-1"
      }
    ];

    var choiceDiv = factory.buildChoice("Which department are you?", choices);
    $(".forms").fadeIn(300).append(choiceDiv);

    $("#Choice").on("click", ".choiceOption", function(){
      $(".forms").fadeOut(300, function(){
        $("#Choice").remove();
      });

      callback(this.dataset.choiceVal);
    })
  }

  var flipCard = function()
  {
    $(this).parents(".flipper").toggleClass("flipped");
  }

  return{
    init: init,
    updateJob: updateJob,
    removeJob: removeJob,
    countJobs: countJobs,
    updateEmail: updateEmail,
    makeDeptChoice: makeDeptChoice
  }

}();
