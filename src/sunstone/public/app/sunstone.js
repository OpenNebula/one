define(function(require) {
  require('jquery');
  require('foundation.reveal');
  require('foundation.tab');
  require('foundation.dropdown');

  var Config = require('sunstone-config');
  var Locale = require('utils/locale');
  var Notifier = require('utils/notifier');

  var TOP_INTERVAL = 10000; //ms
  var CONFIRM_DIALOG_ID = require('utils/dialogs/confirm/dialogId');
  var CONFIRM_WITH_SELECT_DIALOG_ID = require('utils/dialogs/confirm-with-select/dialogId');

  var SunstoneCfg = {
    "actions" : {},
    "dialogs" : {},
    "dialogInstances" : {},
    "tabs" : {}
  };

  var _addMainTab = function(tabObj) {
    var _tabId = tabObj.tabId;
    if (Config.isTabEnabled(_tabId)) {
      SunstoneCfg["tabs"][_tabId] = tabObj;
      
      var actions = tabObj.actions;
      if (actions) {
        _addActions(actions)
      }

      var panels = tabObj.panels;
      if (panels) {
        _addPanels(_tabId, panels)
      }

      var dialogs = tabObj.dialogs;
      if (dialogs) {
        _addDialogs(dialogs)
      }

      var formPanels = tabObj.formPanels;
      if (formPanels) {
        _addFormPanels(_tabId, formPanels)
      }
    }
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
    if (SunstoneCfg['tabs'][tabName].dataTable) {
      SunstoneCfg['tabs'][tabName].dataTable.initialize();
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
      tabClass += " tab_with_no_content"
    } else {
      tabInfo['tabName'] = tabName;
      var TabTemplate = require('hbs!sunstone/tab')
      $('div.right-content').append(TabTemplate(tabInfo));
    }

    var liItem = '<li id="li_' + tabName + '" class="' + tabClass + ' ' + parent + '"><a href="#">' + tabInfo.title + '</a></li>';

    $('div#menu ul#navigation').append(liItem);

    //if this is a submenu...
    if (parent.length) {
      var children = $('div#menu ul#navigation #li_' + parent);
      //if there are other submenus, insert after last of them
      if (children.length) {
        $('div#menu li#li_' + tabName).hide();//hide by default
        $('div#menu li#li_' + parent + ' span').css("display", "inline-block");
      }
    };

    if (tabInfo.forms) {
      $.each(tabInfo.forms, function(key, value) {
        Sunstone.addFormPanel(tabName, key, value)
      })
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
      context = $('div#' + tabName, $('div.right-content'));
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
          strClass.push("success", "button", "small", "radius");
          buttonCode = '<button class="' + strClass.join(' ') + '" href="' + buttonName + '">' + text + '</button>';
          break;
        case "refresh":
          buttonContext = $("#" + customId + "refresh_buttons", buttonsRow);
          text = '<span class="fa-stack">' +
              '<i class="fa fa-refresh fa-stack-lg" style="font-size: 1.5em"></i>' +
              //'<i class="fa fa-play fa-stack-1x"></i>'+
            '</span>';
          strClass.push("white_button", "refresh", "secondary", "button", "small", "radius");
          buttonCode = '<a class="' + strClass.join(' ') + '" href="' + buttonName + '" style="padding-left: 5px">' + text + '</a>';
          break;
        case "top":
          buttonContext = $("#" + customId + "refresh_buttons", buttonsRow);
          text = '<span class="fa-stack">' +
              '<i class="fa fa-refresh fa-stack-2x" style="color: #dfdfdf"></i>' +
              '<i class="fa fa-play fa-stack-1x"></i>' +
            '</span>';
          strClass.push("white_button", "toggle_top_button", "only-right-list", "secondary", "button", "small", "radius");
          buttonCode = '<a class="' + strClass.join(' ') + '" style="padding-left:0px; margin-right: 20px">' + text + '</a>';
          break;
        case "main":
          buttonContext = $("#" + customId + "main_buttons", buttonsRow);
          text = button.text;
          strClass.push("secondary", "button", "small", "radius");
          buttonCode = '<button class="' + strClass.join(' ') + '" href="' + buttonName + '">' + text + '</button>';
          break;
        case "vmsplay_buttons":
          buttonContext = $("#" + customId + "vmsplay_buttons", buttonsRow);
          text = button.text;
          strClass.push("secondary", "button", "small", "radius");
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
          strClass.push("alert", "button", "small", "radius");
          buttonCode = '<button class="' + strClass.join(' ') + '" href="' + buttonName + '">' + text + '</button>';
          break;
        default:
          buttonContext = $("#" + customId + "main_buttons", buttonsRow);
          text = button.text;
          strClass.push("secondary", "button", "small", "radius");
          buttonCode = '<button class="' + strClass.join(' ') + '" href="' + buttonName + '">' + text + '</button>';
        }

        buttonContext.append(buttonCode);
      }//for each button in tab
      //$('.top_button',actionBlock).button();
      //$('.top_button',actionBlock).addClass("secondary small button")

      actionBlock.append(buttonsRow);

      if ($("#" + customId + "more_buttons li", actionBlock).length == 0) {
        $("a[data-dropdown=" + customId + "more_buttons]", actionBlock).remove()
      }

      if ($("#" + customId + "user_buttons li", actionBlock).length == 0) {
        $("a[data-dropdown=" + customId + "user_buttons]", actionBlock).remove()
      }

      if ($("#" + customId + "vmsplanification_buttons li", actionBlock).length == 0) {
        $("a[data-dropdown=" + customId + "vmsplanification_buttons]", actionBlock).remove()
      }

      if ($("#" + customId + "vmsdelete_buttons li", actionBlock).length == 0) {
        $("a[data-dropdown=" + customId + "vmsdelete_buttons]", actionBlock).remove()
      }

      if ($("#" + customId + "vmsstop_buttons li", actionBlock).length == 0) {
        $("a[data-dropdown=" + customId + "vmsstop_buttons]", actionBlock).remove()
      }

      if ($("#" + customId + "vmspause_buttons li", actionBlock).length == 0) {
        $("a[data-dropdown=" + customId + "vmspause_buttons]", actionBlock).remove()
      }

      if ($("#" + customId + "vmsrepeat_buttons li", actionBlock).length == 0) {
        $("a[data-dropdown=" + customId + "vmsrepeat_buttons]", actionBlock).remove()
      }

      if ($("#" + customId + "user_buttons li", actionBlock).length == 0) {
        $("a[data-dropdown=" + customId + "user_buttons]", actionBlock).remove()
      }
      //actionBlock.foundationButtons();
      $('.top_button, .list_button', actionBlock).attr('disabled', false);
      $('.top_button, .list_button', actionBlock).attr('disabled', true);
      $('.create_dialog_button', actionBlock).attr('disabled', false);
      $('.alwaysActive', actionBlock).attr('disabled', false);

      $('#' + customId + 'reset_button', actionBlock).on("click", function() {
        _resetFormPanel(tabName);
        return false;
      })

      $('#' + customId + 'submit_button', actionBlock).on("click", function() {
        _submitFormPanel(tabName);
        return false;
      })

      $(document).foundation();
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

      if (!error && !$(this).hasClass("refresh")) {
        //proceed to close confirm dialog in
        //case it was open
        _getDialogInstance(CONFIRM_DIALOG_ID).hide();
      };

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
      $('#' + CONFIRM_WITH_SELECT_DIALOG_ID).data('buttonAction', $(this).attr('href'));
      $('#' + CONFIRM_WITH_SELECT_DIALOG_ID).data('buttonTab', $(this).parents('.tab').attr('id'));
      dialogInstance.show();
      return false;
    });

    $(document).foundation('reflow', 'dropdown');

    // Button to return to the list view from the detailed view
    $(document).on("click", "a[href='back']", function(e) {
      $(".navigation-active-li a", $("#navigation")).click();
      e.preventDefault();
    });
  }

  var _setupTabs = function() {
    var topTabs = $(".left-content ul li.topTab");
    var subTabs = $(".left-content ul li.subTab");

    subTabs.on("click", function() {
      if ($(this).hasClass('topTab')) {
        return false;
      } else {
        var tabName = $(this).attr('id').substring(3);
        _showTab(tabName);
        return false;
      }
    });

    topTabs.on("click", function(e) {
      var tabName = $(this).attr('id').substring(3);

      if ($(this).hasClass("tab_with_no_content")) {
        //Subtabs have a class with the name of  this tab
        var subtabs = $('div#menu li.' + tabName);
        subtabs.fadeToggle('fast');
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

    $(".right-info", tab).hide();
    $(".right-form", tab).hide();
    $(".right-list", tab).show();
    $(".only-right-info", tab).hide();
    $(".only-right-form", tab).hide();
    $(".only-right-list", tab).show();
  };

  var _showRighInfo = function(tabName) {
    var tab = $('#' + tabName);
    $(".tab").hide();
    tab.show();

    $(".right-list", tab).hide();
    $(".right-form", tab).hide();
    $(".right-info", tab).show();
    $(".only-right-list", tab).hide();
    $(".only-right-form", tab).hide();
    $(".only-right-info", tab).show();
  }

  var _showTab = function(tabName) {
    if (!SunstoneCfg['tabs'][tabName]) {
      return false;
    }

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

    // TODO Add recountCheckboxes
    //recountCheckboxes($(".dataTable", tab).first());

    var res = SunstoneCfg['tabs'][tabName]['resource']
    if (res) {
      Sunstone.runAction(res + ".list");
    }
  }

  var _showElement = function(tabName, infoAction, elementId) {
    _showTab(tabName);

    var context = $('#' + tabName);

    $(".resource-id", context).html(elementId);
    $(".resource-info-header", context).text("");

    var loading = '<div style="margin-top: 20px; text-align: center; width: 100%"><img src="images/pbar.gif" alt="loading..." /></div>';
    $(".right-info", context).html(loading);
    _showRighInfo(tabName);

    Sunstone.runAction(infoAction, elementId);
    //enable action buttons
    $('.top_button, .list_button', context).attr('disabled', false);
  }

  var _insertPanels = function(tabName, info) {
    var context = $(".right-info", $("#" + tabName));
    var containerId = tabName + '-panels';
    var activaTab = $("dd.active a", $("#" + containerId));
    if (activaTab) {
      var activaTabHref = activaTab.attr('href');
    }

    var templateAttrs = {
      'containerId': containerId,
      'panels': []
    }

    var panels = SunstoneCfg['tabs'][tabName].panels;
    var active = false;
    var templatePanelsParams = []
    var panelInstances = []

    $.each(panels, function(panelName, Panel) {
      if (Config.isTabPanelEnabled(tabName, panelName)) {
        if (activaTabHref) {
          if (activaTabHref == "#" + panelName) {
            active = true;
          }
        } else {
          activaTabHref = "#" + panelName
          active = true;
        }

        try {
          var panelInstance = new Panel(info);
          panelInstances.push(panelInstance);
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

    $.each(panelInstances, function(index, panel) {
      panel.setup(context);
    });

    $(document).foundation('reflow', 'tab');
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

    var tab = SunstoneCfg["tabs"][tabId];
    var formPanelInstance = tab["formPanelInstances"][formPanelId];
    if (!formPanelInstance) {
      // Create panelInstance, insert in the DOM and setup
      var formPanel = tab["formPanels"][formPanelId];
      if (!formPanel) { 
        console.log("Form Panel not defined"); 
        return false; 
      } // Panel not defined

      formPanelInstance = new formPanel();
      tab["formPanelInstances"][formPanelId] = formPanelInstance;
      formPanelInstance.insert(context);
    }

    formPanelInstance.setAction(action);
    tab["activeFormPanel"] = formPanelInstance;

    // Hide wizard/advanced selector if advanced not defined
    if (formPanelInstance.htmlAdvanced) {
      $(".wizard_tabs", context).show();
    } else {
      $(".wizard_tabs", context).hide();
    }

    // Hide reset button if not defined
    var actionOptions = formPanelInstance.actions[action];
    if (!actionOptions) { return false; } // Options for this action not defined
    if (actionOptions.resetButton) {
      $(".reset_button", context).show();
    } else {
      $(".reset_button", context).hide();
    }

    // Set title and button strings
    $(".right-form-title", context).text(actionOptions.title);
    $(".submit_button", context).text(actionOptions.buttonText);

    formPanelInstance.onShow(context);
    if (onShow2) {
      onShow2(formPanelInstance, context);
    }

    _hideFormPanelLoading(tabId);
  }

  var _submitFormPanel = function(tabId) {
    var context = $("#" + tabId);
    _popFormPanelLoading(tabId);

    var formPanelInstance = SunstoneCfg["tabs"][tabId].activeFormPanel

    if ($("#wizardForms.active", context).length > 0) {
      $('#' + formPanelInstance.formPanelId + 'Wizard').submit();
    } else if ($("#advancedForms.active", context).length > 0) {
      $('#' + formPanelInstance.formPanelId + 'Advanced').submit();
    }
  }

  var _resetFormPanel = function(tabId, formPanelId) {
    var context = $("#" + tabId);
    _popFormPanelLoading(tabId);

    var formPanelInstance;
    if (formPanelId) {
      formPanelInstance = SunstoneCfg["tabs"][tabId]['formPanelInstances'][formPanelId];
    } else {
      formPanelInstance = SunstoneCfg["tabs"][tabId].activeFormPanel;
    }

    if (formPanelInstance) {
      formPanelInstance.reset(context);
      formPanelInstance.onShow(context);
    }

    _hideFormPanelLoading(tabId);
  }

  function _hideFormPanelLoading(tabId) {
    var context = $("#" + tabId);
    //$(".right-form", context).html(content);
    $(".loadingForm", context).hide();
    $(".tabs-contentForm", context).show();
  }

  function _hideFormPanel(tabId) {
    var context = $("#" + tabId);
    $("a[href=back]", context).trigger("click");
  }

  function _popFormPanelLoading(tabId) {
    var context = $("#" + tabId);
    $(".right-list", context).hide();
    $(".right-info", context).hide();
    $(".right-form", context).show();
    $(".only-right-list", context).hide();
    $(".only-right-info", context).hide();
    $(".only-right-form", context).show();

    $(".tabs-contentForm", context).hide();
    $(".loadingForm", context).show();
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
    return $(".right-info", context).is(':visible');
  }

  var _rightListVisible = function(context) {
    return $(".right-list", context).is(':visible');
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
    "addMainTab": _addMainTab,
    "addDialogs": _addDialogs,

    "insertTabs": _insertTabs,
    "insertPanels": _insertPanels,

    'showTab': _showTab,
    "showElement" : _showElement,

    "showFormPanel": _showFormPanel,
    "resetFormPanel": _resetFormPanel,
    "hideFormPanel": _hideFormPanel,
    "hideFormPanelLoading": _hideFormPanelLoading,

    "rightInfoVisible": _rightInfoVisible,
    "rightListVisible": _rightListVisible,
    "rightInfoResourceId": _rightInfoResourceId, 

    "runAction" : _runAction,
    "getAction": _getAction,
    "getButton": _getButton,
    "getDataTable": _getDataTable,
    "getDialog": _getDialogInstance
  }

  return Sunstone;
});
