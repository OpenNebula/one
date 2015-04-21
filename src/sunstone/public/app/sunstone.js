define(function(require) {
  require('jquery');
  require('foundation.reveal');

  var Config = require('sunstone-config');
  var Locale = require('utils/locale');
  var Notifier = require('utils/notifier');

  var TOP_INTERVAL = 10000; //ms

  var SunstoneCfg = {
    "actions" : {},
    "tabs" : {},
    "info_panels" : {},
    "form_panels" : {}
  };

  var _addMainTab = function(tadId, tabObj) {
    if (Config.isTabEnabled(tadId)) {
      SunstoneCfg["tabs"][tadId] = tabObj;
      
      var actions = tabObj.actions;
      if (actions) {      
        $.each(actions, function(actionName, action){
          SunstoneCfg["actions"][actionName] = action;
        })
      }
    }
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
          text = button.text ? '<i class="fa fa-plus"/>  ' + button.text : '<i class="fa fa-plus"/>';
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
        var formName = $(".right-form", context).attr("form_name");
        var initializeFunc = $(".right-form", context).data("initialize_func");
        Sunstone.popUpFormPanel(formName, tabName, null, true, initializeFunc);

        return false;
      })

      $('#' + customId + 'submit_button', actionBlock).on("click", function() {
        var formName = $(".right-form", context).attr("form_name");
        Sunstone.submitFormPanel(formName, tabName);

        return false;
      })

      $(document).foundation();
    }//if tab exists
  }

  var _setupButtons = function() {
    //Listen for .action_buttons
    //An action buttons runs a predefined action. If it has type
    //"multiple" it runs that action on the elements of a datatable.
    $('.action_button').on("click", function() {
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
        $('div#confirm_dialog').foundation('reveal', 'close');
      };

      return false;
    });

    // Button to return to the list view from the detailed view
    $("a[href='back']").on("click", function(e) {
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
    var activePanels = []

    $.each(panels, function(panelName, panel) {
      if (Config.isTabPanelEnabled(tabName, panelName)) {
        if (activaTabHref) {
          if (activaTabHref == "#" + panelName) {
            active = true;
          }
        } else {
          if (!active) {
            active = true;
          }
        }

        activePanels.push({
          'panelName': panelName,
          'icon': panel.icon,
          'title': panel.title,
          'html': panel.html(info),
          'active': active,
          'setup': panel.setup
        })
      }
    });

    var TemplatePanels = require('hbs!./sunstone/panels');
    var html = TemplatePanels({
      'containerId': containerId,
      'panels': activePanels
    })

    context.html(html);

    $.each(panels, function(index, panel) {
      panel.setup(info, context)
    });
  }

  var _insertDialog = function(dialog) {
    var dialogElement = $(dialog.html()).appendTo('div#dialogs');
    dialog.setup(dialogElement);
    dialogElement.foundation('reveal', 'reflow');

    dialogElement.on('opened.fndtn.reveal', function () {
      dialog.onShow(dialogElement);
    });

    return dialogElement;
  }

  var _showDialog = function(tabName, dialogId) {
    var dialog = SunstoneCfg['tabs'][tabName]['dialogs'][dialogId];
    var dialogElement = $('#' + dialog.dialogId);
    if (dialogElement.length == 0) {
      dialogElement = _insertDialog(dialog);
    }

    dialogElement.foundation('reveal', 'open');
    return false;
  }

  var _hideDialog = function(tabName, dialogId) {
    var dialog = SunstoneCfg['tabs'][tabName]['dialogs'][dialogId];
    var dialogElement = $('#' + dialog.dialogId);
    dialogElement.foundation('reveal', 'close')
  }

  var _resetDialog = function(tabName, dialogId) {
    var dialog = SunstoneCfg['tabs'][tabName]['dialogs'][dialogId];
    var dialogElement = $('#' + dialog.dialogId);
    dialogElement.remove();
    dialogElement = _insertDialog(dialog);
    return false;
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

  var Sunstone = {
    //Adds several actions encapsulated in an js object.

    "addMainTab" : _addMainTab,

    // TODO Check if necessary
    "addFormPanel" : function(tadId, formName, formObj) {
      SunstoneCfg["form_panels"][formName] = formObj;
    },

    //Makes an info panel content pop up in the screen.
    "showElement" : _showElement,
    "insertPanels" : _insertPanels,

    "showDialog": _showDialog,
    "hideDialog": _hideDialog,
    "resetDialog": _resetDialog,

    "popUpFormPanel" : function(formName, selectedTab, action, reset, initalizeFunc) {
      var context = $("#" + selectedTab);
      popFormDialogLoading(context);

      var formObj = SunstoneCfg["form_panels"][formName];

      $(".right-form", context).data("initialize_func", initalizeFunc);

      $(".reset_button", context).show();

      if (formObj.advancedHtml) {
        $(".wizard_tabs", context).show();
      } else {
        $(".wizard_tabs", context).hide();
      }

      if (action) {
        $(".right-form-title", context).text(formObj["actions"][action]["title"]);
        $(".submit_button", context).text(formObj["actions"][action]["submit_text"]);

        if (formObj["actions"][action]["reset_button"] == false) {
          $(".reset_button", context).hide();
        }
      }

      setTimeout(function() {
        if (reset) {
          if (!action) {
            action = $("#" + formName + "_wizard", context).attr("action")
          }

          $("#advancedForms", context).empty();
          $("#wizardForms", context).empty();
        }

        if ($("#" + formName + "_wizard", context).length == 0) {
          $("#advancedForms", context).append(formObj.advancedHtml);
          $("#wizardForms", context).append(formObj.wizardHtml);

          formObj.setup(context)
        }

        if (initalizeFunc) {
          initalizeFunc(context);
        }

        if (action) {
          $("#" + formName + "_wizard", context).attr("action", action);
          $("#" + formName + "_advanced", context).attr("action", action);
        }

        popFormDialog(formName, context);

      }, 13)

    },

    "submitFormPanel" : function(formName, selectedTab) {
      var context = $("#" + selectedTab);
      popFormDialogLoading(context);

      if ($("#wizardForms.active", context).length > 0) {
        $("#" + formName + "_wizard", context).submit();
      } else if ($("#advancedForms.active", context).length > 0) {
        $("#" + formName + "_advanced", context).submit();
      }
    },

    "runAction" : _runAction,

    //returns a button object from the desired tab
    "getButton" : function(tadId, buttonName) {
      var button = null;
      var buttons = SunstoneCfg["tabs"][tadId]["buttons"];
      button = buttons[buttonName];
      //not found, is it in the list then?
      if (!button && buttons["action_list"]) {
        button = buttons["action_list"]["actions"][buttonName];
      }
      return button;
    },

    "rightInfoVisible" : function(context) {
      return $(".right-info", context).is(':visible');
    },

    "rightListVisible" : function(context) {
      return $(".right-list", context).is(':visible');
    },

    "rightInfoResourceId" : function(context) {
      return $(".resource-id", context).text();
    },

    'insertTabs': _insertTabs,
    // TODO check if it used externally
    //'showTab': _showTab
  };

  return Sunstone;
});
