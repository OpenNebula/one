define(function(require) {
  var EXTERNAL_IPS_ATTRS = [
    'GUEST_IP',
    'AWS_IP_ADDRESS',
    'AZ_IPADDRESS',
    'SL_PRIMARYIPADDRESS'
  ]

  /*
    CONSTRUCTOR
   */

  return {
    'size': _size,
    'sizeFromB': _sizeFromB,
    'sizeFromKB': _sizeFromKB,
    'sizeFromMB': _sizeFromMB,
    'prettyTime': _prettyTime,
    'prettyTimeAxis': _prettyTimeAxis,
    'prettyPrintJSON': _prettyPrintJSON,
    'ipsStr': _ipsStr
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
    if (!weight) {weight = "bold";}
    if (!border_bottom) {border_bottom = "1px solid #efefef";}
    if (!padding_top_bottom) {padding_top_bottom = 6;}
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

  // Return the IP or several IPs of a VM
  function _ipsStr(vm, divider) {
    var divider = divider || "<br>"
    var nic = vm.TEMPLATE.NIC;
    var ips = [];

    if (nic != undefined) {
      if (!$.isArray(nic)) {
        nic = [nic];
      }

      $.each(nic, function(index, value) {
        if (value.IP) {
          ips.push(value.IP);
        }

        if (value.IP6_GLOBAL) {
          ips.push(value.IP6_GLOBAL);
        }

        if (value.IP6_ULA) {
          ips.push(value.IP6_ULA);
        }
      });
    }

    var template = vm.TEMPLATE;
    var externalIP;
    $.each(EXTERNAL_IPS_ATTRS, function(index, IPAttr) {
      externalIP = template[IPAttr];
      if (externalIP && ($.inArray(externalIP, ips) == -1)) {
        ips.push(externalIP);
      }
    })

    if (ips.length > 0) {
      return ips.join(divider);
    } else {
      return '--';
    }
  };
})
