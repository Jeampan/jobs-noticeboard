/*
*  Really doesn't need a summary
*  replace with another collection of images if you like
*/

var mountains = function()
{
  var images = [
    "QTNZ.png",
    "MSNZ.png",
    "LTNZ.png",
    "MCNZ.png",
    "TCNZ.png",
    "FGNZ.png",
    "MABA.png",
    "WANZ.png",
    "APNZ.png"
  ]

  var getRandom = function()
  {
    var rand = Math.floor(Math.random() * images.length);

    return images[rand];
  }

  return{
    getRandom: getRandom
  }

}();
