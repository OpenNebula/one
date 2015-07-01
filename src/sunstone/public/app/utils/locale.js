define(function(require) {
  var LANGUAGE_OPTIONS =
    '<option value="en_US">English (en_US)</option>\
    <option value="ca">Catalan (ca)</option>\
    <option value="cs_CZ">Czech (cs_CZ)</option>\
    <option value="nl_NL">Dutch (nl_NL)</option>\
    <option value="da">Danish (da)</option>\
    <option value="fr_FR">French (fr_FR)</option>\
    <option value="de">German (de)</option>\
    <option value="el_GR">Greek (el_GR)</option>\
    <option value="it_IT">Italian (it_IT)</option>\
    <option value="ja">Japanese (ja)</option>\
    <option value="lt_LT">Lithuanian (lt_LT)</option>\
    <option value="fa_IR">Persian (fa_IR)</option>\
    <option value="pl">Polish (pl)</option>\
    <option value="pt_BR">Portuguese (pt_BR)</option>\
    <option value="pt_PT">Portuguese (pt_PT)</option>\
    <option value="ru_RU">Russian (ru_RU)</option>\
    <option value="zh_CN">Simplified Chinese (zh_CN)</option>\
    <option value="sk_SK">Slovak (sk_SK)</option>\
    <option value="es_ES">Spanish (es_ES)</option>\
    <option value="zh_TW">Traditional Chinese (zh_TW)</option>';

  var MONTHS = new Array(
        tr("January"), tr("February"), tr("March"), tr("April"), tr("May"),
        tr("June"), tr("July"), tr("August"), tr("September"), tr("October"),
        tr("November"), tr("December"));

  function tr(str) {
    var tmp = locale[str];
    if (tmp == null || tmp == "") {
      tmp = str;
    }
    return tmp;
  };

  return {
    'tr': tr,
    'months': MONTHS,
    'language_options': LANGUAGE_OPTIONS
  }
});
