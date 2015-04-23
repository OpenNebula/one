define(function(require) {
  var _quotaBarHtml = function(usage, limit, info_str, not_html) {
    percentage = 0;

    if (limit > 0) {
      percentage = Math.floor((usage / limit) * 100);

      if (percentage > 100) {
        percentage = 100;
      }
    } else if (limit == 0 && usage > 0) {
      percentage = 100;
    }

    info_str = info_str || (usage + ' / ' + ((limit >= 0) ? limit : '-'));

    if (not_html) {
      return {
        "percentage": percentage,
        "str": info_str
      }
    } else {
      html = '<span class="progress-text right" style="font-size: 12px">' + info_str + '</span><br><div class="progress radius" style="height: 10px; margin-bottom:0px"><span class="meter" style="width: '          + percentage + '%"></div>';

      return html;
    }
  }

  return {
    'html': _quotaBarHtml
  }
})
