define(function(require) {
  require('jquery');
  require('foundation.core')

  var Config = require('sunstone-config'),
      Locale = require('utils/locale');

  var TOP_INTERVAL = 10000; //ms

  var SunstoneCfg = {
    "actions" : {},
    "tabs" : {},
    "info_panels" : {},
    "form_panels" : {}
  };

  //Inserts all main tabs in the DOM
  var insertTabs = function() {
    for (tab in SunstoneCfg["tabs"]) {
      _insertTab(tab);
      insertButtonsInTab(tab);

      // TODO Add openenbula actions
      /*if (config['view']['autorefresh']) {
        var tabContext = $("#" + tab);
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
  var insertButtonsInTab = function(tabName, panelName, panelButtons, customContext) {
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

  var _setupTabs = function() {
    var topTabs = $(".left-content ul li.topTab");
    var subTabs = $(".left-content ul li.subTab");

    subTabs.on("click", function() {
      if ($(this).hasClass('topTab')) {
        return false;
      } else {
        var tabName = $(this).attr('id').substring(3);
        showTab(tabName);
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
        showTab(tabName);
        return false;
      }
    });
  };

  var showTab = function(tabName) {
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

    //select tab in left menu
    var li = $("#navigation li#li_" + tabName)
    li.addClass("navigation-active-li");

    var tab = $('#' + tabName);
    //show tab
    $(".tab").hide();
    tab.show();
    $(".right-info", tab).hide();
    $(".right-form", tab).hide();
    $(".right-list", tab).show();
    $(".only-right-info", tab).hide();
    $(".only-right-form", tab).hide();
    $(".only-right-list", tab).show();

    // TODO Add recountCheckboxes
    //recountCheckboxes($(".dataTable", tab).first());

    // TODO Add opennebula.js
    /*var res = SunstoneCfg['tabs'][activeTab]['resource']
    if (res) {
      Sunstone.runAction(res + ".list");
    } else {
      var action = activeTab + ".refresh";

      if (SunstoneCfg["actions"][action]) {
        Sunstone.runAction(action);
      }
    }*/
  }

  var Sunstone = {
    "showAction" : function() {
      return SunstoneCfg["actions"];
    },

    //Adds several actions encapsulated in an js object.
    "addActions" : function(actions) {
      for (action in actions) {
        SunstoneCfg["actions"][action] = actions[action];
      }
    },

    "addMainTab" : function(tadId, tabObj) {
      if (Config.isTabEnabled(tadId)) {
        SunstoneCfg["tabs"][tadId] = tabObj;
      }
    },

    // TODO Check if necessary
    "addFormPanel" : function(tadId, formName, formObj) {
      SunstoneCfg["form_panels"][formName] = formObj;
    },

    // TODO Not necessary, updateInfoPanelTab overwrites it
    //Adds a new info panel
    "addInfoPanel" : function(panelName, panelObj) {
      SunstoneCfg["info_panels"][panelName] = panelObj;
    },

    //Makes an info panel content pop up in the screen.
    "popUpInfoPanel" : function(panelName, selectedTab) {
      var activaTab = $("dd.active a", $("#" + panelName));
      if (activaTab) {
        var activaTabHref = activaTab.attr('href');
      }

      var dlTabs = $('<div id="' + panelName + '" class="bordered-tabs">\
              <dl class="tabs right-info-tabs text-center" data-tab>\
              </dl>\
              <div class="tabs-content"></div>\
              </div>\
          </div>');

      var tabs = SunstoneCfg["info_panels"][panelName];
      var tab = null;
      var active = false;

      for (panelTabName in tabs) {
        if (Config.isTabPanelEnabled(selectedTab, panelTabName) == false) {
          continue;
        }

        tab = tabs[panelTabName];
        var dd = $('<dd><a href="#' + panelTabName + '">' + (tab.icon ? '<i class="fa ' + tab.icon + '"></i><br>' : '') + tab.title + '</a></dd>').appendTo($('dl', dlTabs));
        var li = $('<div id="' + panelTabName + '" class="content">' + tab.content + '</div>').appendTo($('.tabs-content', dlTabs));

        if (activaTabHref) {
          if (activaTabHref == "#" + panelTabName) {
            dd.addClass('active');
            li.addClass('active');
          }
        } else {
          if (!active) {
            dd.addClass('active');
            li.addClass('active');
            active = true;
          }
        }
      }

      popDialog(dlTabs, $("#" + selectedTab));
    },

    // Replaces a tab from an info panel. Refreshes the DOM if wanted.
    "updateInfoPanelTab" : function(panelName, panelTabId, panelTabObj, refresh) {
      SunstoneCfg["info_panels"][panelName][panelTabId] = panelTabObj;
      if (refresh) {
        var tabContent = panelTabObj.content;
        $('div#' + panelName + ' div#' + panelTabId, info_panel_context).html(tabContent);
      }
    },

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

    //Runs a predefined action. Wraps the calls to opennebula.js and
    //can be use to run action depending on conditions and notify them
    //if desired. Returns 1 if some problem has been detected: i.e
    //the condition to run the action is not met, the action is not found
    "runAction" : function(action, dataArg, extraParam) {
      var actions = SunstoneCfg["actions"];
      if (!actions[action]) {
        notifyError("Action " + action + " not defined");
        return 1;
      }

      var actionCfg = actions[action];
      var notify = actionCfg.notify;

      var condition = actionCfg["condition"];

      //Is the condition to run the action met?
      //Should we inform if it is not met?
      if (condition && !condition()) {
        if (notify) {
          notifyError("This action cannot be run");
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
              extraParam:extraParam
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
                            extraParam:extraParam
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
        notifySubmit(action, dataArg, extraParam);
      }

      return 0;
    },

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

    'insertTabs': insertTabs,
    // TODO check if it used externally
    //'showTab': showTab
  };

  return Sunstone;
});
