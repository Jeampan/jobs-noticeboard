/*
*  Generic search script
*/

var search = function()
{
  var timeout;

  var setup = function(input, itemSelector)
  {
    input.on("keyup", go.bind(this, itemSelector));
  }

  var go = function(itemSelector, e)
  {
    clearTimeout(timeout);

    timeout = setTimeout(function()
    {
      var items = $(itemSelector).removeClass("failSearch");
      var searchTerm = $(e.target).val().toLowerCase();
      var toHide = [];

      for (var i = 0; i < items.length; i++)
      {
        if(items[i].innerText.toLowerCase().indexOf(searchTerm) == -1)
        {
          toHide.push(items[i]);
        }
      }

      $(toHide).addClass("failSearch");
    }, 300);
  }

  return{
    setup: setup
  }

}();
