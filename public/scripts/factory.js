/*
*  This class is used to create repeated html strings
*  with varying data
*/

var factory = function()
{
  var _skillsMap = {};

  var skillsMap = function()
  {
    console.log(_skillsMap);
    if(!Object.keys(_skillsMap).length)
    {
      getSkills();
    }

    return _skillsMap;
  }

  var buildJobCard = function(key, jobInfo)
  {
    jobInfo.pic = jobInfo.pic || "/images/QTNZ.png";
    var template = '<div class="flip-container"><div class="flipper job hoverable" id="' + key + '"><div class="card horizontal front">' +
      '<div class="card-image">' +
        '<img src="' + jobInfo.pic + '">' +
        '<div class="people">' +
          '<i class="material-icons">person_pin</i>' +
          '<div class="peopleCount">' + (jobInfo.assigned ? Object.keys(jobInfo.assigned).length : 0) + "/" + jobInfo.people + '</div>' +
        '</div>' +
        '<div class="duration">' + jobInfo.duration + '</div>' +
        '<div class="due">due:<br/>' + jobInfo.due.split(",")[0] + '</div>' +
      '</div>' +
      '<div class="card-stacked card">' +
      '<div class="card-reveal">' +
        '<p class="description">' + jobInfo.description + '</p>' +
        '<div class="card-action peopleList">' +
          (jobInfo.assigned ? Object.keys(jobInfo.assigned).map(function(personId) { return buildPerson(jobInfo.assigned[personId]); }).join("") : "") +
          '<div class="person assign"><i class="material-icons right">add_circle_outline</i></div>' +
        '</div>' +
        '<i class="material-icons card-title">close</i>' +
      '</div>' +
        '<div class="moreInfo"><i class="material-icons">info_outline</i></div>' +
        '<div class="card-content activator">' +
          '<span class="card-title grey-text text-darken-4 activator">' + jobInfo.title + '</span>' +
          '<p class="frontDescription activator">' + jobInfo.description.substring(0,200) + '</p>' +
        '</div>' +
        '<div class="card-action activator">' +
          '<div class="skills">' +
            (jobInfo.skills ? Object.keys(jobInfo.skills).map(function(skillName) { var skillInfo = data.getSkillsMap()[skillName]; return '<i class="material-icons tooltipped" data-position="bottom" data-tooltip="' + skillInfo.text + '">' + skillInfo.icon + '</i>'; }).join("") : "") +
          '</div>' +
        '<div class="status ' + jobInfo.status.replace(/\s/g, "") + '" style="background-color:' + data.getStatusMap()[jobInfo.status].colour + ';">' + jobInfo.status + '</div>' +
        '</div>' +
      '</div>' +
      '<i class="material-icons editJob">create</i>' +
    '</div>' +
    '<div class="card back blue darken-3">' +
      '<label>Created By</label>' +
      '<div class="createdBy">' + jobInfo.createdBy.name + '</div>' +
      '<div class="createdAt">' + (new Date(jobInfo.created).toLocaleString()) + '</div>' +
      '<a class="addTrello" target="_blank" href="https://trello.com/add-card?url=https://jobs-noticeboard.firebaseapp.com/&name=' + encodeURIComponent(jobInfo.title) + '&desc=' + encodeURIComponent(jobInfo.description) +'"><span></span></a>' +
      '<div class="moreInfo"><i class="material-icons">reply</i></div>' +
    '</div>' +
    '</div></div>';

    return template;
  }

  var buildNewJobForm = function()
  {
    var template = '<div id="NewJob" class="card-panel">' +
          '<div class="row"><i class="material-icons right closeForm">close</i></div>' +
          '<div class="row"><form class="col s12" name="NewJob">' +
            '<div class="row">' +
              [
                buildInput("Title", "Title", "col s12"),
                buildTextArea("Description", "Description", "col s12"),
                buildDatePicker("Due", "Due", "col s12"),
                buildInput("Duration", "Duration", "col s12"),
                buildRange("People", "People Needed", "col s12", 1, 10, 1),
                buildSelect("Status", "Status", "col s12", data.getJobStatuses()),
                buildSelect("Skills", "Skills", "col s12", data.getSkills(), true)
              ].join("") +
            '</div>' +
          '<div class="row">' +
            '<div class="formButtons col s12">' +
              '<button class="btn waves-effect waves-light blue darken-3" type="submit" name="send">Submit' +
              '<i class="material-icons right">send</i>' +
              '</button>' +
              '<button class="btn waves-effect waves-light red darken-2" name="delete" id="Delete">Delete' +
              '<i class="material-icons right">delete</i>' +
              '</button>' +
            '</div>' +
          '</div>' +
          '</div></form>' +
        '</div>';

    return template;
  }

  var buildInput = function(id, label, className)
  {
    var template = '<div class="input-field ' + className + '">' +
                    '<input id="' + id + '" type="text" name="' + id.toLowerCase() + '">' +
                    '<label for="' + id + '">' + label + '</label>' +
                  '</div>';

    return template;
  }

  var buildTextArea = function(id, label, className)
  {
    var template = '<div class="input-field ' + className + '">' +
                    '<textarea class="materialize-textarea" id="' + id + '" name="' + id.toLowerCase() + '"></textarea>' +
                    '<label for="' + id + '">' + label + '</label>' +
                  '</div>';

    return template;
  }

  var buildDatePicker = function(id, label, className)
  {
    var template = '<div class="input-field ' + className + '">' +
                    '<label for="' + id + '">' + label + '</label>' +
                    '<input type="text" class="datepicker" id="' + id + '" name="' + id.toLowerCase() + '">' +
                  '</div>';

    return template;
  }

  var buildRange = function(id, label, className, min, max, defaultValue)
  {
    defaultValue = (defaultValue || 1);

    var template =  '<div class="' + className + '">' +
                      '<label for="' + id + '">' + label + '</label>' +
                      '<output id="' + id + 'Output">' + defaultValue + '</output>' +
                      '<p class="range-field">' +
                        '<input type="range" id="' + id + '" name="' + id.toLowerCase() + '" min="' + (min || 0) + '" max="' + (max || 10) + '" value="' + defaultValue + '" oninput="' + id + 'Output.value =' + id + '.value"/>' +
                      '</p>' +
                    '</div>';

    return template;
  }

  var buildSelect = function(id, label, className, options, multiple)
  {
    var template = '<div class="input-field ' + className + '">' +
                    '<select id="' + id + '" name="' + id.toLowerCase() + '" ' + (multiple ? "multiple" : "") + '>';

    for(var i = 0; i < options.length; i++)
    {
      var option = options[i];
      template+= '<option value="' + option.value + '"' + (option.disabled ? 'disabled ' : ' ') + (option.selected ? 'selected' : '' + '>') + option.text + '</option>';
    }

    template += '</select>' +
                '<label for="' + id + '">' + label + '</label>' +
                '</div>';

    return template;
  }

  var buildPerson = function(personInfo)
  {
    if(!personInfo)
    {
      template = "";
    }

    var className = personInfo.id == settings.user.id ? "person tooltipped isMe" : "person tooltipped";
    var template = '<div class="' + className + '" data-position="bottom" data-tooltip="' + personInfo.name + '" data-id="' + personInfo.id + '"><img src="' + personInfo.pic + '" alt="' + personInfo.name + '"></div>';

    return template;
  }

  var buildChoice = function(question, choices)
  {
    var choiceDiv = '<div id="Choice" class="card-panel"><div class="choiceQuestion">' + question + '</div>';

    for(var i = 0; i < choices.length; i++)
    {
      var choice = choices[i];
      choiceDiv+= '<div class="choiceOption" data-choice-val="' + choice.value + '">' +
      '<div class="choiceImage" style="background-image:url(\'' + choice.image + '\')"></div>' +
      '<a class="waves-effect waves-light btn choiceLabel ' + choice.colour + '">' + choice.label + '</a>' +
      '</div>';
    }

    choiceDiv+= '</div>';

    return choiceDiv;
  }

  return{
    buildJobCard: buildJobCard,
    buildNewJobForm: buildNewJobForm,
    buildPerson: buildPerson,
    buildChoice: buildChoice
  }

}();
