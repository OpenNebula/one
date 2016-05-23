/* -------------------------------------------------------------------------- */
/* Copyright 2002-2016, OpenNebula Project, OpenNebula Systems                */
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
  /*
    DEPENDENCIES
   */

  require('datatables.net');
  require('datatables.foundation');
  var TemplateEmptyTable = require('hbs!./tab-datatable/empty-table');
  var Sunstone = require('sunstone');
  var SunstoneConfig = require('sunstone-config');
  var Locale = require('utils/locale');
  var Tips = require('utils/tips');
  var OpenNebula = require('opennebula');
  var Notifier = require('utils/notifier');
  var OpenNebulaUser = require('opennebula/user');
  var LabelsUtils = require('utils/labels/utils');

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
    dom:
      "t"+
      "<'row'<'small-6 columns'li><'small-6 columns'p>>",
    renderer: 'foundation',
    autoWidth: false,
    language: {
      "sLengthMenu": "_MENU_",
      "emptyTable": TemplateEmptyTable()
    }
  } );

  //$.extend(true, $.fn.dataTable.defaults, {
  //  dom: "t<'row collapse'<'small-6 columns'i><'small-6 columns'lp>>",
  //  renderer: 'foundation',
  //  language: {
  //    "sLengthMenu": "_MENU_",
  //    "emptyTable": TemplateEmptyTable()
  //  }
  //});

  /*
    CONSTRUCTOR
   */

  /* Child class must define:
    this.dataTableId
    this.resource
    this.dataTableOptions
    this.columns
    this.conf = {
      'info': true,     enable on click row will show the element
      'action': true,   enable actions on row elements
      'select': true,   enable selecting elements from the table
      'selectOptions': {
        'filter_fn': function(ds) { return ds.TYPE == 0; }
      }
      'customTabContext': jquery selector used when the datatable has associated
                          buttons. By default it will be the parent tab
      'customTrListener': function executed when a tr is clicked. Arguments
                          are (tableObj, tr)
    }

    1. The table HTML is returned calling the table.dataTableHTML attr
    2. The table must be initialized after including it in the DOM,
        using the table.initilize() method
    3. After that all the methods can be called on the table,
        depending on the functionalities enabled (info, action, select)
  */
  function TabDatatable() {
    var that = this;
    if (that.conf.select) {
      if (!that.selectOptions.select_resource) {
        that.selectOptions.select_resource = Locale.tr("Please select a resource from the list");
      }

      if (!that.selectOptions.you_selected) {
        that.selectOptions.you_selected = Locale.tr("You selected the following resource:");
      }

      if (that.selectOptions.id_index == undefined) {
        that.selectOptions.id_index = 0;
      }

      $.extend(that.selectOptions, that.conf.selectOptions);

      that.selectOptions.fixed_ids_map_orig = {};
      if (that.selectOptions.fixed_ids != undefined) {
        $.each(that.selectOptions.fixed_ids, function() {
          that.selectOptions.fixed_ids_map_orig[this] = true;
        });
      }

      that.selectOptions.starred_ids_map = {};
      if (that.selectOptions.starred_ids != undefined) {
        $.each(that.selectOptions.starred_ids, function() {
          that.selectOptions.starred_ids_map[this] = true;
        });

        if (that.selectOptions.starred_icon == undefined) {
          that.selectOptions.starred_icon = '<i class="fa fa-star fa-fw"></i>';
        }
      }

      if (that.selectOptions.multiple_choice == undefined) {
        that.selectOptions.multiple_choice = false;
      }
    }

    that.dataTableHTML = TemplateDataTableHTML({
                          'dataTableId': this.dataTableId,
                          'columns': this.columns,
                          'conf': this.conf,
                          'selectOptions': this.selectOptions});

    that.searchInputHTML = TemplateSearchInputHTML({'dataTableSearchId': this.dataTableId + 'Search'});

    return that;
  }

  TabDatatable.prototype = {
    'initialize': _initialize,
    'initCheckAllBoxes': _initCheckAllBoxes,
    'tableCheckboxesListener': _tableCheckboxesListener,
    'onlyOneCheckboxListener': _onlyOneCheckboxListener,
    'infoListener': _infoListener,
    'deleteElement': _deleteElement,
    'updateElement': _updateElement,
    'elements': _elements,
    'updateView': _updateView,
    'getElementData': _getElementData,
    'waitingNodes': _waitingNodes,
    'recountCheckboxes': _recountCheckboxes,
    'filter': _filter,
    'resetResourceTableSelect': _resetResourceTableSelect,
    'refreshResourceTableSelect': _refreshResourceTableSelect,
    'selectResourceTableSelect': _selectResourceTableSelect,
    'retrieveResourceTableSelect': _retrieveResourceTableSelect,
    'idInput': _idInput,
    'initSelectResourceTableSelect': _initSelectResourceTableSelect,
    'updateFn': _updateFn,
    'list': _list,
    'clearLabelsFilter': _clearLabelsFilter,
    'setLabelsFilter': _setLabelsFilter
  }

  return TabDatatable;

  /*
    FUNCTION DEFINITIONS
   */

  function _initialize(opts) {
    if (this.conf.select) {
      if (opts && opts.selectOptions) {
        $.extend(this.selectOptions, opts.selectOptions);
      }

      this.initSelectResourceTableSelect();
    } else {
      this.dataTableOptions.pageLength = parseInt(config['user_config']['page_length']);
    }

    this.dataTable = $('#' + this.dataTableId).dataTable(this.dataTableOptions);

    // Remember page length only for non selectable datatables
    if (!this.conf.select) {
      this.dataTable.on( 'length.dt', function ( e, settings, len ) {
        config['user_config']['page_length'] = len;
        var sunstone_setting = {'TABLE_DEFAULT_PAGE_LENGTH': len};
        Sunstone.runAction("User.append_sunstone_setting", config['user_id'], sunstone_setting);
       });
    }

    var that = this;
    $('#' + this.dataTableId + 'Search').on('input', function() {
      that.dataTable.fnFilter($(this).val());
      return false;
    });

    this.dataTable.on('draw.dt', function() {
      that.recountCheckboxes();
    })

    if (this.selectOptions && this.selectOptions.id_index) {
      this.dataTable.fnSort([[this.selectOptions.id_index, config['user_config']['table_order']]]);
    } else {
      this.dataTable.fnSort([[1, SunstoneConfig.tableOrder]]);
    }

    if (this.conf.actions) {
      this.initCheckAllBoxes();
      this.tableCheckboxesListener();
    }

    if (this.conf.oneSelection == true) {
      this.onlyOneCheckboxListener();
      $(".check_all", that.dataTable).hide();
    }

    if (this.conf.info) {
      this.infoListener(_defaultTrListener);
    } else if (this.conf.customTrListener) {
      this.infoListener(this.conf.customTrListener);
    } else if (!this.conf.select){
      this.infoListener();
    }

    if (this.conf.select) {
      that.dataTable.fnSetColumnVis(0, false);
    }
  }

  function _defaultTrListener(tableObj, tr) {
    var aData = tableObj.dataTable.fnGetData(tr);
    if (!aData) return true;
    var id = $(aData[0]).val();
    if (!id) return true;

    Sunstone.showElement(tableObj.tabId, tableObj.resource + ".show", id);

    return false;
  }

  //Shows run a custom action when clicking on rows.
  function _infoListener(info_action) {
    var that = this;
    this.dataTable.on("click", 'tbody tr', function(e) {
      if ($(e.target).is('input') || $(e.target).is('select') || $(e.target).is('option')) {
        return true;
      }

      if (info_action) {
        //If ctrl is hold down, make check_box click
        if (e.ctrlKey || e.metaKey || $(e.target).is('input')) {
          $('.check_item', this).trigger('click');
        } else {
          info_action(that, this);
        }
      } else {
        $('.check_item', this).trigger('click');
      }

      return true;
    });
  }

  //deletes an element with id 'elementId' from a dataTable
  function _deleteElement(elementId) {
    var tag = '#' + this.resource.toLowerCase() + '_' + elementId;
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
  function _initCheckAllBoxes() {
    var that = this;
    this.dataTable.on("change", '.check_all', function() {
      var table = $(this).closest('.dataTables_wrapper');
      if ($(this).is(":checked")) { //check all
        $('tbody input.check_item', table).prop('checked', true).change();
        $('td', table).addClass('markrowchecked');
      } else { //uncheck all
        $('tbody input.check_item', table).prop('checked', false).change();
        $('td', table).removeClass('markrowchecked');
      };

      that.recountCheckboxes();
    });
  }

  //Handle the activation of action buttons and the check_all box
  //when elements in a datatable are modified.
  function _recountCheckboxes() {
    var table = $('tbody', this.dataTable);

    var context;
    if (this.conf.customTabContext) {
      context = this.conf.customTabContext;
    } else {
      context = table.parents('.tab');
      if ($(".sunstone-info", context).is(':visible')) {
        return;
      }
    }

    var nodes = $('tr', table); //visible nodes
    var total_length = nodes.length;
    var checked_length = $('input.check_item:checked', nodes).length;
    var last_action_b = $('.last_action_button', context);

    if (checked_length) { //at least 1 element checked
      //enable action buttons
      $('.top_button, .list_button', context).prop('disabled', false);

      //enable checkall box
      if (total_length == checked_length) {
        $('.check_all', this.dataTable).prop('checked', true);
      } else {
        $('.check_all', this.dataTable).prop('checked', false);
      };
    } else { //no elements cheked
      //disable action buttons, uncheck checkAll
      $('.check_all', this.dataTable).prop('checked', false);
      $('.top_button, .list_button', context).prop('disabled', true).attr('disabled', 'disabled');
    };

    //any case the create dialog buttons should always be enabled.
    $('.create_dialog_button', context).prop('disabled', false);
    $('.alwaysActive', context).prop('disabled', false);
  }

  //Init action buttons and checkboxes listeners
  function _tableCheckboxesListener() {
    //Initialization - disable all buttons
    var context = this.conf.customTabContext || this.dataTable.parents('.tab');

    $('.last_action_button', context).prop('disabled', true);
    $('.top_button, .list_button', context).prop('disabled', true);
    //These are always enabled
    $('.create_dialog_button', context).prop('disabled', false);
    $('.alwaysActive', context).prop('disabled', false);

    //listen to changes in the visible inputs
    var that = this;
    this.dataTable.on("change", 'tbody input.check_item', function() {
      var datatable = $(this).parents('table');

      if ($(this).is(":checked")) {
        $(this).parents('tr').children().addClass('markrowchecked');
      } else {
        $(this).parents('tr').children().removeClass('markrowchecked');
      }

      that.recountCheckboxes();
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
      $('input.check_item:checked', that.dataTable).prop('checked', false);
      $("td", $(this).closest('tr')).addClass('markrowchecked')
      $(this).prop('checked', checked);
    });
  }

  // Updates a data_table, with a 2D array containing the new values
  // Does a partial redraw, so the filter and pagination are kept
  // fromArray if true do not process the list since it is already an array of elements
  function _updateView(request, list, fromArray) {
    var selected_row_id = null;
    var checked_row_ids = new Array();
    var that = this;

    if (that.preUpdateView) {
      that.preUpdateView();
    }

    that.dataTable.DataTable().page.len(parseInt(config['user_config']['page_length']));

    var row_id_index = this.dataTable.attr("row_id");

    if (row_id_index != undefined) {
      $.each($(that.dataTable.fnGetNodes()), function() {
        if ($('td.markrow', this).length != 0) {
          var aData = that.dataTable.fnGetData(this);

          selected_row_id = aData[row_id_index];

        }
      });
    }

    $.each($(that.dataTable.fnGetNodes()), function() {
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

    if (that.dataTable && that.dataTable.fnSettings()) {
      var dTable_settings = that.dataTable.fnSettings();
      var prev_start = dTable_settings._iDisplayStart;

      that.dataTable.fnClearTable(false);

      var item_list;
      if (fromArray) {
        item_list = list;
      } else {
        item_list = [];
        $.each(list, function() {
          var item = that.elementArray(this);
          if (item){
            item_list.push(item);
          }
        });
      }

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

      that.dataTable.fnDraw(true);
    };

    if (selected_row_id != undefined) {
      $.each($(that.dataTable.fnGetNodes()), function() {

        var aData = that.dataTable.fnGetData(this);

        if (aData[row_id_index] == selected_row_id) {
          $('td', this)[0].click();
        }
      });
    }

    if (checked_row_ids.length != 0) {
      $.each($(that.dataTable.fnGetNodes()), function() {
        var current_id = $($('td', this)[1]).html();

        if (isNaN(current_id)) {
          current_id = $($('td', this)[0]).html();
        }

        if (current_id) {
          if ($.inArray(current_id, checked_row_ids) != -1) {
            $('input.check_item:not(:checked)', this).first().click();
            $('td', this).addClass('markrowchecked');
          }
        }
      });
    }

    if (that.labelsColumn && !SunstoneConfig.isTabEnabled("provision-tab")) {
      if (SunstoneConfig.isTabEnabled(that.tabId)) {
        if ($("#" + that.tabId).is(':visible')) {
          LabelsUtils.insertLabelsMenu({'tabName': that.tabId});
          LabelsUtils.insertLabelsDropdown(that.tabId);
        }
      }
    }

    if (that.postUpdateView) {
      that.postUpdateView();
    }
  }

  //replaces an element with id 'tag' in a dataTable with a new one
  function _updateElement(request, elementJSON) {
    var that = this;
    var elementId = elementJSON[that.xmlRoot].ID;
    var element = that.elementArray(elementJSON);

    $.each(that.dataTable.fnGetData(), function(index, aData) {
      if (aData[that.selectOptions.id_index] === elementId) {
        var nodes = that.dataTable.fnGetNodes();
        var checkId = '#' + that.resource.toLowerCase() + '_' + elementId;
        var checkVal = $(checkId, nodes).prop('checked');
        that.dataTable.fnUpdate(element, index, undefined, false);
        if (checkVal) {
          $(checkId, nodes).prop('checked', checkVal);
        }
        that.recountCheckboxes();
        return false;
      }
    });
  }

  function _getElementData(id, resource_tag) {
    // TODO If the element is not included in the visible rows of
    // the table, it will not be included in the fnGetNodes response
    var nodes = this.dataTable.fnGetNodes();
    var tr = $('#' + resource_tag + '_' + id, nodes).closest('tr');
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

  function _filter(value, columnId) {
    this.dataTable.fnFilter(value, columnId);
  }

  /*
    SELECT RESOURCE FUNCTION DEFINITIONS
   */

  function _initSelectResourceTableSelect() {
    var that = this;
    var section = $('#' + that.dataTableId + 'Container');

    if (that.selectOptions.id_index == undefined) {
      that.selectOptions.id_index = 0;
    }

    if (that.selectOptions.name_index == undefined) {
      that.selectOptions.name_index = 1;
    }

    if (that.selectOptions.dataTable_options == undefined) {
      that.selectOptions.dataTable_options = {};
    }

    if (that.selectOptions.select_callback == undefined) {
      that.selectOptions.select_callback = function() {};
    }

    if (that.selectOptions.unselect_callback == undefined) {
      that.selectOptions.unselect_callback = function() {};
    }

    if (that.selectOptions.multiple_choice) {
      that.dataTableOptions.fnRowCallback = function(nRow, aData, iDisplayIndex, iDisplayIndexFull) {
        var row_id = aData[that.selectOptions.id_index];

        var ids = $('#selected_ids_row_' + that.dataTableId, section).data("ids");
        if (ids != undefined && ids[row_id]) {
          $("td", nRow).addClass('markrowchecked');
          $('input.check_item', nRow).prop('checked', true);
        } else {
          $("td", nRow).removeClass('markrowchecked');
          $('input.check_item', nRow).prop('checked', false);
        }
      };
    } else {
      that.dataTableOptions.fnRowCallback = function(nRow, aData, iDisplayIndex, iDisplayIndexFull) {
        var row_id = aData[that.selectOptions.id_index];

        var selected_id = $('#selected_resource_id_' + that.dataTableId, section).val();

        if (row_id == selected_id) {
          $("td", nRow).addClass('markrow');
          $('input.check_item', nRow).prop('checked', true);
        } else {
          $("td", nRow).removeClass('markrow');
          $('input.check_item', nRow).prop('checked', false);
        }
      };
    }

    $('#refresh_button_' + that.dataTableId, section).off("click");
    section.on('click', '#refresh_button_' + that.dataTableId, function() {
      that.updateFn();
      return false;
    });

    $('#' + that.dataTableId + '_search', section).on('input', function() {
      that.dataTable.fnFilter($(this).val());
      return false;
    })

    if (that.selectOptions.read_only) {
      $('#selected_ids_row_' + that.dataTableId, section).hide();
    } else if (that.selectOptions.multiple_choice) {
      $('#selected_resource_' + that.dataTableId, section).hide();
      $('#select_resource_' + that.dataTableId, section).hide();

      $('#selected_resource_multiple_' + that.dataTableId, section).hide();
      $('#select_resource_multiple_' + that.dataTableId, section).show();
    } else {
      $('#selected_resource_' + that.dataTableId, section).hide();
      $('#select_resource_' + that.dataTableId, section).show();

      $('#selected_resource_multiple_' + that.dataTableId, section).hide();
      $('#select_resource_multiple_' + that.dataTableId, section).hide();
    }

    $('#selected_resource_name_' + that.dataTableId, section).hide();

    $('#selected_ids_row_' + that.dataTableId, section).data("options", that.selectOptions);

    if (that.selectOptions.read_only) {

    } else if (that.selectOptions.multiple_choice) {
      $('#selected_ids_row_' + that.dataTableId, section).data("ids", {});

      function row_click(row, aData) {
        that.dataTable.unbind("draw");

        var row_id = aData[that.selectOptions.id_index];
        var row_name = aData[that.selectOptions.name_index];

        var ids = $('#selected_ids_row_' + that.dataTableId, section).data("ids");

        if (ids[row_id]) {
          delete ids[row_id];

          // Happens if row is not yet rendered (i.e. higher unvisited page)
          if (row != undefined) {
            $("td", row).removeClass('markrowchecked');
            $('input.check_item', row).prop('checked', false);
          }

          $('#selected_ids_row_' + that.dataTableId + ' span[row_id="' + row_id + '"]', section).remove();

          that.selectOptions.unselect_callback();
        } else {
          ids[row_id] = true;

          // Happens if row is not yet rendered (i.e. higher unvisited page)
          if (row != undefined) {
            $("td", row).addClass('markrowchecked');
            $('input.check_item', row).prop('checked', true);
          }

          $('#selected_ids_row_' + that.dataTableId, section).append('<span row_id="' + row_id + '" class="radius label">' + row_name + ' <span class="fa fa-times blue"></span></span> ');

          that.selectOptions.select_callback(aData, that.selectOptions);
        }

        if ($.isEmptyObject(ids)) {
          $('#selected_resource_multiple_' + that.dataTableId, section).hide();
          $('#select_resource_multiple_' + that.dataTableId, section).show();
        } else {
          $('#selected_resource_multiple_' + that.dataTableId, section).show();
          $('#select_resource_multiple_' + that.dataTableId, section).hide();
        }

        return true;
      };

      $('#' + that.dataTableId + ' tbody', section).on("click", "tr", function(e) {
        var aData = that.dataTable.fnGetData(this);

        if(aData != undefined){
          row_click(this, aData);
        }
      });

      $(section).on("click", '#selected_ids_row_' + that.dataTableId + ' span.fa.fa-times', function() {
        var row_id = $(this).parent("span").attr('row_id');

        var found = false;

        var aData = that.dataTable.fnGetData();
        // TODO: improve preformance, linear search
        $.each(aData, function(index, row) {
          if (row[that.selectOptions.id_index] == row_id) {
            found = true;
            row_click(that.dataTable.fnGetNodes(index), row);
            return false;
          }
        });

        if (!found) {
          var ids = $('#selected_ids_row_' + that.dataTableId, section).data("ids");
          delete ids[row_id];
          $('#selected_ids_row_' + that.dataTableId + ' span[row_id="' + row_id + '"]', section).remove();

          if ($.isEmptyObject(ids)) {
            $('#selected_resource_multiple_' + that.dataTableId, section).hide();
            $('#select_resource_multiple_' + that.dataTableId, section).show();
          } else {
            $('#selected_resource_multiple_' + that.dataTableId, section).show();
            $('#select_resource_multiple_' + that.dataTableId, section).hide();
          }
        }

        that.selectOptions.unselect_callback(aData, that.selectOptions);
      });
    } else {
      $('#' + that.dataTableId + ' tbody', section).delegate("tr", "click", function(e) {
        that.dataTable.unbind("draw");
        var aData = that.dataTable.fnGetData(this);

        $("td.markrow", that.dataTable).removeClass('markrow');
        $('tbody input.check_item', that.dataTable).prop('checked', false);

        if (aData != undefined){
          $("td", this).addClass('markrow');
          $('input.check_item', this).prop('checked', true);

          $('#selected_resource_' + that.dataTableId, section).show();
          $('#select_resource_' + that.dataTableId, section).hide();

          $('#selected_resource_id_' + that.dataTableId, section).val(aData[that.selectOptions.id_index]).trigger("change");

          $('#selected_resource_name_' + that.dataTableId, section).text(aData[that.selectOptions.name_index]).trigger("change");
          $('#selected_resource_name_' + that.dataTableId, section).show();

          that.selectOptions.select_callback(aData, that.selectOptions);
        }

        $('#selected_resource_id_' + that.dataTableId, section).removeData("pending_select");

        return true;
      });
    }

    Tips.setup(section);
  }

  function _resetResourceTableSelect() {
    var that = this;
    var section = $('#' + that.dataTableId + 'Container');

    // TODO: do for multiple_choice

    // TODO: works for more than one page?

    $("td.markrow", that.dataTable).removeClass('markrow');
    $('tbody input.check_item', that.dataTable).prop('checked', false);

    $('#' + that.dataTableId + '_search', section).val("").trigger("input");
    $('#refresh_button_' + that.dataTableId).click();

    $('#selected_resource_name_' + that.dataTableId, section).text("").hide();

    $('#selected_resource_' + that.dataTableId, section).hide();
    $('#select_resource_' + that.dataTableId, section).show();
  }

  // Returns an ID, or an array of IDs for that.selectOptions.multiple_choice
  function _retrieveResourceTableSelect() {
    var that = this;
    var section = $('#' + that.dataTableId + 'Container');

    if (that.selectOptions.multiple_choice) {
      var ids = $('#selected_ids_row_' + that.dataTableId, section).data("ids");

      var arr = [];

      $.each(ids, function(key, val) {
        arr.push(key);
      });

      return arr;
    } else {
      return $('#selected_resource_id_' + that.dataTableId, section).val();
    }
  }

  /**
   * Returns the jquery selector for the ID input. Can be used to add attributes
   * to it, such as 'wizard_field'
   * @return {Object} jquery selector for the ID input
   */
  function _idInput() {
    var that = this;
    var section = $('#' + that.dataTableId + 'Container');

    if (that.selectOptions.multiple_choice) {
      return $('#selected_ids_row_' + that.dataTableId, section);
    } else {
      return $('#selected_resource_id_' + that.dataTableId, section);
    }
  }

  // Clicks the refresh button
  function _refreshResourceTableSelect() {
    var that = this;
    var section = $('#' + that.dataTableId + 'Container');
    $('#refresh_button_' + that.dataTableId, section).click();
  }

  /**
   * Clears the current selection, and selects the given IDs
   * @param  {object} selectedResources Two alternatives, ids or names.
   *                - selectedResources.ids must be a single ID,
   *                            or an array of IDs for options.multiple_choice
   *                - selectedResources.names must be an array of {name, uname}
   */
  function _selectResourceTableSelect(selectedResources) {
    var that = this;
    var section = $('#' + that.dataTableId + 'Container');

    if (that.selectOptions.multiple_choice) {
      that.refreshResourceTableSelect(section, that.dataTableId);

      var data_ids = {};

      $('#selected_ids_row_' + that.dataTableId + ' span[row_id]', section).remove();

      if (selectedResources.ids == undefined) {
        selectedResources.ids = [];
      }

      // TODO: {name, uname} support for multiple_choice

      $.each(selectedResources.ids, function(index, row_id) {
        if (isNaN(row_id)) {
          return true;
        }

        data_ids[row_id] = true;

        var row_name = "" + row_id;

        row_name = OpenNebula[that.resource].getName(row_id);

        $('#selected_ids_row_' + that.dataTableId, section).append('<span row_id="' + row_id + '" class="radius label">' + row_name + ' <span class="fa fa-times blue"></span></span> ');
      });

      $('#selected_ids_row_' + that.dataTableId, section).data("ids", data_ids);

      if ($.isEmptyObject(data_ids)) {
        $('#selected_resource_multiple_' + that.dataTableId, section).hide();
        $('#select_resource_multiple_' + that.dataTableId, section).show();
      } else {
        $('#selected_resource_multiple_' + that.dataTableId, section).show();
        $('#select_resource_multiple_' + that.dataTableId, section).hide();
      }

      that.dataTable.fnDraw();
    } else {
      $("td.markrow", that.dataTable).removeClass('markrow');
      $('tbody input.check_item', that.dataTable).prop('checked', false);

      $('#selected_resource_' + that.dataTableId, section).show();
      $('#select_resource_' + that.dataTableId, section).hide();

      var row_id = undefined;
      var row_name = "";

      if (selectedResources.ids != undefined) {

        row_id = selectedResources.ids;

        row_name = "" + row_id;

        row_name = OpenNebula[that.resource].getName(row_id);

      } else if (selectedResources.names != undefined) {
        row_name = selectedResources.names.name;
        var row_uname = selectedResources.names.uname;

        $.each(that.dataTable.fnGetData(), function(index, row) {
          if (row[that.selectOptions.name_index] == row_name &&
             row[that.selectOptions.uname_index] == row_uname) {

            row_id = row[that.selectOptions.id_index];
            return false;
          }
        });

        //if (row_id == undefined){
        //  $('#selected_resource_id_' + that.dataTableId, section).data("pending_select", selectedResources);
        //}
      }

      //        $("td", this).addClass('markrow');
      //        $('input.check_item', this).prop('checked', true);

      if (row_id !== undefined) {
        $('#selected_resource_id_' + that.dataTableId, section).val(row_id).trigger("change");
      }

      $('#selected_resource_name_' + that.dataTableId, section).text(row_name).trigger("change");
      $('#selected_resource_name_' + that.dataTableId, section).show();

      that.refreshResourceTableSelect(section, that.dataTableId);
    }
  }

  function _updateFn() {
    var that = this;
    var success_func = function (request, resource_list) {
      var list_array = [];

      var fixed_ids_map = $.extend({}, that.selectOptions.fixed_ids_map_orig);

      $.each(resource_list, function() {
        var add = true;

        if (that.selectOptions.filter_fn) {
          add = that.selectOptions.filter_fn(this[that.xmlRoot]);
        }

        if (that.selectOptions.fixed_ids != undefined) {
          add = (add && fixed_ids_map[this[that.xmlRoot].ID]);
        }

        var elementArray;

        if (add) {
          elementArray = that.elementArray(this);
          add = (elementArray != false);
        }

        if (add) {
          if (that.selectOptions.starred_ids != undefined){
            if (that.selectOptions.starred_ids_map[this[that.xmlRoot].ID]){
              elementArray[that.selectOptions.name_index] =
                  (that.selectOptions.starred_icon + ' ' +
                    elementArray[that.selectOptions.name_index]);
            } else {
              elementArray[that.selectOptions.name_index] =
                  ('<i class="fa fa-fw"></i> ' +
                    elementArray[that.selectOptions.name_index]);
            }
          }

          list_array.push(elementArray);

          delete fixed_ids_map[this[that.xmlRoot].ID];
        }
      });

      var n_columns = that.columns.length + 1;

      $.each(fixed_ids_map, function(id, v) {
        var empty = [];

        for (var i = 0; i <= n_columns; i++) {
          empty.push("");
        }

        empty[that.selectOptions.id_index] = id;

        list_array.push(empty);
      });

      that.updateView(null, list_array, true);

      var section = $('#' + that.dataTableId + 'Container');
      var selectedResources = $('#selected_resource_id_' + that.dataTableId, section).data("pending_select");
      if (selectedResources != undefined){
        $('#selected_resource_id_' + that.dataTableId, section).removeData("pending_select");
        that.selectResourceTableSelect(selectedResources);
      }
    }

    var error_func = function(request, error_json, container) {
      success_func(request, []);
      Notifier.onError(request, error_json, container);
    }

    if (that.selectOptions.zone_id == undefined) {
      OpenNebula[that.resource].list({
        timeout: true,
        success: success_func,
        error: error_func
      });
    } else {
      OpenNebula[that.resource].list_in_zone({
        data: {zone_id: that.selectOptions.zone_id},
        timeout: true,
        success: success_func,
        error: error_func
      });
    }
  }
  // Used by panels that contain tables from other resources.
  // TODO: This is probably duplicated somewhere
  function _list() {
    var that = this;
    OpenNebula[that.resource].list({
      success: function(req, resp) {
        that.updateView(req, resp);
      },
      error: Notifier.onError
    });
  }

  function _setLabelsFilter(regExp) {
    LabelsUtils.setLabelsFilter(this.dataTable, this.labelsColumn, regExp);
  }

  function _clearLabelsFilter() {
    LabelsUtils.clearLabelsFilter(this.dataTable, this.labelsColumn);
  }
})
