define(function(require) {
  var Locale = require('utils/locale');

  /*
    CONSTRUCTOR
   */

  return {
    'size': _size,
    'sizeFromB': _sizeFromB,
    'sizeFromKB': _sizeFromKB,
    'sizeFromMB': _sizeFromMB,
    'prettyDuration': _prettyDuration,
    'prettyTime': _prettyTime,
    'prettyTimeAxis': _prettyTimeAxis,
    'prettyPrintJSON': _prettyPrintJSON,
    'prettyTimeAgo': _format_date
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

  function _sizeFromB(value) {
    return _size(value, true);
  }

  function _sizeFromKB(value) {
    return _size(value);
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

  function _prettyDuration(duration) {
    var days = Math.floor(duration / 86400);
    duration -= days * 86400;

    var hours = Math.floor(duration / 3600) % 24;
    duration -= hours * 3600;

    var minutes = Math.floor(duration / 60) % 60;
    duration -= minutes * 60;

    var seconds = duration % 60;

    var str = "";
    if (days > 0) { str += days + 'd '};
    if (hours > 0) { str += hours + 'h '};
    str += minutes + 'm ';
    return str;
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

  // Returns an HTML string with the json keys and values
  // Attempts to css format output, giving different values to
  // margins etc. according to depth level etc.
  // See example of use in plugins.
  function _prettyPrintJSON(template_json, padding, weight, border_bottom, padding_top_bottom) {
    var str = ""
    if (!template_json) { return "Not defined";}
    if (!padding) {padding = 10};
    if (!weight) {weight = "none";}
    if (!border_bottom) {border_bottom = "0px solid #efefef";}
    if (!padding_top_bottom) {padding_top_bottom = 5;}
    var field = null;

    if (template_json.constructor == Array) {
      for (field = 0; field < template_json.length; ++field) {
        str += _prettyPrintRowJSON(field, template_json[field], padding, weight, border_bottom, padding_top_bottom);
      }
    } else {
      for (field in template_json) {
        str += _prettyPrintRowJSON(field, template_json[field], padding, weight, border_bottom, padding_top_bottom);
      }
    }
    return str;
  }

  function _prettyPrintRowJSON(field, value, padding, weight, border_bottom, padding_top_bottom) {
    var str = "";

    if (typeof value == 'object') {
      //name of field row
      str += '<tr>\
        <td class="key_td" style=\
            "padding-left:' + padding + 'px;\
             font-weight:' + weight + ';\
             border-bottom:' + border_bottom + ';\
             padding-top:' + padding_top_bottom + 'px;\
             padding-bottom:' + padding_top_bottom + 'px;">' +
          field +
        '</td>\
        <td class="value_td" style=\
            "border-bottom:' + border_bottom + ';\
             padding-top:' + padding_top_bottom + 'px;\
             padding-bottom:' + padding_top_bottom + 'px">\
        </td>\
      </tr>';
      //attributes rows
      //empty row - prettyprint - empty row
      str += _prettyPrintJSON(value, padding + 25, "normal", "0", 1);
    } else {
      str += '<tr>\
        <td class="key_td" style="\
            padding-left:' + padding + 'px;\
            font-weight:' + weight + ';\
            border-bottom:' + border_bottom + ';\
            padding-top:' + padding_top_bottom + 'px;\
            padding-bottom:' + padding_top_bottom + 'px">' +
          field +
        '</td>\
        <td class="value_td" style="\
            border-bottom:' + border_bottom + ';\
            padding-top:' + padding_top_bottom + 'px;\
            padding-bottom:' + padding_top_bottom + 'px">' +
          value +
        '</td>\
      </tr>';
    };

    return str;
  }

  function _format_date(unix_timestamp) {
    var difference_in_seconds = (Math.round((new Date()).getTime() / 1000)) - unix_timestamp,
        current_date = new Date(unix_timestamp * 1000), minutes, hours;

    if(difference_in_seconds < 60) {
      return difference_in_seconds + "s" + " ago";
    } else if (difference_in_seconds < 60*60) {
      minutes = Math.floor(difference_in_seconds/60);
      return minutes + "m" + " ago";
    } else if (difference_in_seconds < 60*60*24) {
      hours = Math.floor(difference_in_seconds/60/60);
      return hours + "h" + " ago";
    } else if (difference_in_seconds > 60*60*24){
      if(current_date.getYear() !== new Date().getYear())
        return current_date.getDay() + " " + Locale.months[current_date.getMonth()].substr(0,3) + " " + _fourdigits(current_date.getYear());
      else {
          return current_date.getDay() + " " + Locale.months[current_date.getMonth()].substr(0,3);
      }
    }

    return difference_in_seconds;

    function _fourdigits(number)  {
          return (number < 1000) ? number + 1900 : number;}

    //function _plural(number) {
    //  if(parseInt(number) === 1) {
    //    return "";
    //  }
    //  return "s";
    //}
  }
})
