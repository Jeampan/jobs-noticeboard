var errors = function()
{
  var db = function(error)
  {
    console.error(error);
  }

  return{
    db: db
  }
}();
