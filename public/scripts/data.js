/*
*  Any collections of data that are used frequently
*/

var data = function()
{
  var _skills;
  var _skillsMap = {};
  var _statuses;
  var _statusMap = {};

  var getSkillsMap = function()
  {
    return _skillsMap;
  }

  var getStatusMap = function()
  {
    return _statusMap;
  }

  var getSkills = function()
  {
    if(_skills)
    {
      return _skills;
    }

    var skills = db.collection("tables/skills/" + settings.user.department).orderBy("text", "asc").get().then(function(snapshot)
    {
      var skillsArr = [];

      snapshot.forEach(function(doc)
      {
          var skill = doc.data();
          skillsArr.push(skill);
          _skillsMap[skill.value] = skill;
      });

      _skills = skillsArr;
      return skillsArr;
    });

    return skills;
  }

  var getJobStatuses = function()
  {
    if(_statuses)
    {
      return _statuses;
    }

    var statuses = db.collection("tables/statuses/" + settings.user.department).orderBy("text", "asc").get().then(function(snapshot)
    {
      var statusesArr = [];

      snapshot.forEach(function(doc)
      {
          var status = doc.data();
          statusesArr.push(status);
          _statusMap[status.value] = status;
      });

      _statuses = statusesArr;
      return statusesArr;
    });

    return statuses;
  }

  return{
    getSkills: getSkills,
    getSkillsMap: getSkillsMap,
    getJobStatuses: getJobStatuses,
    getStatusMap: getStatusMap
  }

}();
