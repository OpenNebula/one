define(function(require) {
  var tr = function (str) {
    // TODO Add locale from the locale folder
    // var tmp = locale[str];
    var tmp;
    if (tmp == null || tmp == "") {
      tmp = str;
    }
    return tmp;
  };

  return {
    'tr': tr
  }
});
