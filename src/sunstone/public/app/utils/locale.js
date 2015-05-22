define(function(require) {
  var MONTHS = new Array(
        tr("January"),tr("February"),tr("March"),tr("April"),tr("May"),
        tr("June"),tr("July"),tr("August"),tr("September"),tr("October"),
        tr("November"),tr("December"));

  function tr(str) {
    // TODO Add locale from the locale folder
    // var tmp = locale[str];
    var tmp;
    if (tmp == null || tmp == "") {
      tmp = str;
    }
    return tmp;
  };

  return {
    'tr': tr,
    'months': MONTHS
  }
});
