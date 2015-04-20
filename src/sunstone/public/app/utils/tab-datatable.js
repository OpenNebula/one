define(function(require) {
  require('foundation-datatables');
  var TemplateEmptyTable = require('hbs!./tab-datatable/empty-table');
  var Sunstone = require('sunstone');

  var SPINNER = '<img src="images/ajax-loader.gif" alt="retrieving" class="loading_img"/>';

  /* Set the defaults for DataTables initialisation */
  $.extend(true, $.fn.dataTable.defaults, {
    dom: "t<'row collapse'<'small-6 columns'i><'small-6 columns'lp>>",
    renderer: 'foundation',
    language: {
      "sLengthMenu": "_MENU_",
      "emptyTable": TemplateEmptyTable()
    }
  });

  //Shows run a custom action when clicking on rows.
  var _infoListener = function(dataTable, info_action, target_tab) {
    dataTable.on("click", 'tbody tr', function(e) {
      if ($(e.target).is('input') ||$(e.target).is('select') || $(e.target).is('option')) {
       return true;
     }

      var aData = dataTable.fnGetData(this);
      if (!aData) return true;
      var id = $(aData[0]).val();
      if (!id) return true;

      if (info_action) {
        //If ctrl is hold down, make check_box click
        if (e.ctrlKey || e.metaKey || $(e.target).is('input')) {
          $('.check_item', this).trigger('click');
        } else {
          if (!target_tab) {
            target_tab = $(dataTable).parents(".tab").attr("id");
          }
          Sunstone.showElement(target_tab, info_action, id);
        };
      } else {
        $('.check_item', this).trigger('click');
      };

      return false;
    });
  }

  //Wrapper to add an element to a dataTable
  var _addElement = function(element, dataTable) {
    dataTable.fnAddData(element);
  }

  //deletes an element with id 'tag' from a dataTable
  var _deleteElement = function(dataTable, tag) {
    var tr = $(tag, dataTable).parents('tr')[0];
    dataTable.fnDeleteRow(tr);
    recountCheckboxes(dataTable);

    var tab = dataTable.parents(".tab");
    if (Sunstone.rightInfoVisible(tab)) {
      $("a[href='back']", tab).click();
    }
  }

  //Add a listener to the check-all box of a datatable, enabling it to
  //check and uncheck all the checkboxes of its elements.
  var _initCheckAllBoxes = function(datatable, custom_context) {
    $('input.check_all', datatable).css({"border":"2px"});
    $('input.check_all', datatable).on("change", function() {
      var table = $(this).closest('.dataTables_wrapper');
      var checked = $(this).attr('checked');
      if (checked) { //check all
        $('tbody input.check_item', table).attr('checked', 'checked');
        $('td', table).addClass('markrowchecked');
      } else { //uncheck all
        $('tbody input.check_item', table).removeAttr('checked');
        $('td', table).removeClass('markrowchecked');
      };

      var context = custom_context || table.parents('.tab');
      _recountCheckboxes(table, context);
    });
  }

  //Handle the activation of action buttons and the check_all box
  //when elements in a datatable are modified.
  var _recountCheckboxes = function(dataTable, custom_context) {
    var table = $('tbody', dataTable);

    var context;
    if (custom_context) {
      context = custom_context;
    } else {
      context = table.parents('.tab');
      if ($(".right-info", context).is(':visible')) {
        return;
      }
    }

    var nodes = $('tr', table); //visible nodes
    var total_length = nodes.length;
    var checked_length = $('input.check_item:checked', nodes).length;
    var last_action_b = $('.last_action_button', context);

    if (checked_length) { //at least 1 element checked
      //enable action buttons
      $('.top_button, .list_button', context).attr('disabled', false);

      //enable checkall box
      if (total_length == checked_length) {
        $('.check_all', dataTable).attr('checked', 'checked');
      } else {
        $('.check_all', dataTable).removeAttr('checked');
      };
    } else { //no elements cheked
      //disable action buttons, uncheck checkAll
      $('.check_all', dataTable).removeAttr('checked');
      $('.top_button, .list_button', context).attr('disabled', true);
    };

    //any case the create dialog buttons should always be enabled.
    $('.create_dialog_button', context).attr('disabled', false);
    $('.alwaysActive', context).attr('disabled', false);
  }

  //Init action buttons and checkboxes listeners
  var _tableCheckboxesListener = function(dataTable, custom_context) {
    //Initialization - disable all buttons
    var context = custom_context || dataTable.parents('.tab');

    $('.last_action_button', context).attr('disabled', true);
    $('.top_button, .list_button', context).attr('disabled', true);
    //These are always enabled
    $('.create_dialog_button', context).attr('disabled', false);
    $('.alwaysActive', context).attr('disabled', false);

    //listen to changes in the visible inputs
    $('tbody input.check_item', dataTable).on("change", function() {
      var datatable = $(this).parents('table');

      if ($(this).is(":checked")) {
        $(this).parents('tr').children().each(function() {$(this).addClass('markrowchecked');});
      } else {
        $(this).parents('tr').children().removeClass('markrowchecked');
      }

      _recountCheckboxes(datatable, context);
    });
  }

  /*
   * onlyOneCheckboxListener: Only one box can be checked
   */

  var _onlyOneCheckboxListener = function(dataTable) {
    $('tbody input.check_item', dataTable).live("change", function() {
      var checked = $(this).is(':checked');
      $('td', dataTable).removeClass('markrowchecked');
      $('input.check_item:checked', dataTable).removeAttr('checked');
      $("td", $(this).closest('tr')).addClass('markrowchecked')
      $(this).attr('checked', checked);
    });
  }

  // Updates a data_table, with a 2D array containing the new values
  // Does a partial redraw, so the filter and pagination are kept
  var _updateView = function(item_list, dataTable) {
    var selected_row_id = null;
    var checked_row_ids = new Array();

    var row_id_index = dataTable.attr("row_id");

    if (row_id_index != undefined) {
      $.each($(dataTable.fnGetNodes()), function() {
        if ($('td.markrow', this).length != 0) {
          var aData = dataTable.fnGetData(this);

          selected_row_id = aData[row_id_index];

        }
      });
    }

    $.each($(dataTable.fnGetNodes()), function() {
      if ($('td.markrowchecked', this).length != 0) {
        if (!isNaN($($('td', $(this))[1]).html())) {
          checked_row_ids.push($($('td', $(this))[1]).html());
        } else {
          checked_row_ids.push($($('td', $(this))[0]).html());
        }
      }
    });

    // dataTable.fnSettings is undefined when the table has been detached from
    // the DOM

    if (dataTable && dataTable.fnSettings()) {
      var dTable_settings = dataTable.fnSettings();
      var prev_start = dTable_settings._iDisplayStart;

      dataTable.fnClearTable(false);

      if (item_list.length > 0) {
        dataTable.fnAddData(item_list, false);
      }

      var new_start = prev_start;

      if (new_start > item_list.length - 1) {
        if (item_list.length > 0)
            new_start = item_list.length - 1;
        else
            new_start = 0;
      }

      dTable_settings.iInitDisplayStart = new_start;

      dataTable.fnDraw(true);
    };

    if (selected_row_id != undefined) {
      $.each($(dataTable.fnGetNodes()), function() {

        var aData = dataTable.fnGetData(this);

        if (aData[row_id_index] == selected_row_id) {
          $('td', this)[0].click();
        }
      });
    }

    if (checked_row_ids.length != 0) {
      $.each($(dataTable.fnGetNodes()), function() {
        var current_id = $($('td', this)[1]).html();

        if (isNaN(current_id)) {
          current_id = $($('td', this)[0]).html();
        }

        if (current_id) {
          if (jQuery.inArray(current_id, checked_row_ids) != -1) {
            $('input.check_item', this).first().click();
            $('td', this).addClass('markrowchecked');
          }
        }
      });
    }
  }

  //replaces an element with id 'tag' in a dataTable with a new one
  var _updateSingleElement = function(element, dataTable, tag) {
    // fnGetData should be used instead, otherwise it depends on the visible columns
    var nodes = dataTable.fnGetNodes();
    var tr = $(tag, nodes).parents('tr')[0];
    if (tr) {
      var checked_val = $('input.check_item', tr).attr('checked');
      var position = dataTable.fnGetPosition(tr);
      dataTable.fnUpdate(element, position, undefined, false);
      $('input.check_item', tr).attr('checked', checked_val);
      _recountCheckboxes(dataTable);
    }
  }

  var _getElementData = function(id, resource_tag, dataTable) {
    var nodes = dataTable.fnGetNodes();
    var tr = $(resource_tag + '_' + id, nodes).parents('tr')[0];
    return dataTable.fnGetData(tr);
  }

  var _waitingNodes = function(dataTable) {
    $('tr input.check_item:visible', dataTable).replaceWith(SPINNER);
  }

  return {
    'infoListener': _infoListener,
    'addElement': _addElement,
    'deleteElement': _deleteElement,
    'initCheckAllBoxes': _initCheckAllBoxes,
    'recountCheckboxes': _recountCheckboxes,
    'tableCheckboxesListener': _tableCheckboxesListener,
    'onlyOneCheckboxListener': _onlyOneCheckboxListener,
    'updateView': _updateView,
    'updateSingleElement': _updateSingleElement,
    'getElementData': _getElementData,
    'waitingNodes': _waitingNodes
  }
})
