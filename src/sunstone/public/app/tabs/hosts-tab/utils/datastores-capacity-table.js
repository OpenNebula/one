define(function(require){
  /*
    DEPENDENCIES
   */

  var DatastoreCapacityBar = require('tabs/datastores-tab/utils/datastore-capacity-bar');

  /*
    TEMPLATES
   */

  var TemplateDatastoresCapacityTable = require('hbs!./datastore-capacity-table/html');

  /*
    CONSTRUCTOR
   */

  return {
    'html': _html
  }

  /*
    FUNCTION DEFINITIONS
   */

  function _html(element) {
    var hostShare = element.HOST_SHARE;

    var datastores = []
    if ($.isArray(hostShare.DATASTORES.DS))
      datastores = hostShare.DATASTORES.DS
    else if (!$.isEmptyObject(hostShare.DATASTORES.DS))
      datastores = [hostShare.DATASTORES.DS]
    else
      return "";

    var datastoreBars = [];
    $.each(datastores, function(index, value){
      datastoreBars.push({
        'datastoreId': value.ID,
        'datastoreBar': DatastoreCapacityBar.html(value)
      })
    });

    return TemplateDatastoresCapacityTable({'datastoreBars': datastoreBars});
  }
});