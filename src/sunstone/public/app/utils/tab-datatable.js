define(function(require) {
  /*
    DEPENDENCIES
   */
  
  require('foundation-datatables');
  var TemplateEmptyTable = require('hbs!./tab-datatable/empty-table');
  var Sunstone = require('sunstone');
  var SunstoneConfig = require('sunstone-config');

  /*
    TEMPLATES
   */
  
  var TemplateDataTableHTML = require('hbs!./tab-datatable/table');
  var TemplateSearchInputHTML = require('hbs!./tab-datatable/search-input');

  /*
    CONSTANTS
   */
  
  var SPINNER = '<img src="images/ajax-loader.gif" alt="retrieving" class="loading_img"/>';

  /*
    GLOBAL INITIALIZATION
   */
  
  /* Set the defaults for DataTables initialisation */
  $.extend(true, $.fn.dataTable.defaults, {
    dom: "t<'row collapse'<'small-6 columns'i><'small-6 columns'lp>>",
    renderer: 'foundation',
    language: {
      "sLengthMenu": "_MENU_",
      "emptyTable": TemplateEmptyTable()
    }
  });

  /*
    CONSTRUCTOR
   */

  function TabDatatable() {
    // Child class must define:
    //    dataTableId
    //    resource
    //    dataTableOptions
    //    columns
    
    this.dataTableHTML = TemplateDataTableHTML({'dataTableId': this.dataTableId, 'columns': this.columns});
    this.searchInputHTML = TemplateSearchInputHTML({'dataTableSearchId': this.dataTableId + 'Search'});

    return this;
  }

  TabDatatable.prototype = {
    'initialize': _initialize,
    'initCheckAllBoxes': _initCheckAllBoxes,
    'tableCheckboxesListener': _tableCheckboxesListener,
    'infoListener': _infoListener,
    'addElement': _addElement,
    'deleteElement': _deleteElement,
    'updateElement': _updateElement,
    'elements': _elements,
    'updateView': _updateView,
    'getElementData': _getElementData,
    'waitingNodes': _waitingNodes,
    'recountCheckboxes': _recountCheckboxes,
  }

  return TabDatatable;

  /*
    FUNCTION DEFINITIONS
   */

  function _initialize() {
    this.dataTable = $('#' + this.dataTableId).dataTable(this.dataTableOptions);

    var that = this; 
    $('#' + this.dataTableId + 'Search').keyup(function() {
      that.dataTable.fnFilter($(this).val());
    })

    this.dataTable.on('draw', function() {
      that.recountCheckboxes(that.dataTable);
    })

    this.initCheckAllBoxes();
    this.tableCheckboxesListener();
    this.infoListener(this.resource + ".show");
    this.dataTable.fnSort([[1, SunstoneConfig.tableOrder]]);
  }

  //Shows run a custom action when clicking on rows.
  function _infoListener(info_action, target_tab) {
    var that = this;
    this.dataTable.on("click", 'tbody tr', function(e) {
      if ($(e.target).is('input') || $(e.target).is('select') || $(e.target).is('option')) {
        return true;
      }

      var aData = that.dataTable.fnGetData(this);
      if (!aData) return true;
      var id = $(aData[0]).val();
      if (!id) return true;

      if (info_action) {
        //If ctrl is hold down, make check_box click
        if (e.ctrlKey || e.metaKey || $(e.target).is('input')) {
          $('.check_item', this).trigger('click');
        } else {
          if (!target_tab) {
            target_tab = $(that.dataTable).parents(".tab").attr("id");
          }
          Sunstone.showElement(target_tab, info_action, id);
        };
      } else {
        $('.check_item', this).trigger('click');
      };

      return false;
    });
  }

  //call back for actions creating a zone element
  function _addElement(request, element_json) {
    var element = this.elementArray(element_json);
    this.dataTable.fnAddData(element);
  }

  //deletes an element with id 'tag' from a dataTable
  function _deleteElement(req) {
    var tag = '#' + this.resource.toLowerCase() + '_' + req.request.data;
    var tr = $(tag, this.dataTable).parents('tr')[0];
    this.dataTable.fnDeleteRow(tr);
    this.recountCheckboxes();

    var tab = this.dataTable.parents(".tab");
    if (Sunstone.rightInfoVisible(tab)) {
      $("a[href='back']", tab).click();
    }
  }

  //Add a listener to the check-all box of a datatable, enabling it to
  //check and uncheck all the checkboxes of its elements.
  function _initCheckAllBoxes(custom_context) {
    var that = this;
    this.dataTable.on("change", '.check_all', function() {
      var table = $(this).closest('.dataTables_wrapper');
      if ($(this).is(":checked")) { //check all
        $('tbody input.check_item', table).attr('checked', 'checked');
        $('td', table).addClass('markrowchecked');
      } else { //uncheck all
        $('tbody input.check_item', table).removeAttr('checked');
        $('td', table).removeClass('markrowchecked');
      };

      var context = custom_context || table.parents('.tab');
      that.recountCheckboxes(context);
    });
  }

  //Handle the activation of action buttons and the check_all box
  //when elements in a datatable are modified.
  function _recountCheckboxes(custom_context) {
    var table = $('tbody', this.dataTable);

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
        $('.check_all', this.dataTable).attr('checked', 'checked');
      } else {
        $('.check_all', this.dataTable).removeAttr('checked');
      };
    } else { //no elements cheked
      //disable action buttons, uncheck checkAll
      $('.check_all', this.dataTable).removeAttr('checked');
      $('.top_button, .list_button', context).attr('disabled', true);
    };

    //any case the create dialog buttons should always be enabled.
    $('.create_dialog_button', context).attr('disabled', false);
    $('.alwaysActive', context).attr('disabled', false);
  }

  //Init action buttons and checkboxes listeners
  function _tableCheckboxesListener(custom_context) {
    //Initialization - disable all buttons
    var context = custom_context || this.dataTable.parents('.tab');

    $('.last_action_button', context).attr('disabled', true);
    $('.top_button, .list_button', context).attr('disabled', true);
    //These are always enabled
    $('.create_dialog_button', context).attr('disabled', false);
    $('.alwaysActive', context).attr('disabled', false);

    //listen to changes in the visible inputs
    var that = this;
    this.dataTable.on("change", 'tbody input.check_item', function() {
      var datatable = $(this).parents('table');

      if ($(this).is(":checked")) {
        $(this).parents('tr').children().addClass('markrowchecked');
      } else {
        $(this).parents('tr').children().removeClass('markrowchecked');
      }

      that.recountCheckboxes(context);
    });
  }

  /*
   * onlyOneCheckboxListener: Only one box can be checked
   */

  function _onlyOneCheckboxListener() {
    var that = this;
    this.dataTable.on("change", 'tbody input.check_item', function() {
      var checked = $(this).is(':checked');
      $('td', that.dataTable).removeClass('markrowchecked');
      $('input.check_item:checked', that.dataTable).removeAttr('checked');
      $("td", $(this).closest('tr')).addClass('markrowchecked')
      $(this).attr('checked', checked);
    });
  }

  // Updates a data_table, with a 2D array containing the new values
  // Does a partial redraw, so the filter and pagination are kept
  function _updateView(request, list) {
    var selected_row_id = null;
    var checked_row_ids = new Array();
    var that = this;

    var row_id_index = this.dataTable.attr("row_id");

    if (row_id_index != undefined) {
      $.each($(this.dataTable.fnGetNodes()), function() {
        if ($('td.markrow', this).length != 0) {
          var aData = that.dataTable.fnGetData(this);

          selected_row_id = aData[row_id_index];

        }
      });
    }

    $.each($(this.dataTable.fnGetNodes()), function() {
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

    if (this.dataTable && this.dataTable.fnSettings()) {
      var dTable_settings = this.dataTable.fnSettings();
      var prev_start = dTable_settings._iDisplayStart;

      this.dataTable.fnClearTable(false);

      var item_list = [];

      $.each(list, function() {
        item_list.push(that.elementArray(this));
      });

      var that = this;
      if (item_list.length > 0) {
        that.dataTable.fnAddData(item_list, false);
      }

      var new_start = prev_start;

      if (new_start > item_list.length - 1) {
        if (item_list.length > 0)
            new_start = item_list.length - 1;
        else
            new_start = 0;
      }

      dTable_settings.iInitDisplayStart = new_start;

      this.dataTable.fnDraw(true);
    };

    if (selected_row_id != undefined) {
      $.each($(this.dataTable.fnGetNodes()), function() {

        var aData = that.dataTable.fnGetData(this);

        if (aData[row_id_index] == selected_row_id) {
          $('td', this)[0].click();
        }
      });
    }

    if (checked_row_ids.length != 0) {
      $.each($(this.dataTable.fnGetNodes()), function() {
        var current_id = $($('td', this)[1]).html();

        if (isNaN(current_id)) {
          current_id = $($('td', this)[0]).html();
        }

        if (current_id) {
          if ($.inArray(current_id, checked_row_ids) != -1) {
            $('input.check_item', this).first().click();
            $('td', this).addClass('markrowchecked');
          }
        }
      });
    }
  }

  //replaces an element with id 'tag' in a dataTable with a new one
  function _updateElement(request, element_json) {
    var id = element_json[this.resource.toUpperCase()].ID;
    var element = this.elementArray(element_json);
    var tag = '#' + this.resource.toLowerCase() + '_' + id;
    // fnGetData should be used instead, otherwise it depends on the visible columns
    var nodes = this.dataTable.fnGetNodes();
    var tr = $(tag, nodes).parents('tr')[0];
    if (tr) {
      var checked_val = $('input.check_item', tr).attr('checked');
      var position = this.dataTable.fnGetPosition(tr);
      this.dataTable.fnUpdate(element, position, undefined, false);
      $('input.check_item', tr).attr('checked', checked_val);
      this.recountCheckboxes();
    }
  }

  function _getElementData(id, resource_tag) {
    var nodes = this.dataTable.fnGetNodes();
    var tr = $(resource_tag + '_' + id, nodes).parents('tr')[0];
    return this.dataTable.fnGetData(tr);
  }

  function _waitingNodes() {
    $('tr input.check_item:visible', this.dataTable).replaceWith(SPINNER);
  }

  //returns an array of ids of selected elements in a dataTable
  function _elements(forceDataTable) {
    var selected_nodes = [];
    if (this.dataTable) {
      var tab = this.dataTable.parents(".tab")
      if (Sunstone.rightInfoVisible(tab) && !forceDataTable) {
        selected_nodes.push(Sunstone.rightInfoResourceId(tab));
      } else {
        //Which rows of the datatable are checked?
        var nodes = $('tbody input.check_item:checked', this.dataTable);
        $.each(nodes, function() {
          selected_nodes.push($(this).val());
        });
      }
    };
    return selected_nodes;
  }
})
