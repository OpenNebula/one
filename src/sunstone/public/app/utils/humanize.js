define(function(require) {
  /*
    CONSTRUCTOR
   */

  return {
    'size': _size,
    'sizeFromMB': _sizeFromMB,
    'prettyTime': _prettyTime,
    'prettyTimeAxis': _prettyTimeAxis
  }

  /*
    FUNCTION DEFINITIONS
   */
  
  /*
    Returns a human readable size in Kilo, Mega, Giga or Tera bytes
    if no from_bytes, assumes value comes in Ks
  */
  function _size(value, from_bytes, sufix) {
    if (typeof(value) === "undefined") {
      value = 0;
    }
    var binarySufix = ["", "K", "M", "G", "T"];

    var i = from_bytes ? 0 : 1;
    while (value >= 1024 && i < 4) {
      value = value / 1024;
      i++;
    }
    value = Math.round(value * 10) / 10;

    if (value - Math.round(value) == 0) {
      value = Math.round(value);
    }

    if (sufix == undefined) {
      sufix = "B";
    }

    var st = value + binarySufix[i] + sufix;
    return st;
  }

  function _sizeFromMB(value) {
    if (typeof(value) === "undefined") {
      value = 0;
    }
    var binarySufix =  ["MB", "GB", "TB"];
    var i = 0;
    while (value >= 1024 && i < 2) {
      value = value / 1024;
      i++;
    }
    value = Math.round(value * 10) / 10;

    if (value - Math.round(value) == 0) {
      value = Math.round(value);
    }

    var st = value + binarySufix[i];
    return st;
  }

  //introduces 0s before a number until in reaches 'length'.
  function _pad(number, length) {
    var str = '' + number;
    while (str.length < length)
        str = '0' + str;
    return str;
  }

  //turns a Unix-formatted time into a human readable string
  function _prettyTime(seconds) {
    var d = new Date();
    d.setTime(seconds * 1000);

    var secs = _pad(d.getSeconds(), 2);
    var hour = _pad(d.getHours(), 2);
    var mins = _pad(d.getMinutes(), 2);
    var day = _pad(d.getDate(), 2);
    var month = _pad(d.getMonth() + 1, 2); //getMonths returns 0-11
    var year = d.getFullYear();

    return hour + ":" + mins + ":" + secs + " " + day + "/" + month + "/" + year;
  }

  // Format time for plot axis
  // If show date, only date information is shown
  function _prettyTimeAxis(time, show_date) {
    var d = new Date();
    d.setTime(time * 1000);

    var secs = _pad(d.getSeconds(), 2);
    var hour = _pad(d.getHours(), 2);
    var mins = _pad(d.getMinutes(), 2);
    var day = _pad(d.getDate(), 2);
    var month = _pad(d.getMonth() + 1, 2); //getMonths returns 0-11
    var year = d.getFullYear();

    if (show_date)
        return day + "/" + month;
    else
        return hour + ":" + mins;
  }
})
