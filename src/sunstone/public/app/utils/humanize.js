define(function(require) {
  /*
    Returns a human readable size in Kilo, Mega, Giga or Tera bytes
    if no from_bytes, assumes value comes in Ks
  */
  var _size = function(value, from_bytes, sufix) {
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

  var _sizeFromMB = function(value) {
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

  return {
    'size': _size,
    'sizeFromMB': _sizeFromMB
  }
})
