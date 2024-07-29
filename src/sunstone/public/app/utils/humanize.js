/* -------------------------------------------------------------------------- */
/* Copyright 2002-2024, OpenNebula Project, OpenNebula Systems                */
/*                                                                            */
/* Licensed under the Apache License, Version 2.0 (the "License"); you may    */
/* not use this file except in compliance with the License. You may obtain    */
/* a copy of the License at                                                   */
/*                                                                            */
/* http://www.apache.org/licenses/LICENSE-2.0                                 */
/*                                                                            */
/* Unless required by applicable law or agreed to in writing, software        */
/* distributed under the License is distributed on an "AS IS" BASIS,          */
/* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.   */
/* See the License for the specific language governing permissions and        */
/* limitations under the License.                                             */
/* -------------------------------------------------------------------------- */

define(function(require) {
  var Locale = require('utils/locale');
  var TemplateUtils = require('utils/template-utils');
  var resource_states = {
    IMAGES:{
      CLONE:"#4DBBD3",
      INIT:"#4DBBD3",
      READY:"#3adb76",
      USED:"#3adb76",
      ERROR:"#ec5840",
      DELETE:"#ec5840",
      LOCKED:"lightsalmon",
      DISABLED:"lightsalmon"
    },
    HOST:{
      INIT:"#4DBBD3",
      ON:"#3adb76",
      OFF:"#ec5840",
      DISABLED:"lightsalmon"
    },
    DATASTORE:{
      INIT:"#4DBBD3",
      READY:"#3adb76",
      DISABLED:"lightsalmon"
    },
    MARKETPLACEAPP:{
      INIT:"#4DBBD3",
      READY:"#3adb76",
      LOCKED:"lightsalmon",
      ERROR:"#ec5840",
      DISABLED:"lightsalmon"
    },
    VM:{
      INIT:"#4DBBD3",
      PENDING:"#4DBBD3",
      HOLD:"lightsalmon",
      ACTIVE:"#3adb76",
      STOPPED:"lightsalmon",
      SUSPENDED:"lightsalmon",
      DONE:"#ec5840",
      FAILED:"#ec5840",
      POWEROFF:"lightsalmon",
      UNDEPLOYED:"lightsalmon",
      CLONING:"#4DBBD3",
      CLONING_FAILURE:"#ec5840"
    }
  };

  var week_days_str = [
    "Sun",
    "Mon",
    "Tue",
    "Wed",
    "Thu",
    "Fri",
    "Sat"
  ];

  /*
    CONSTRUCTOR
   */

  return {
    'size': _size,
    'sizeFromB': _sizeFromB,
    'sizeFromKB': _sizeFromKB,
    'sizeFromMB': _sizeFromMB,
    'sizeFromMBArray': _sizeFromMBArray,
    'sizeToMB': _sizeToMB,
    'prettyDuration': _prettyDuration,
    'prettyTime': _prettyTime,
    'prettyTimeAxis': _prettyTimeAxis,
    'prettyPrintJSON': _prettyPrintJSON,
    'prettyTimeAgo': _format_date,
    'prettyTimeDatatable': _prettyTimeDatatable,
    'lock_to_str': _lock_to_str,
    'state_lock_to_color': _state_lock_to_color,
    'week_days': _week_days
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

  function _sizeFromMBArray(value) {
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

    var st = [value, binarySufix[i]];
    return st;
  }

  function _sizeToMB(value){
    var split = value.split("B");
    var factor = split[0].slice(-1);
    var number = parseFloat(split[0]);
    if(factor=="K")
      number = number / 1024;
    else if(factor=="G")
      number = number * 1024;
    else if(factor=="T")
      number = number * 1024 * 1024;
    return number;
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
          TemplateUtils.htmlEncode(field) +
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
          TemplateUtils.htmlEncode(field) +
        '</td>\
        <td class="value_td" style="\
            border-bottom:' + border_bottom + ';\
            padding-top:' + padding_top_bottom + 'px;\
            padding-bottom:' + padding_top_bottom + 'px">' +
          TemplateUtils.htmlEncode(value) +
        '</td>\
      </tr>';
    };

    return str;
  }

  function _prettyTimeDatatable(seconds) {
    var d = new Date();
    d.setTime(seconds * 1000);

    var secs = _pad(d.getSeconds(), 2);
    var hour = _pad(d.getHours(), 2);
    var mins = _pad(d.getMinutes(), 2);
    var day = _pad(d.getDate(), 2);
    var month = _pad(d.getMonth() + 1, 2); //getMonths returns 0-11
    var year = d.getFullYear();

    return day + "/" + month + "/" + year + " " + hour + ":" + mins + ":" + secs;
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
      return (number < 1000) ? number + 1900 : number;
    }


    //function _plural(number) {
    //  if(parseInt(number) === 1) {
    //    return "";
    //  }
    //  return "s";
    //}
  }
  function _lock_to_str(level)  {
    var level_str = "";
    switch(level) {
      case "1":
        level_str = "Use";
        break;
      case "2":
        level_str = "Manage";
        break;
      case "3":
        level_str = "Admin";
        break;
      case "4":
        level_str = "All";
        break;
    }
    return level_str;
  }

  function _state_lock_to_color(resource,state,lock){
    var color = "transparent";
    var show_lock = "";

    if (state && resource in resource_states){
      var available_states = resource_states[resource];
      if (state in available_states){
        color = available_states[state];
      }
    }

    if (lock){
      show_lock = "border-left: 3px solid #373537;";
    }

    return '<span style="'+show_lock+' float:left; margin-right: 3px; width: 5px; height: 20px; background: '+color+';"></span>'
  }

  function _week_days(days){
      var days = days.split(",");
      var str = "";
      days.forEach(function(day){
        str += week_days_str[day] + ",";
      });
      return str.slice(0, -1);
  }
})
