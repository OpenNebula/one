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
  require('jquery');
  //require('foundation.reveal');
  //require('foundation.tab');
  //require('foundation.dropdown');

  var Config = require('sunstone-config');
  var Locale = require('utils/locale');
  var Notifier = require('utils/notifier');
  var Menu = require('utils/menu');

  var TOP_INTERVAL = 10000; //ms
  var CONFIRM_DIALOG_ID = require('utils/dialogs/confirm/dialogId');
  var CONFIRM_WITH_SELECT_DIALOG_ID = require('utils/dialogs/confirm-with-select/dialogId');

  var SunstoneCfg = {
    "actions" : {},
    "dialogs" : {},
    "dialogInstances" : {},
    "tabs" : {}
  };

  var _addMainTabs = function() {
    $.each(Config.enabledTabs, function(i, tabName){
      var name = './tabs/' + tabName;
      var tabObj = require(name);
      var _tabId = tabObj.tabId;
      SunstoneCfg["tabs"][_tabId] = tabObj;

      var actions = tabObj.actions;
      if (actions) {
        _addActions(actions)
      }

      var panels = tabObj.panels;
      if (panels) {
        _addPanels(_tabId, panels)
      }

      var panelsHooks = tabObj.panelsHooks;
      if (panelsHooks) {
        _addPanelsHooks(_tabId, panelsHooks);
      }

      var initHooks = tabObj.initHooks;
      if (initHooks) {
        _addInitHooks(_tabId, initHooks);
      }

      var dialogs = tabObj.dialogs;
      if (dialogs) {
        _addDialogs(dialogs)
      }

      var formPanels = tabObj.formPanels;
      if (formPanels) {
        _addFormPanels(_tabId, formPanels)
      }
    });
  }

  var _addActions = function(actions) {
    $.each(actions, function(actionName, action) {
      SunstoneCfg["actions"][actionName] = action;
    })
    return false;
  }

  var _addDialogs = function(dialogs) {
    $.each(dialogs, function(index, dialog) {
      SunstoneCfg['dialogs'][dialog.DIALOG_ID] = dialog
    })
    return false;
  }

  var _addPanelsHooks = function(tabId, hooks) {
    SunstoneCfg["tabs"][tabId]['panelsHooks'] = hooks;
    return false;
  }

  var _addInitHooks = function(tabId, hooks) {
    SunstoneCfg["tabs"][tabId]['initHooks'] = hooks;
    return false;
  }

  var _addPanels = function(tabId, panels) {
    var indexedPanels = {}
    $.each(panels, function(index, panel) {
      indexedPanels[panel.PANEL_ID] = panel
    })
    SunstoneCfg["tabs"][tabId]['panels'] = indexedPanels;
    return false;
  }

  var _addFormPanels = function(tabId, formPanels) {
    var indexedFormPanels = {}
    $.each(formPanels, function(index, formPanel) {
      indexedFormPanels[formPanel.FORM_PANEL_ID] = formPanel
    })
    SunstoneCfg["tabs"][tabId]['formPanels'] = indexedFormPanels;
    SunstoneCfg["tabs"][tabId]['formPanelInstances'] = {};
    return false;
  }

  //Inserts all main tabs in the DOM
  var _insertTabs = function() {
    for (tabName in SunstoneCfg["tabs"]) {
      _insertTab(tabName);
      _insertButtonsInTab(tabName);
      _setupDataTable(tabName);

      var hooks = SunstoneCfg['tabs'][tabName].initHooks;

      if (hooks) {
        $.each(hooks, function(i, hook){
          hook.init();
        });
      }

      // TODO Add openenbula actions
      /*if (config['view']['autorefresh']) {
        var tabContext = $("#" + tabName);
        var refreshButton = $(".fa-refresh", $(".action_blocks", tabContext).first());
        setInterval(function() {
          if (Sunstone.rightListVisible(tabContext)) {
            refreshButton.click();
          }
        }, TOP_INTERVAL);
      }*/
    }

    _setupTabs();
  }

  var _setupDataTable = function(tabName) {
    var dataTable = SunstoneCfg['tabs'][tabName].dataTable;
    if (dataTable) {
      dataTable.initialize();
      if (dataTable.labelsColumn) {
        $('#' + tabName + 'labels_buttons').html(
          '<button type="button" data-toggle="' + tabName + 'LabelsDropdown" class="only-sunstone-info only-sunstone-list top_button secondary button dropdown">' +
            '<i class="fa fa-tags"/></button>' +
          '<div id="' + tabName + 'LabelsDropdown" class="only-sunstone-info only-sunstone-list labels-dropdown dropdown-pane menu vertical" data-dropdown data-close-on-click="true"></div>').foundation();

      }
    }
  }

  //Inserts a main tab in the DOM. This is done by
  //adding the content to the proper div and by adding a list item
  //link to the navigation menu
  var _insertTab = function(tabName) {
    var tabInfo = SunstoneCfg['tabs'][tabName];
    var condition = tabInfo['condition'];
    var tabClass = tabInfo['tabClass'] ? tabInfo['tabClass'] : 'topTab';
    var parent = tabInfo['parentTab'] ? tabInfo['parentTab'] : '';

    //skip this tab if we do not meet the condition
    if (condition && !condition()) {return;}

    if (tabInfo.no_content === true) {
      tabClass += " tab_with_no_content is-accordion-submenu-parent"
    } else {
      tabInfo['tabName'] = tabName;
      var TabTemplate = require('hbs!sunstone/tab')
      $('div.sunstone-content').append(TabTemplate(tabInfo));
    }

    var liItem;
    var title = '';
    if (tabInfo.icon) {
      title += '<i class="fa fa-lg fa-fw ' + tabInfo.icon + '"></i> ';
    }
    title += tabInfo.title;

    if (parent !== '') {
      liItem = '<li id="li_' + tabName + '" class="' + tabClass + '">' + 
              '<a href="#">' + title + '</a>' + 
            '</li>';

      if ($('#menu ul#navigation #li_' + parent + ' .menu').length > 0) {
        $('#menu ul#navigation #li_' + parent + ' .menu').append(liItem);
      } else {
        $('#menu ul#navigation #li_' + parent).append(
            '<ul class="menu vertical nested" data-submenu>' +
              liItem +
            '</ul>')
      }
    } else {
      liItem = '<li id="li_' + tabName + '" class="' + tabClass + '">' + 
              '<a href="#">' + title + '</a>' + 
            '</li>';

      $('div#menu ul#navigation').append(liItem);
    }

    //if this is a submenu...
    //if (parent.length) {
    //  var children = $('div#menu ul#navigation #li_' + parent);
    //  //if there are other submenus, insert after last of them
    //  if (children.length) {
    //    $('div#menu li#li_' + tabName).hide();//hide by default
    //    $('div#menu li#li_' + parent + ' span').css("display", "inline-block");
    //  }
    //};

    if (tabInfo.forms) {
      $.each(tabInfo.forms, function(key, value) {
        Sunstone.addFormPanel(tabName, key, value)
      })
    }

    if (tabInfo.setup) {
      var context = $('div#' + tabName, $('div.sunstone-content'));

      tabInfo.setup(context);
    }
  };

  //If we have defined a block of action buttons in a tab,
  //this function takes care of inserting them in the DOM.
  var _insertButtonsInTab = function(tabName, panelName, panelButtons, customContext) {
    var buttons = panelButtons ? panelButtons : SunstoneCfg["tabs"][tabName]["buttons"];
    var buttonCode = "";
    var condition = null;

    var context, customId;
    if (customContext) {
      customId = customContext.attr("id");
      context = customContext;
    } else {
      customId = tabName;
      context = $('div#' + tabName, $('div.sunstone-content'));
    }

    var actionBlock = $('div.action_blocks', context)

    if (actionBlock.length) {

      var ButtonsTemplate = require('hbs!./sunstone/buttons')
      var buttonsRow = $(ButtonsTemplate({customId: customId, customContext: customContext}));

      //for every button defined for this tab...
      for (buttonName in buttons) {
        buttonCode = "";
        button = buttons[buttonName];

        //if we meet the condition we proceed. Otherwise we skip it.
        if (Config.isTabActionEnabled(tabName, buttonName, panelName) == false) {
          continue;
        }

        var type = button.type + '_button';
        var strClass = [type]
        switch (button.type) {
        case "select":
          break;
        case "image":
          strClass.push("action_button")
          break;
        case "create_dialog":
          strClass.push("action_button")
          strClass.push("top_button")
          break;
        default:
          strClass.push("top_button")
        }

        if (button.alwaysActive) {
          strClass.push("alwaysActive");
        }

        if (button.custom_classes) {
          strClass.push(button.custom_classes);
        }

        var buttonContext;
        var text;
        switch (button.layout) {
        case "create":
          buttonContext = $("#" + customId + "create_buttons", buttonsRow);
          icon = button.icon ? button.icon : '<i class="fa fa-plus"/>';
          text = button.text ? icon + ' ' + button.text : icon;
          strClass.push("success", "button");
          buttonCode = '<button class="' + strClass.join(' ') + '" href="' + buttonName + '">' + text + '</button>';
          break;
        case "refresh":
          buttonContext = $("#" + customId + "refresh_buttons", buttonsRow);
          icon = button.icon ? button.icon : '<i class="fa fa-refresh"/>';
          text = button.text ? icon + ' ' + button.text : icon;
          strClass.push("refresh", "button",  "secondary");
          buttonCode = '<button class="' + strClass.join(' ') + '" href="' + buttonName + '">' + text + '</button>';
          break;
        case "top":
          buttonContext = $("#" + customId + "refresh_buttons", buttonsRow);
          text = '<span class="fa-stack">' +
              '<i class="fa fa-refresh fa-stack-2x" style="color: #dfdfdf"></i>' +
              '<i class="fa fa-play fa-stack-1x"></i>' +
            '</span>';
          strClass.push("toggle_top_button", "only-sunstone-list", "button",  "hollow");
          buttonCode = '<a class="' + strClass.join(' ') + '" style="padding-left:0px; margin-right: 20px">' + text + '</a>';
          break;
        case "main":
          buttonContext = $("#" + customId + "main_buttons", buttonsRow);
          text = button.text;
          strClass.push("button");
          buttonCode = '<button class="' + strClass.join(' ') + '" href="' + buttonName + '">' + text + '</button>';
          break;
        case "vmsplay_buttons":
          buttonContext = $("#" + customId + "vmsplay_buttons", buttonsRow);
          text = button.text;
          strClass.push("button");
          buttonCode = '<button class="' + strClass.join(' ') + '" href="' + buttonName + '">' + text + '</button>';
          break;
        case "vmspause_buttons":
          buttonContext = $("#" + customId + "vmspause_buttons", buttonsRow);
          text = button.text;
          buttonCode = '<li><a class="' + strClass.join(' ') + '" href="' + buttonName + '">' + text + '</a></li>';
          break;
        case "vmsstop_buttons":
          buttonContext = $("#" + customId + "vmsstop_buttons", buttonsRow);
          text = button.text;
          buttonCode = '<li><a class="' + strClass.join(' ') + '" href="' + buttonName + '">' + text + '</a></li>';
          break;
        case "vmsrepeat_buttons":
          buttonContext = $("#" + customId + "vmsrepeat_buttons", buttonsRow);
          text = button.text;
          buttonCode = '<li><a class="' + strClass.join(' ') + '" href="' + buttonName + '">' + text + '</a></li>';
          break;
        case "vmsdelete_buttons":
          buttonContext = $("#" + customId + "vmsdelete_buttons", buttonsRow);
          text = button.text;
          buttonCode = '<li><a class="' + strClass.join(' ') + '" href="' + buttonName + '">' + text + '</a></li>';
          break;
        case "vmsplanification_buttons":
          buttonContext = $("#" + customId + "vmsplanification_buttons", buttonsRow);
          text = button.text;
          buttonCode = '<li><a class="' + strClass.join(' ') + '" href="' + buttonName + '">' + text + '</a></li>';
          break;
        case "more_select":
          buttonContext = $("#" + customId + "more_buttons", buttonsRow);
          text = button.text;
          buttonCode = '<li><a class="' + strClass.join(' ') + '" href="' + buttonName + '">' + text + '</a></li>';
          break;
        case "user_select":
          buttonContext = $("#" + customId + "user_buttons", buttonsRow);
          text = button.text;
          buttonCode = '<li><a class="' + strClass.join(' ') + '" href="' + buttonName + '">' + text + '</a></li>';
          break;
        case "del":
          buttonContext = $("#" + customId + "delete_buttons", buttonsRow);
          text = '<i class=" fa fa-trash-o"/> ';
          strClass.push("alert", "button");
          buttonCode = '<button class="' + strClass.join(' ') + '" href="' + buttonName + '">' + text + '</button>';
          break;
        default:
          buttonContext = $("#" + customId + "main_buttons", buttonsRow);
          text = button.text;
          strClass.push("button");
          buttonCode = '<button class="' + strClass.join(' ') + '" href="' + buttonName + '">' + text + '</button>';
        }

        buttonContext.append(buttonCode);
      }//for each button in tab
      //$('.top_button',actionBlock).button();
      //$('.top_button',actionBlock).addClass("secondary small button")

      actionBlock.append(buttonsRow);
      //actionBlock.foundation();
      Foundation.reflow(actionBlock, 'dropdown');

      if ($("#" + customId + "more_buttons li", actionBlock).length == 0) {
        $("button[data-toggle=" + customId + "more_buttons]", actionBlock).remove()
      }

      if ($("#" + customId + "user_buttons li", actionBlock).length == 0) {
        $("button[data-toggle=" + customId + "user_buttons]", actionBlock).remove()
      }

      if ($("#" + customId + "vmsplanification_buttons li", actionBlock).length == 0) {
        $("button[data-toggle=" + customId + "vmsplanification_buttons]", actionBlock).remove()
      }

      if ($("#" + customId + "vmsdelete_buttons li", actionBlock).length == 0) {
        $("button[data-toggle=" + customId + "vmsdelete_buttons]", actionBlock).remove()
      }

      if ($("#" + customId + "vmsstop_buttons li", actionBlock).length == 0) {
        $("button[data-toggle=" + customId + "vmsstop_buttons]", actionBlock).remove()
      }

      if ($("#" + customId + "vmspause_buttons li", actionBlock).length == 0) {
        $("button[data-toggle=" + customId + "vmspause_buttons]", actionBlock).remove()
      }

      if ($("#" + customId + "vmsrepeat_buttons li", actionBlock).length == 0) {
        $("button[data-toggle=" + customId + "vmsrepeat_buttons]", actionBlock).remove()
      }

      if ($("#" + customId + "user_buttons li", actionBlock).length == 0) {
        $("button[data-toggle=" + customId + "user_buttons]", actionBlock).remove()
      }
      //actionBlock.foundationButtons();
      $('.top_button, .list_button', actionBlock).prop('disabled', false);
      $('.top_button, .list_button', actionBlock).prop('disabled', true);
      $('.create_dialog_button', actionBlock).prop('disabled', false).removeAttr('disabled');
      $('.alwaysActive', actionBlock).prop('disabled', false).removeAttr('disabled');

      $('#' + customId + 'reset_button', actionBlock).on("click", function() {
        _resetFormPanel(tabName);
        return false;
      })

      $('.submit_button', actionBlock).on("click", function() {
        _submitFormPanel(tabName);
        return false;
      })
    }//if tab exists
  }

  var _setupButtons = function() {
    //Listen for .action_buttons
    //An action buttons runs a predefined action. If it has type
    //"multiple" it runs that action on the elements of a datatable.
    $(document).on("click", '.action_button', function() {
      var error = 0;
      var value = $(this).val()
      if ($.isEmptyObject(value)) {
        value = $(this).attr('href');
      }

      /*if (!$(this).hasClass("refresh")) {
        $(document).foundation('dropdown', 'closeall');
      }*/

      var action = SunstoneCfg["actions"][value];
      if (!action) {
        Notifier.notifyError("Action " + value + " not defined.");
        return false;
      };
      switch (action.type){
      case "multiple": //find the datatable
        var context = $(this).parents(".tab");
        var nodes = action.elements();
        error = _runAction(value, nodes);
        break;
      default:
        error = _runAction(value);
      }

      return false;
    });

    //Listen .confirm_buttons. These buttons show a confirmation dialog
    //before running the action.
    $(document).on("click", '.confirm_button', function() {
      var dialogInstance = _getDialogInstance(CONFIRM_DIALOG_ID)
      $('#' + CONFIRM_DIALOG_ID).data('buttonAction', $(this).attr('href'));
      $('#' + CONFIRM_DIALOG_ID).data('buttonTab', $(this).parents('.tab').attr('id'));
      dialogInstance.show();
      return false;
    });

    //Listen .confirm_buttons. These buttons show a confirmation dialog
    //with a select box before running the action.
    $(document).on("click", '.confirm_with_select_button', function() {
      var dialogInstance = _getDialogInstance(CONFIRM_WITH_SELECT_DIALOG_ID);

      dialogInstance.setParams({
        'buttonAction' : $(this).attr('href'),
        'buttonTab' : $(this).parents('.tab').attr('id')
      });

      dialogInstance.reset();
      dialogInstance.show();

      return false;
    });

    //$(document).foundation('dropdown', 'reflow');

    // Button to return to the list view from the detailed view
    $(document).on("click", "button[href='back']", function(e) {
      $(".navigation-active-li a", $("#navigation")).click();
      e.preventDefault();
    });
  }

  var _setupTabs = function() {
    Foundation.reflow($('#menu'), 'accordion-menu');
    Foundation.reflow($('div.sunstone-content'), 'sticky')
    var topTabs = $(".sunstone-menu-content ul li.topTab");
    var subTabs = $(".sunstone-menu-content ul li.subTab > a");

    subTabs.on("click", function() {
      if ($(this).closest('li').hasClass('topTab')) {
        return false;
      } else {
        var tabName = $(this).closest('li').attr('id').substring(3);
        _showTab(tabName);
        return false;
      }
    });

    topTabs.on("click", function(e) {
      var tabName = $(this).attr('id').substring(3);

      if ($(this).hasClass("tab_with_no_content")) {
        //Subtabs have a class with the name of  this tab
        //var subtabs = $('div#menu li.' + tabName);
        //subtabs.fadeToggle('fast');
        return false;
      } else {
        _showTab(tabName);
        return false;
      }
    });

    _setupButtons();
  };

  var _showRighList = function(tabName) {
    var tab = $('#' + tabName);
    $(".tab").hide();
    tab.show();

    $(".sunstone-info", tab).hide();
    $(".sunstone-form", tab).hide();
    $(".sunstone-list", tab).fadeIn();
    $(".only-sunstone-info", tab).hide();
    $(".only-sunstone-form", tab).hide();
    $(".only-sunstone-list", tab).fadeIn();
    $('.action_blocks', tab).removeClass('large-12').addClass('large-9');
  };

  var _showRighInfo = function(tabName) {
    var tab = $('#' + tabName);
    $(".tab").hide();
    tab.show();

    $(".sunstone-list", tab).hide();
    $(".sunstone-form", tab).hide();
    $(".sunstone-info", tab).fadeIn();
    $(".only-sunstone-list", tab).hide();
    $(".only-sunstone-form", tab).hide();
    $(".only-sunstone-info", tab).fadeIn();
    $('.action_blocks', tab).removeClass('large-9').addClass('large-12');
  }

  var _showTab = function(tabName) {
    $('.labels-tree', '#navigation').remove();

    if (!SunstoneCfg['tabs'][tabName]) {
      return false;
    }

    // Hide the menu in small windows
    Menu.entryClick();

    // TODO check if necessary
    // last_selected_row = null;

    if (tabName.indexOf('#') == 0) {
      tabName = tabName.substring(1);
    }

    //clean selected menu
    $("#navigation li").removeClass("navigation-active-li");
    $("#navigation li#li_" + tabName).addClass("navigation-active-li");

    var tab = $('#' + tabName);
    //show tab
    _showRighList(tabName);

    var dataTable = SunstoneCfg['tabs'][tabName]['dataTable'];
    if (dataTable) {
      if (dataTable.clearLabelsFilter) {
        dataTable.clearLabelsFilter();
      }
      dataTable.recountCheckboxes();
    }

    var res = SunstoneCfg['tabs'][tabName]['resource']
    if (res) {
      Sunstone.runAction(res + ".refresh");
    }
  }

  var _showElement = function(tabName, infoAction, elementId) {
    _showTab(tabName);

    var context = $('#' + tabName);

    $(".resource-id", context).html(elementId);
    $(".resource-info-header", context).text("");

    var loading = '<div style="margin-top: 20px; text-align: center; width: 100%"><img src="images/pbar.gif" alt="loading..." /></div>';
    $(".sunstone-info", context).html(loading);
    _showRighInfo(tabName);

    Sunstone.runAction(infoAction, elementId);
    //enable action buttons
    $('.top_button, .list_button', context).attr('disabled', false);
  }

  // Returns the element that is currently shown in the right info
  var _getElementRightInfo = function(tabName, context) {
    var context = context || $(".sunstone-info", $("#" + tabName));
    return context.data('element');
  }

  var _insertPanels = function(tabName, info, contextTabId, context) {
    var context = context || $(".sunstone-info", $("#" + tabName));

    context.data('element', info[Object.keys(info)[0]]);

    var containerId = tabName + '-panels';
    var activaTab = $("li.is-active a", $("#" + containerId));
    if (activaTab) {
      var activaTabHref = activaTab.attr('href');
    }

    var isRefresh = (activaTabHref != undefined);
    var prevPanelInstances = SunstoneCfg['tabs'][tabName]["panelInstances"];
    var prevPanelStates = {};

    if(isRefresh && prevPanelInstances != undefined){
      $.each(prevPanelInstances, function(panelName, panel) {
        if(panel.getState){
          prevPanelStates[panelName] = panel.getState(context);
        }
      });
    }

    var hooks = SunstoneCfg['tabs'][tabName].panelsHooks;

    if (hooks) {
      $.each(hooks, function(i, hook){
        hook.pre(info, (contextTabId||tabName));
      });
    }

    var panels = SunstoneCfg['tabs'][tabName].panels;
    var active = false;
    var templatePanelsParams = []
    SunstoneCfg['tabs'][tabName]["panelInstances"] = {};

    $.each(panels, function(panelName, Panel) {
      if (Config.isTabPanelEnabled((contextTabId||tabName), panelName)) {
        if (activaTabHref) {
          if (activaTabHref == "#" + panelName) {
            active = true;
          }
        } else {
          activaTabHref = "#" + panelName
          active = true;
        }

        try {
          var panelInstance = new Panel(info, contextTabId);
          SunstoneCfg['tabs'][tabName]["panelInstances"][panelName] = panelInstance;
          templatePanelsParams.push({
            'panelName': panelName,
            'icon': panelInstance.icon,
            'title': panelInstance.title,
            'html': panelInstance.html(),
            'active': active
          })
        } catch (err) {
          console.log(err);
        }

        active = false;
      }
    });

    var TemplatePanels = require('hbs!./sunstone/panels');
    var html = TemplatePanels({
      'containerId': containerId,
      'panels': templatePanelsParams
    })

    context.html(html);
    $.each(SunstoneCfg['tabs'][tabName]["panelInstances"], function(panelName, panel) {
      panel.setup(context);

      if(isRefresh && prevPanelStates[panelName] && panel.setState){
        panel.setState( prevPanelStates[panelName], context );
      }
    });

    $('#' + containerId + 'Tabs', context).on('change.zf.tabs', function(target) {
      var tabIdWithHash = $('.is-active > a', this)[0].hash;
      var panel = SunstoneCfg['tabs'][tabName]["panelInstances"][tabIdWithHash.substring(1)];
      if (panel && panel.onShow) {
        panel.onShow(context);
      }
    });

    Foundation.reflow(context, 'tabs');

    //context.foundation();
    $('[href="' + activaTabHref + '"]', context).trigger("click");

    if (hooks) {
      $.each(hooks, function(i, hook){
        hook.post(info, (contextTabId||tabName));
      });
    }
  }

  //Runs a predefined action. Wraps the calls to opennebula.js and
  //can be use to run action depending on conditions and notify them
  //if desired. Returns 1 if some problem has been detected: i.e
  //the condition to run the action is not met, the action is not found
  var _runAction = function(action, dataArg, extraParam) {
    var actions = SunstoneCfg["actions"];
    if (!actions[action]) {
      Notifier.notifyError("Action " + action + " not defined");
      return 1;
    }

    var actionCfg = actions[action];
    var notify = actionCfg.notify;

    var condition = actionCfg["condition"];

    //Is the condition to run the action met?
    //Should we inform if it is not met?
    if (condition && !condition()) {
      if (notify) {
        Notifier.notifyError("This action cannot be run");
      }
      return 1;
    }

    var call = actionCfg["call"];
    var callback = actionCfg["callback"];
    var err = actionCfg["error"];

    switch (actionCfg.type){
    case "create":
    case "register":
      call({data:dataArg, success: callback, error:err});
      break;
    case "single":
      if (extraParam) {
        call({
          data:{
            id:dataArg,
            extra_param: extraParam
          },
          success: callback, error:err
        });
      } else {
        call({data:{id:dataArg}, success: callback, error:err});
      };
      break;
    case "list":
      call({success: callback, error:err, options:dataArg});
      break;
    case "monitor_global":
      call({
          timeout: true,
          success: callback,
          error:err,
          data: {monitor: dataArg}});
      break;
    case "monitor":
    case "monitor_single":
      call({
          timeout: true,
          success: callback,
          error:err,
          data: {id:dataArg, monitor: extraParam}});
      break;
    case "multiple":
      $.each(dataArg, function() {
        if (extraParam) {
          call({
                        data:{
                          id:this,
                          extra_param:extraParam
                        },
                        success: callback,
                        error: err});
        } else {
          call({
              data:{id:this},
              success: callback,
              error:err});
        }
      });
      break;
    default:
      if (dataArg && extraParam) {
        call(dataArg, extraParam);
      } else if (dataArg) {
        call(dataArg);
      } else {
        call();
      }
    }

    if (notify) {
      Notifier.notifySubmit(action, dataArg, extraParam);
    }

    return 0;
  }

  function _showFormPanel(tabId, formPanelId, action, onShow2) {
    var context = $("#" + tabId);
    _popFormPanelLoading(tabId);
    _showFormPanelSubmit(tabId);

    setTimeout(function() {
      var tab = SunstoneCfg["tabs"][tabId];
      var formPanelInstance = tab["formPanelInstances"][formPanelId];

      var formContext = $("#" + tabId+" div[form-panel-id="+formPanelId+"]");

      if (!formPanelInstance) {
        formContext =
        $('<div class="tabs-content tabs-contentForm" ' +
                'data-tabs-content="' + tab.tabName + 'FormTabs" ' +
                'form-panel-id="'+formPanelId+'">\
          <div class="wizardForms tabs-panel is-active" id="'+tab.tabName+'-wizardForms"></div>\
          <div class="advancedForms tabs-panel" id="'+tab.tabName+'-advancedForms"></div>\
        </div>').appendTo( $(".contentForm", context) );

        // Create panelInstance, insert in the DOM and setup
        var formPanel = tab["formPanels"][formPanelId];
        if (!formPanel) {
          console.log("Form Panel not defined");
          return false;
        } // Panel not defined

        Foundation.reflow(context, 'tabs');

        formPanelInstance = new formPanel();
        tab["formPanelInstances"][formPanelId] = formPanelInstance;
        formPanelInstance.insert(formContext);
      }

      if (action != undefined){
        formPanelInstance.setAction(formContext, action);
      }

      tab["activeFormPanel"] = formPanelInstance;

      // Hide wizard/advanced selector if advanced not defined
      if (formPanelInstance.htmlAdvanced) {
        $(".wizard_tabs", context).show();
      } else {
        $(".wizard_tabs", context).hide();
        $('a[href="#'+tab.tabName+'-wizardForms"]', context).click();
      }

      // Hide reset button if not defined
      if (formPanelInstance.resetButton()) {
        $(".reset_button", context).show();
      } else {
        $(".reset_button", context).hide();
      }

      _hideFormPanelLoading(tabId);

      formPanelInstance.onShow(formContext);
      if (onShow2) {
        onShow2(formPanelInstance, formContext);
      }
    }, 13)
  }

  var _submitFormPanel = function(tabId) {
    var context = $("#" + tabId);
    //_popFormPanelLoading(tabId);
    // Workaround until Foundation.abide support hidden forms
    
    var context = $("#" + tabId);
    $(".sunstone-form-title", context).text(Locale.tr("Submitting..."));
    $(".submit_button", context).text(Locale.tr("Submitting..."));

    _disableFormPanelSubmit(tabId);

    setTimeout(function() {
      var formPanelInstance = SunstoneCfg["tabs"][tabId].activeFormPanel

      if ($(".wizardForms.is-active", context).length > 0) {
        $('#' + formPanelInstance.formPanelId + 'Wizard').submit();
      } else if ($(".advancedForms.is-active", context).length > 0) {
        $('#' + formPanelInstance.formPanelId + 'Advanced').submit();
      }
    }, 13)
  }

  var _resetFormPanel = function(tabId, formPanelId) {
    _popFormPanelLoading(tabId);

    setTimeout(function() {
      var formPanelInstance;
      if (formPanelId) {
        formPanelInstance = SunstoneCfg["tabs"][tabId]['formPanelInstances'][formPanelId];
      } else {
        formPanelInstance = SunstoneCfg["tabs"][tabId].activeFormPanel;
      }

      if (formPanelInstance) {
        var context = $("#" + tabId+" div[form-panel-id="+formPanelInstance.formPanelId+"]");

        formPanelId = formPanelInstance.formPanelId;

        formPanelInstance.reset(context);
      }

      if (_formPanelVisible($("#"+tabId))){
        _showFormPanel(tabId, formPanelId);
      }
    }, 13)
  }

  /**
   * Hides the form panel loading (spinning icon on submit), and resets
   * the header and submit button texts
   *
   * @param  {String} tabId TAB_ID. Optional, if it is not provided the current
   *                        tab will be used
   */
  function _hideFormPanelLoading(tabId) {
    var context;
    if (tabId){
      context = $("#" + tabId);
    } else {
      context = $(".tab:visible");  // current tab
      tabId = context.attr("id");
    }
    //$(".sunstone-form", context).html(content);

    $(".loadingForm", context).hide();
    $(".tabs-contentForm", context).hide();

    var formPanelInstance = SunstoneCfg["tabs"][tabId].activeFormPanel;
    if (formPanelInstance) {
      // Set title and button strings
      $(".sunstone-form-title", context).text(formPanelInstance.title());
      $(".submit_button", context).text(formPanelInstance.buttonText());

      $("div[form-panel-id="+formPanelInstance.formPanelId+"]", context).fadeIn();
    }

    _enableFormPanelSubmit(tabId);
  }

  function _hideFormPanel(tabId) {
    var context = $("#" + tabId);
    $('[href="back"]', context).trigger("click");
  }

  function _popFormPanelLoading(tabId) {
    var context = $("#" + tabId);
    $(".sunstone-list", context).hide();
    $(".sunstone-info", context).hide();
    $(".sunstone-form", context).show();
    $(".only-sunstone-list", context).hide();
    $(".only-sunstone-info", context).hide();
    $(".only-sunstone-form", context).show();
    $('.action_blocks', context).removeClass('large-9').addClass('large-12');

    $(".sunstone-form-title", context).text(Locale.tr("Loading..."));
    $(".submit_button", context).text(Locale.tr("Loading..."));
    _disableFormPanelSubmit(tabId);

    $(".tabs-contentForm", context).hide();
    $(".loadingForm", context).show();
  }

  function _disableFormPanelSubmit(tabId) {
    var context = $("#" + tabId);
    $(".submit_button", context).
        attr("disabled", "disabled").
        on("click.disable", function(e) { return false; });
  }

  function _enableFormPanelSubmit(tabId) {
    var context = $("#" + tabId);
    $(".submit_button", context).
        removeAttr("disabled").
        off("click.disable");
  }

  function _hideFormPanelSubmit(tabId) {
    var context = $("#" + tabId);
    $(".submit_button", context).hide();
  }

  function _showFormPanelSubmit(tabId) {
    var context = $("#" + tabId);
    $(".submit_button", context).show();
  }

  var _getButton = function(tadId, buttonName) {
    var button = null;
    var buttons = SunstoneCfg["tabs"][tadId]["buttons"];
    button = buttons[buttonName];
    //not found, is it in the list then?
    if (!button && buttons["action_list"]) {
      button = buttons["action_list"]["actions"][buttonName];
    }
    return button;
  }

  var _rightInfoVisible = function(context) {
    return $(".sunstone-info", context).is(':visible');
  }

  var _rightListVisible = function(context) {
    return $(".sunstone-list", context).is(':visible');
  }

  var _formPanelVisible = function(context) {
    return $(".sunstone-form", context).is(':visible');
  }

  var _rightInfoResourceId = function(context) {
    return $(".resource-id", context).text();
  }

  var _getAction = function(actionId) {
    return SunstoneCfg["actions"][actionId];
  }

  var _getDataTable = function(tabName) {
    if (SunstoneCfg['tabs'][tabName]) {
      return SunstoneCfg['tabs'][tabName].dataTable;
    }
  }

  var _getResource = function(tabName) {
    if (SunstoneCfg['tabs'][tabName]) {
      return SunstoneCfg['tabs'][tabName].resource;
    }
  }

  var _getDialogInstance = function(dialogId) {
    var dialogInstance = SunstoneCfg['dialogInstances'][dialogId];
    if (dialogInstance == undefined) {
      var Dialog = SunstoneCfg['dialogs'][dialogId]
      var dialogInstance = new Dialog();
      dialogInstance.insert();
      SunstoneCfg['dialogInstances'][dialogId] = dialogInstance;
    }

    return dialogInstance;
  }

  var Sunstone = {
    "addMainTabs": _addMainTabs,
    "addDialogs": _addDialogs,

    "insertTabs": _insertTabs,
    "insertPanels": _insertPanels,
    "getElementRightInfo": _getElementRightInfo,

    'showTab': _showTab,
    "showElement" : _showElement,

    "showFormPanel": _showFormPanel,
    "resetFormPanel": _resetFormPanel,
    "hideFormPanel": _hideFormPanel,
    "hideFormPanelLoading": _hideFormPanelLoading,
    "disableFormPanelSubmit": _disableFormPanelSubmit,
    "enableFormPanelSubmit": _enableFormPanelSubmit,
    "hideFormPanelSubmit": _hideFormPanelSubmit,
    "showFormPanelSubmit": _showFormPanelSubmit,


    "rightInfoVisible": _rightInfoVisible,
    "rightListVisible": _rightListVisible,
    "rightInfoResourceId": _rightInfoResourceId,

    "runAction" : _runAction,
    "getAction": _getAction,
    "getButton": _getButton,
    "getDataTable": _getDataTable,
    "getResource": _getResource,
    "getDialog": _getDialogInstance,

    "insertButtonsInTab": _insertButtonsInTab,

    "TOP_INTERVAL": TOP_INTERVAL
  }

  return Sunstone;
});
