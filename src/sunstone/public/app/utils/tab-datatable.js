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
  /*
    DEPENDENCIES
   */

  require("datatables.net");
  require("datatables.foundation");
  var LabelsUtils = require("utils/labels/utils");
  var Locale = require("utils/locale");
  var Notifier = require("utils/notifier");
  var OpenNebula = require("opennebula");
  var Sunstone = require("sunstone");
  var SunstoneConfig = require("sunstone-config");
  var Tips = require("utils/tips");

  /*
    TEMPLATES
   */

  var TemplateEmptyTable = require("hbs!./tab-datatable/empty-table");
  var TemplateDataTableHTML = require("hbs!./tab-datatable/table");
  var TemplateSearchInputHTML = require("hbs!./tab-datatable/search-input");

  /*
    CONSTANTS
   */

  var SPINNER = "<img src=\"images/ajax-loader.gif\" alt=\"retrieving\" class=\"loading_img\"/>";
  var externalFnClickElement

  /*
    GLOBAL INITIALIZATION
   */

  /* Set the defaults for DataTables initialisation */
  $.extend(true, $.fn.dataTable.defaults, {
    dom:
      "t"+
      "<'row'<'small-6 columns'li><'small-6 columns'p>>",
    renderer: "foundation",
    autoWidth: false,
    language: {
      "url": "../locale/languages/" + datatable_lang,
      "emptyTable": TemplateEmptyTable()
    }
  } );

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
      'minColumns':     if true, all columns are hidden except ID and NAME
      'customTabContext': jquery selector used when the datatable has associated
                          buttons. By default it will be the parent tab
      'customTrListener': function executed when a tr is clicked. Arguments
                          are (tableObj, tr)
      'searchDropdownHTML': optional HTML to place inside a dropdown next to
                            the search input
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
          that.selectOptions.starred_icon = "<i class=\"fas fa-star fa-fw\"></i>";
        }
      }

      if (that.selectOptions.multiple_choice == undefined) {
        that.selectOptions.multiple_choice = false;
      }
    }

    that.dataTableHTML = TemplateDataTableHTML({
                          "dataTableId": this.dataTableId,
                          "columns": this.columns,
                          "conf": this.conf,
                          "selectOptions": this.selectOptions});

    that.searchInputHTML = TemplateSearchInputHTML({
      "dataTableSearchId": this.dataTableId + "Search",
      "searchDropdownHTML": this.conf.searchDropdownHTML,
      "searchByType": this.conf.searchByType
    });

    return that;
  }

  TabDatatable.prototype = {
    "initialize": _initialize,
    "initCheckAllBoxes": _initCheckAllBoxes,
    "tableCheckboxesListener": _tableCheckboxesListener,
    "onlyOneCheckboxListener": _onlyOneCheckboxListener,
    "infoListener": _infoListener,
    "updateElement": _updateElement,
    "elements": _elements,
    "updateView": _updateView,
    "getElementData": _getElementData,
    "waitingNodes": _waitingNodes,
    "recountCheckboxes": _recountCheckboxes,
    "filter": _filter,
    "resetResourceTableSelect": _resetResourceTableSelect,
    "refreshResourceTableSelect": _refreshResourceTableSelect,
    "selectResourceTableSelect": _selectResourceTableSelect,
    "retrieveResourceTableSelect": _retrieveResourceTableSelect,
    "idInput": _idInput,
    "initSelectResourceTableSelect": _initSelectResourceTableSelect,
    "updateFn": _updateFn,
    "list": _list,
    "clearLabelsFilter": _clearLabelsFilter,
    "getLabelsFilter": _getLabelsFilter,
    "deselectHiddenResources": _deselectHiddenResources,
    "getColumnDataInSelectedRows": _getColumnDataInSelectedRows,
  };

  return TabDatatable;


  function _initialize(opts) {
    var that = this;

    if (this.conf.select) {
      if (opts && typeof opts.externalClick === "function") {
        externalFnClickElement = opts.externalClick
      }

      if (opts && opts.selectOptions) {
        $.extend(this.selectOptions, opts.selectOptions);
      }

      this.initSelectResourceTableSelect();
    } else {
      this.dataTableOptions.pageLength = parseInt(config["user_config"]["page_length"]);
    }

    this.dataTable = $("#" + this.dataTableId).dataTable(this.dataTableOptions);

    // Remember page length only for non selectable datatables
    if (!this.conf.select) {
      this.dataTable.on( "length.dt", function ( e, settings, len ) {
        if (config["user_config"]["page_length"] != len){
          config["user_config"]["page_length"] = len;
          var sunstone_setting = {"TABLE_DEFAULT_PAGE_LENGTH": len};
          Sunstone.runAction("User.append_sunstone_setting", config["user_id"], sunstone_setting);
        }
      });
    }

    $("#" + this.dataTableId + "Search").on("input", function() {
      that.dataTable.fnFilter($(this).val());
      return false;
    });

    if(that.conf.searchDropdownHTML != undefined){
      var context = $("#" + this.dataTableId + "Search-wrapper");
      if (that.setupSearch != undefined){
        that.setupSearch(context);
      } else {
        _setupSearch(that, context);
      }

      $("a.advanced-search-clear", context).on("click", function(){
        $("input,select", context).val("").trigger("input");

        that.clearLabelsFilter();

        $("button.advanced-search", context).click();
      });

      $("input", context).on("keypress", function(e) {
        var code = e.keyCode || e.which;
        if (code  == 13) {
          $("button.advanced-search", context).click();
        }
      });

      $("button.advanced-search", context).on("click", function(){
        $("#" + that.dataTableId + "Search-dropdown", context).foundation("close");
        that.dataTable.fnDraw(true);
        return false;
      });

      $("#"+ this.dataTableId +"Search-selectTYPE", context).on("change", function(){
        that.dataTable.fnDraw(true);
        return false;
      });
    }

    this.dataTable.on("draw.dt", function() {
      that.recountCheckboxes();
    });

    if (this.selectOptions && this.selectOptions.id_index) {
      this.dataTable.fnSort([[this.selectOptions.id_index, config["user_config"]["table_order"]]]);
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

    if (this.conf.minColumns == true) {
      var n_columns = that.columns.length + 1;

      for(var i = 1; i < n_columns; i += 1){
        if ( i == that.selectOptions.id_index ||
             i == that.selectOptions.name_index ){

          that.dataTable.fnSetColumnVis(i, true);
        }else{
          that.dataTable.fnSetColumnVis(i, false);
        }
      }
    }

    Foundation.reflow($("#" + this.dataTableId + "Search-dropdown"), "dropdown");

    // For some reason the dropdown forces horizontal and vertical scrollbars,
    // and breaks the full-screen modal positioning (VNC). It gets fixed once
    // the dropdown is shown+hidden, so we force it now
    $("#" + this.dataTableId + "Search-wrapper button.search-dropdown").click();
    $("#" + this.dataTableId + "Search-wrapper button.search-dropdown").click();
  }


  function _setupSearch(that, context) {
    that.searchFields = [];

    $("[search-field]", context).each(function(){
      that.searchFields.push( $(this).attr("search-field") );
    });

    that.searchVals = {};
    that.searchFields.forEach(function(name){
      that.searchVals[name] = "";
    });

    that.searchOps = {};
    that.searchFields.forEach(function(name){
      var op = $("[search-field="+name+"]", context).attr("search-operation");

      if (op == undefined){
        op = "match";
      }

      that.searchOps[name] = op;
    });

    $("[search-field]", context).on("input change", function(){
      var name = $(this).attr("search-field");

      if($(this).attr("type") == "date"){
        var val = $(this).val();

        if(val == ""){
          that.searchVals[name] = "";
        } else {
          that.searchVals[name] = parseInt( new Date(val).getTime() ) / 1000;
        }
      }else{
        that.searchVals[name] = $(this).val();
      }
    });

    that.dataTable.on("search.dt", function() {
      var empty = true;

      for(var i=0; i < that.searchFields.length; i++){
        var name = that.searchFields[i];
        empty = $("[search-field="+name+"]", context).val() == "";

        if(!empty){
          break;
        }
      }

      var label = that.getLabelsFilter();
      var empty_label = (label == undefined || label == "");
      empty = (empty && empty_label);

      if (empty_label) {
        $("span.advanced-search-label", context).text("-");
      } else {
        $("span.advanced-search-label", context).text(label);
      }

    });

    $.fn.dataTable.ext.search.push(
      function( settings, data, dataIndex ) {
        // This is a global search function, we need to apply it only if the
        // search is triggered for the current table
        if(that.dataTableId != settings.nTable.id){
          return true;
        }

        try {
          var values = JSON.parse( decodeURIComponent(escape(atob(data[that.searchColumn]))) );

          var match = true;

          for(var i=0; i < that.searchFields.length; i++){
            var name = that.searchFields[i];

            switch(that.searchOps[name]){
              case "match":
                // Tries with regex and with substrings
                match = (values[name].match( that.searchVals[name] ) != null) || (values[name].includes( that.searchVals[name] ));
                break;
              case "<=":
                match = (that.searchVals[name] == "") ||
                        (values[name] <= that.searchVals[name]);
                break;
              case ">=":
                match = (that.searchVals[name] == "") ||
                        (values[name] >= that.searchVals[name]);
                break;
              case ">":
                match = (that.searchVals[name] == "") ||
                        (values[name] > that.searchVals[name]);
                break;
              case "<":
                match = (that.searchVals[name] == "") ||
                        (values[name] < that.searchVals[name]);
                break;
              case "==":
                match = (that.searchVals[name] == "") ||
                        (values[name] == that.searchVals[name]);
                break;
            }

            if (!match){
              break;
            }
          }

          return match;
        } catch (err) {}

        return true;
      }
    );
  }


  function _defaultTrListener(tableObj, tr) {
    var aData = tableObj.dataTable.fnGetData(tr);
    if (!aData) return true;
    var id = $(aData[0]).val();
    if (!id) return true;

    Sunstone.showElement(tableObj.tabId, id);

    return false;
  }

  //Shows run a custom action when clicking on rows.
  function _infoListener(info_action) {
    var that = this;
    this.dataTable.on("click", "tbody tr", function(e) {
      if ($(e.target).is("input") || $(e.target).is("select") || $(e.target).is("option")) {
        return true;
      }

      if (info_action) {
        //If ctrl is hold down, make check_box click
        if (e.ctrlKey || e.metaKey || $(e.target).is("input")) {
          $(".check_item", this).trigger("click");
        } else {
          info_action(that, this);
        }
      } else {
        $(".check_item", this).trigger("click");
      }

      return true;
    });
  }

  //Add a listener to the check-all box of a datatable, enabling it to
  //check and uncheck all the checkboxes of its elements.
  function _initCheckAllBoxes() {
    var that = this;
    this.dataTable.on("change", ".check_all", function() {
      var table = $(this).closest(".dataTables_wrapper");
      if ($(this).is(":checked")) { //check all
        $("tbody input.check_item", table).prop("checked", true).change();
        $("td", table).addClass("markrowchecked");
      } else { //uncheck all
        $("tbody input.check_item", table).prop("checked", false).change();
        $("td", table).removeClass("markrowchecked");
      };

      that.recountCheckboxes();
    });
  }

  //Handle the activation of action buttons and the check_all box
  //when elements in a datatable are modified.
  function _recountCheckboxes() {
    var table = $("tbody", this.dataTable);

    var context;
    if (this.conf.customTabContext) {
      context = this.conf.customTabContext;
    } else {
      context = table.parents(".tab");
      if ($(".sunstone-info", context).is(":visible")) {
        return;
      }
    }

    var nodes = $("tr", table); //visible nodes
    var total_length = nodes.length;
    var checked_length = $("input.check_item:checked", nodes).length;

    if (checked_length) { //at least 1 element checked
      //enable action buttons
      $(".top_button, .list_button", context).prop("disabled", false);

      //enable checkall box
      if (total_length == checked_length) {
        $(".check_all", this.dataTable).prop("checked", true);
      } else {
        $(".check_all", this.dataTable).prop("checked", false);
      };
    } else { //no elements cheked
      //disable action buttons, uncheck checkAll
      $(".check_all", this.dataTable).prop("checked", false);
      $(".top_button, .list_button", context).prop("disabled", true).attr("disabled", "disabled");
    };

    //any case the create dialog buttons should always be enabled.
    $(".create_dialog_button", context).prop("disabled", false);
    $(".alwaysActive", context).prop("disabled", false);
  }

  //Init action buttons and checkboxes listeners
  function _tableCheckboxesListener() {
    //Initialization - disable all buttons
    var context = this.conf.customTabContext || this.dataTable.parents(".tab");

    $(".last_action_button", context).prop("disabled", true);
    $(".top_button, .list_button", context).prop("disabled", true);
    //These are always enabled
    $(".create_dialog_button", context).prop("disabled", false);
    $(".alwaysActive", context).prop("disabled", false);

    //listen to changes in the visible inputs
    var that = this;
    this.dataTable.on("change", "tbody input.check_item", function() {
      if ($(this).is(":checked")) {
        $(this).parents("tr").children().addClass("markrowchecked");
      } else {
        $(this).parents("tr").children().removeClass("markrowchecked");
      }

      that.recountCheckboxes();
    });
  }

  /*
   * onlyOneCheckboxListener: Only one box can be checked
   */

  function _onlyOneCheckboxListener() {
    var that = this;
    this.dataTable.on("change", "tbody input.check_item", function() {
      var checked = $(this).is(":checked");
      $("td", that.dataTable).removeClass("markrowchecked");
      $("input.check_item:checked", that.dataTable).prop("checked", false);
      $("td", $(this).closest("tr")).addClass("markrowchecked");
      $(this).prop("checked", checked);
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

    if(that.conf.searchDropdownHTML != undefined){
      that.searchSets = {};
      try {
        that.searchFields.forEach(function(name){
          that.searchSets[name] = new Set();
        });
      } catch(e){}
    }

    that.dataTable.DataTable().page.len(parseInt(config["user_config"]["page_length"]));

    var row_id_index = this.dataTable.attr("row_id");

    if (row_id_index != undefined) {
      $.each($(that.dataTable.fnGetNodes()), function() {
        if ($("td.markrow", this).length != 0) {
          var aData = that.dataTable.fnGetData(this);

          selected_row_id = aData[row_id_index];

        }
      });
    }

    $.each($(that.dataTable.fnGetNodes()), function() {
      if ($("td.markrowchecked", this).length != 0) {
        if (!isNaN($($("td", $(this))[1]).html())) {
          checked_row_ids.push($($("td", $(this))[1]).html());
        } else {
          checked_row_ids.push($($("td", $(this))[0]).html());
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

            if(that.searchColumn != undefined){
              try{
                var values = JSON.parse( decodeURIComponent(escape(atob(item[that.searchColumn]))) );

                that.searchFields.forEach(function(name){
                  that.searchSets[name].add(values[name]);
                });
              }catch(e){}
            }
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
          $("td", this)[0].click();
        }
      });
    }

    if (checked_row_ids.length != 0) {
      $.each($(that.dataTable.fnGetNodes()), function() {
        var current_id = $($("td", this)[1]).html();

        if (isNaN(current_id)) {
          current_id = $($("td", this)[0]).html();
        }

        if (current_id) {
          if ($.inArray(current_id, checked_row_ids) != -1) {
            $("input.check_item:not(:checked)", this).first().click();
            $("td", this).addClass("markrowchecked");
          }
        }
      });
    }

    if (that.labelsColumn &&
        SunstoneConfig.isTabEnabled(that.tabId) &&
        $("#" + that.tabId).is(":visible")) {

      LabelsUtils.insertLabelsDropdown(that.tabId);

      if (SunstoneConfig.isTabActionEnabled(that.tabId, that.resource+".menu_labels")){
        LabelsUtils.insertLabelsMenu({"tabName": that.tabId});
      }
    }

    if (that.postUpdateView) {
      that.postUpdateView();
    }

    if(that.conf.searchDropdownHTML != undefined){
      try {
        that.searchFields.forEach(function(name){
          var st = "";

          var dlist = $("datalist[search-datalist="+name+"]", $("#"+that.tabId));

          if(dlist.length > 0){
            that.searchSets[name].forEach(function(val){
              st += "<option value=\"" + val + "\"></option>";
            });

            dlist.html(st);
          }
        });
      } catch(e){}
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
        var checkId = "#" + that.resource.toLowerCase() + "_" + elementId;
        var checkVal = $(checkId, nodes).prop("checked");
        that.dataTable.fnUpdate(element, index, undefined, false);
        if (checkVal) {
          $(checkId, nodes).prop("checked", checkVal);
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
    var tr = $("#" + resource_tag + "_" + id, nodes).closest("tr");
    return this.dataTable.fnGetData(tr);
  }

  function _waitingNodes() {
    $("tr input.check_item:visible", this.dataTable).replaceWith(SPINNER);
  }

  //returns an array of ids of selected elements in a dataTable
  function _elements(opts) {
    var that = this;

    var selected_nodes = [];
    if (this.dataTable) {
      var tab = this.dataTable.parents(".tab");
      if (Sunstone.rightInfoVisible(tab)) {
        selected_nodes.push(Sunstone.rightInfoResourceId(tab));
      } else {
        //Which rows of the datatable are checked?
        var nodes = $("tbody input.check_item:checked", this.dataTable);
        $.each(nodes, function() {
          selected_nodes.push($(this).val());
        });
      }
    };

    if (opts && opts.names){
      var pairs = [];

      $.each(selected_nodes, function(){
        pairs.push({id: this, name: OpenNebula[that.resource].getName(this)});
      });

      return pairs;
    }

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
    var section = $("#" + that.dataTableId + "Container");

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

        var ids = $("#selected_ids_row_" + that.dataTableId, section).data("ids");
        if (ids != undefined && ids[row_id]) {
          $("td", nRow).addClass("markrowchecked");
          $("input.check_item", nRow).prop("checked", true);
        } else {
          $("td", nRow).removeClass("markrowchecked");
          $("input.check_item", nRow).prop("checked", false);
        }
      };
    } else {
      that.dataTableOptions.fnRowCallback = function(nRow, aData, iDisplayIndex, iDisplayIndexFull) {
        var row_id = aData[that.selectOptions.id_index];

        var selected_id = $("#selected_resource_id_" + that.dataTableId, section).val();

        if (row_id == selected_id) {
          $("td", nRow).addClass("markrow");
          $("input.check_item", nRow).prop("checked", true);
        } else {
          $("td", nRow).removeClass("markrow");
          $("input.check_item", nRow).prop("checked", false);
        }
      };
    }

    $("#refresh_button_" + that.dataTableId, section).off("click");
    section.on("click", "#refresh_button_" + that.dataTableId, function() {
      that.updateFn();
      return false;
    });

    $("#" + that.dataTableId + "_search", section).on("input", function() {
      that.dataTable.fnFilter($(this).val());
      return false;
    });

    if (that.selectOptions.read_only) {
      $("#selected_ids_row_" + that.dataTableId, section).hide();
    } else if (that.selectOptions.multiple_choice) {
      $("#selected_resource_" + that.dataTableId, section).hide();
      $("#select_resource_" + that.dataTableId, section).hide();

      $("#selected_resource_multiple_" + that.dataTableId, section).hide();
      $("#select_resource_multiple_" + that.dataTableId, section).show();
    } else {
      $("#selected_resource_" + that.dataTableId, section).hide();
      $("#select_resource_" + that.dataTableId, section).show();

      $("#selected_resource_multiple_" + that.dataTableId, section).hide();
      $("#select_resource_multiple_" + that.dataTableId, section).hide();
    }

    $("#selected_resource_name_" + that.dataTableId, section).hide();

    $("#selected_ids_row_" + that.dataTableId, section).data("options", that.selectOptions);

    if (that.selectOptions.multiple_choice) {
      $("#selected_ids_row_" + that.dataTableId, section).data("ids", {});

      function row_click(row, aData) {
        that.dataTable.unbind("draw");

        var row_id = aData[that.selectOptions.id_index];
        var row_name = aData[that.selectOptions.name_index];

        var ids = $("#selected_ids_row_" + that.dataTableId, section).data("ids");

        if (ids[row_id]) {
          delete ids[row_id];

          // Happens if row is not yet rendered (i.e. higher unvisited page)
          if (row != undefined) {
            $("td", row).removeClass("markrowchecked");
            $("input.check_item", row).prop("checked", false);
          }

          $("#selected_ids_row_" + that.dataTableId + " span[row_id=\"" + row_id + "\"]", section).remove();

          that.selectOptions.unselect_callback(aData, that.selectOptions);
        } else {
          ids[row_id] = true;

          // Happens if row is not yet rendered (i.e. higher unvisited page)
          if (row != undefined) {
            $("td", row).addClass("markrowchecked");
            $("input.check_item", row).prop("checked", true);
          }

          var attr = {row_id:row_id, class:"radius label"};
          var contentHTML = $(row_name)
          if (contentHTML.length > 0) {
            var span = $("<span/>", attr).append(contentHTML);
            var textHTML = row_name.substring(contentHTML[0].outerHTML.length);
            span.append(textHTML);
          } else {
            var span = $("<span/>", attr).text(row_name);
          }
          $("#selected_ids_row_" + that.dataTableId, section).append(span);
          if(that.selectOptions.click && typeof that.selectOptions.click === "function"){
            span.attr("title",Locale.tr("just click if you want to delete the resource"));
            span.append($("<i/>",{class: "fas fa-times"}).css({"margin-left":"5px"}));
            span.off("click").on("click", that.selectOptions.click);
          }

          that.selectOptions.select_callback(aData, that.selectOptions);
        }

        if ($.isEmptyObject(ids)) {
          $("#selected_resource_multiple_" + that.dataTableId, section).hide();
          $("#select_resource_multiple_" + that.dataTableId, section).show();
        } else {
          $("#selected_resource_multiple_" + that.dataTableId, section).show();
          $("#select_resource_multiple_" + that.dataTableId, section).hide();
        }
        if(typeof externalFnClickElement === "function"){
          externalFnClickElement()
        }
        return true;
      };

      $("#" + that.dataTableId + " tbody", section).on("click", "tr", function() {
        var aData = that.dataTable.fnGetData(this);

        if(aData != undefined){
          row_click(this, aData);
        }
      });

      $(section).on("click", "#selected_ids_row_" + that.dataTableId + " span.fa.fa-times", function() {
        var row_id = $(this).parent("span").attr("row_id");

        var found = false;

        var aData = that.dataTable.fnGetData();
        // TODO: improve preformance, linear search
        $.each(aData, function(index, row) {
          if (row[that.selectOptions.id_index] === row_id) {
            found = true;
            row_click(that.dataTable.fnGetNodes(index), row);
            return false;
          }
        });

        if (!found) {
          var ids = $("#selected_ids_row_" + that.dataTableId, section).data("ids");
          delete ids[row_id];
          $("#selected_ids_row_" + that.dataTableId + " span[row_id=\"" + row_id + "\"]", section).remove();

          if ($.isEmptyObject(ids)) {
            $("#selected_resource_multiple_" + that.dataTableId, section).hide();
            $("#select_resource_multiple_" + that.dataTableId, section).show();
          } else {
            $("#selected_resource_multiple_" + that.dataTableId, section).show();
            $("#select_resource_multiple_" + that.dataTableId, section).hide();
          }
        }

        that.selectOptions.unselect_callback(aData, that.selectOptions);
      });
    } else {
      $("#" + that.dataTableId + " tbody", section).delegate("tr", "click", function(e) {
        that.dataTable.unbind("draw");
        var wasChecked = $("td.markrow", this).hasClass("markrow");
        var aData = that.dataTable.fnGetData(this);
        var check = aData != undefined && !wasChecked;

        $("td", that.dataTable).removeClass("markrow");
        $("td", this).toggleClass("markrow", check);
        $("tbody input.check_item", that.dataTable).prop("checked", check);

        $("#selected_resource_" + that.dataTableId, section).toggle(check);
        $("#select_resource_" + that.dataTableId, section).toggle(!check);

        $("#selected_resource_id_" + that.dataTableId, section)
          .val(function() { return check ? aData[that.selectOptions.id_index] : ""; }).trigger("change");
        $("#selected_resource_name_" + that.dataTableId, section)
          .text(function() { return check ? aData[that.selectOptions.name_index] : ""; }).trigger("change");

        $("#selected_resource_name_" + that.dataTableId, section).toggle(check);

        $("#selected_resource_id_" + that.dataTableId, section).removeData("pending_select");

        var callback = check ? "select_callback" : "unselect_callback";
        that.selectOptions[callback](aData, that.selectOptions);
        return true;
      });
    }

    Tips.setup(section);
  }

  function _resetResourceTableSelect() {
    var that = this;
    var section = $("#" + that.dataTableId + "Container");

    // TODO: do for multiple_choice

    // TODO: works for more than one page?

    $("td.markrow", that.dataTable).removeClass("markrow");
    $("tbody input.check_item", that.dataTable).prop("checked", false);

    $("#" + that.dataTableId + "_search", section).val("").trigger("input");
    $("#selected_resource_id_" + that.dataTableId, section).val("").trigger("change");
    $("#selected_resource_name_" + that.dataTableId, section).text("").trigger("change").hide();
    $("#refresh_button_" + that.dataTableId).click();

    $("#selected_resource_" + that.dataTableId, section).hide();
    $("#select_resource_" + that.dataTableId, section).show();

  }

  // Returns an ID, or an array of IDs for that.selectOptions.multiple_choice
  function _retrieveResourceTableSelect() {
    var that = this;
    var section = $("#" + that.dataTableId + "Container");

    if (that.selectOptions.multiple_choice) {
      var ids = $("#selected_ids_row_" + that.dataTableId, section).data("ids");

      var arr = [];

      $.each(ids, function(key, val) {
        arr.push(key);
      });

      return arr;
    } else {
      return $("#selected_resource_id_" + that.dataTableId, section).val();
    }
  }

  /**
   * Returns the jquery selector for the ID input. Can be used to add attributes
   * to it, such as 'wizard_field'
   * @return {Object} jquery selector for the ID input
   */
  function _idInput() {
    var that = this;
    var section = $("#" + that.dataTableId + "Container");

    if (that.selectOptions.multiple_choice) {
      return $("#selected_ids_row_" + that.dataTableId, section);
    } else {
      return $("#selected_resource_id_" + that.dataTableId, section);
    }
  }

  // Clicks the refresh button
  function _refreshResourceTableSelect() {
    var that = this;
    var section = $("#" + that.dataTableId + "Container");
    $("#refresh_button_" + that.dataTableId, section).click();
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

    var section = $("#" + that.dataTableId + "Container");

    if (that && that.selectOptions && that.selectOptions.multiple_choice) {
      that.refreshResourceTableSelect(section, that.dataTableId);

      var data_ids = {};

      $("#selected_ids_row_" + that.dataTableId + " span[row_id]", section).remove();

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
        var attr = {row_id:row_id, class:"radius label"};
        var span = $("<span/>",attr).text(row_name);

        if(that.selectOptions.click && typeof that.selectOptions.click === "function"){
          span.attr("title",Locale.tr("just click if you want to delete the resource"));
          span.append($("<i/>",{class: "fas fa-times"}).css({"margin-left":"5px"}));
          span.off("click").on("click", that.selectOptions.click);
        }

        $("#selected_ids_row_" + that.dataTableId, section).append(span);
      });

      $("#selected_ids_row_" + that.dataTableId, section).data("ids", data_ids);

      if ($.isEmptyObject(data_ids)) {
        $("#selected_resource_multiple_" + that.dataTableId, section).hide();
        $("#select_resource_multiple_" + that.dataTableId, section).show();
      } else {
        $("#selected_resource_multiple_" + that.dataTableId, section).show();
        $("#select_resource_multiple_" + that.dataTableId, section).hide();
      }

      that.dataTable.fnDraw();
    } else {
      $("td.markrow", that.dataTable).removeClass("markrow");
      $("tbody input.check_item", that.dataTable).prop("checked", false);

      $("#selected_resource_" + that.dataTableId, section).show();
      $("#select_resource_" + that.dataTableId, section).hide();

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
      }

      if (row_id !== undefined) {
        $("#selected_resource_id_" + that.dataTableId, section).val(row_id).trigger("change");
      }

      $("#selected_resource_name_" + that.dataTableId, section).text(row_name).trigger("change");
      $("#selected_resource_name_" + that.dataTableId, section).show();

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
                  (that.selectOptions.starred_icon + " " +
                    elementArray[that.selectOptions.name_index]);
            } else {
              elementArray[that.selectOptions.name_index] =
                  elementArray[that.selectOptions.name_index];
            }
          }

          list_array.push(elementArray);

          delete fixed_ids_map[this[that.xmlRoot].ID];
        }
      });

      that.updateView(null, list_array, true);

      var section = $("#" + that.dataTableId + "Container");
      var selectedResources = $("#selected_resource_id_" + that.dataTableId, section).data("pending_select");
      if (selectedResources != undefined){
        $("#selected_resource_id_" + that.dataTableId, section).removeData("pending_select");
        that.selectResourceTableSelect(selectedResources);
      }
    };

    var error_func = function(request, error_json, container) {
      success_func(request, []);
      Notifier.onError(request, error_json, container);
    };
    var pool_filter = SunstoneConfig.isChangedFilter()? -4 : -2;
    if (that.selectOptions.zone_id == undefined) {
      OpenNebula[that.resource].list({
        options: { force: that.conf.force_refresh || false },
        data : {pool_filter : pool_filter},
        timeout: true,
        success: success_func,
        error: error_func
      });
    } else {
      OpenNebula[that.resource].list_in_zone({
        options: { force: that.conf.force_refresh || false },
        data: {zone_id: that.selectOptions.zone_id, pool_filter : pool_filter},
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
    var pool_filter = SunstoneConfig.isChangedFilter()? -4 : -2;
    OpenNebula[that.resource].list({
      data : {pool_filter : pool_filter},
      success: function(req, resp) {
        that.updateView(req, resp);
      },
      error: Notifier.onError
    });
  }

  function _clearLabelsFilter() {
    LabelsUtils.clearLabelsFilter(this.dataTable, this.labelsColumn);
    LabelsUtils.insertLabelsMenu({"tabName": this.tabId});
  }

  function _getLabelsFilter() {
    return LabelsUtils.getLabelsFilter(this.dataTable);
  }

  function _deselectHiddenResources() {
    var id_index = this.selectOptions.id_index
    var currentSelect = this.retrieveResourceTableSelect()
    var ensuredCurrentSelected = Array.isArray(currentSelect) ? currentSelect : [currentSelect]
    ensuredCurrentSelected = ensuredCurrentSelected.filter(function(row) { return Boolean(row) })

    var ids = this.dataTable.fnGetData()
      .filter(function(res) { return ensuredCurrentSelected.includes(res[id_index]) })
      .map(function(res) { return res[id_index] })

    var deselectIds = ensuredCurrentSelected.filter(function(rowId) {
      return !ids.includes(rowId)
    })

    if (!!deselectIds.length) {
      Notifier.notifyMessage("Deselect " + this.resource + ": " + deselectIds.join(','));
    }

    this.selectResourceTableSelect({ ids });

    return ids
  }

  /**
   * Returns the selected data from a column by index.
   * 
   * @param {number} columnIndex - Column index
   * @returns {any[]} List of column data
   */
  function _getColumnDataInSelectedRows(columnIndex) {
    var selectedRowIds = this.retrieveResourceTableSelect();
    var allRows = this.dataTable.fnGetData();
    var id_index = this.selectOptions.id_index;

    var columnData = !Array.isArray(allRows) ? [] : allRows
      .filter(function(row) { return selectedRowIds.includes(row[id_index]) })
      .map(function(row) { return row[(columnIndex || id_index)] });

    return columnData;
  }
});
