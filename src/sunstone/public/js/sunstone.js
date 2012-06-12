/* -------------------------------------------------------------------------- */
/* Copyright 2002-2012, OpenNebula Project Leads (OpenNebula.org)             */
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

var cookie = {};
var username = '';
var uid = '';
var gid = '';
var spinner = '<img src="images/ajax-loader.gif" alt="retrieving" class="loading_img" />';

var main_tabs_context;
var dialogs_context;
var plots_context;
var info_panels_context;


//Sunstone configuration is formed by predifined "actions", main tabs
//and "info_panels". Each tab has "content" and "buttons". Each
//"info_panel" has "tabs" with "content".
var SunstoneCfg = {
    "actions" : {},
     "tabs" : {},
     "info_panels" : {}
};

/* Public plugin interface */

var Sunstone = {

    //Adds a predifined action
    "addAction" : function (action_name,action_obj) {
        SunstoneCfg["actions"][action_name] = action_obj;
    },

    //Replaces a predefined action
    "updateAction" : function(action_name,action_obj) {
         SunstoneCfg["actions"][action_name] = action_obj;
    },

    //Deletes a predefined action.
    "removeAction" : function(action_name) {
         delete SunstoneCfg["actions"][action_name];
    },

    //Adds several actions encapsulated in an js object.
    "addActions" : function(actions) {
        for (action in actions){
            Sunstone.addAction(action,actions[action]);
        }
    },

    //Adds a new main tab. Refreshes the dom if wanted.
    "addMainTab" : function(tab_id,tab_obj,refresh) {
        SunstoneCfg["tabs"][tab_id] = tab_obj;
        if (refresh){
            insertTab(tab_id);
        }
    },

    //Updates the content of an info tab and refreshes the DOM if wanted.
    "updateMainTabContent" : function(tab_id,content_arg,refresh){
        SunstoneCfg["tabs"][tab_id]["content"]=content_arg;
        //if not present it will not be updated
        if (refresh){ 
            $('div#'+tab_id, main_tabs_context).html(content_arg);
        }
    },

    //Replaces the buttons of an info tab and regenerates them if wanted.
    "updateMainTabButtons" : function(tab_id,buttons_arg,refresh){
        SunstoneCfg["tabs"][tab_id]["buttons"]=buttons_arg;
        if (refresh){
            $('div#'+tab_id+' .action_blocks', main_tabs_context).empty();
            insertButtonsInTab(tab_id);
        }
    },

    //Removes a tab and refreshes the DOM
    "removeMainTab" : function(tab_id,refresh) {
         delete SunstoneCfg["tabs"][tab_id];
         if (refresh) {
             $('div#'+tab_id, main_tabs_context).remove();
              $('ul#navigation li#li_'+tab_id).remove();
         }
    },

    //Adds a new info panel
    "addInfoPanel" : function(panel_name, panel_obj){
        SunstoneCfg["info_panels"][panel_name]=panel_obj;
    },

    //Replaces an existing info panel
    "updateInfoPanel" : function(panel_name,panel_obj){
        SunstoneCfg["info_panels"][panel_name]=panel_obj;
    },

    //Removes an info panel
    "removeInfoPanel" : function(panel_name){
        delete SunstoneCfg["info_panels"][panel_name];
    },

    //Makes an info panel content pop up in the screen.
    "popUpInfoPanel" : function(panel_name, selected_tab){
        popDialog(Sunstone.getInfoPanelHTML(panel_name, selected_tab));
    },

    //Generates and returns the HTML div element for an info panel, with
    //Jquery tabs.
    "getInfoPanelHTML" : function(panel_name,selected_tab){
        var info_panel = $('<div id="'+panel_name+'"><ul></ul></div>');
        var tabs = SunstoneCfg["info_panels"][panel_name];
        var tab=null;
        for (tab_name in tabs){
            tab=tabs[tab_name];
            $('ul',info_panel).append('<li><a href="#'+tab_name+'">'+tab.title+'</a></li>');
            info_panel.append('<div id="'+tab_name+'">'+tab.content+'</div>');
        }
        if (selected_tab){
            return info_panel.tabs({selected: selected_tab});
        }
        return info_panel.tabs({selected: 0});

    },

    //adds a tab to an info panel.
    "addInfoPanelTab" : function(panel_name, panel_tab_id, panel_tab_obj){
        SunstoneCfg["info_panels"][panel_name][panel_tab_id] = panel_tab_obj;
    },

    //Replaces a tab from an info panel. Refreshes the DOM if wanted.
    "updateInfoPanelTab" : function(panel_name, panel_tab_id,
                                    panel_tab_obj, refresh){
        SunstoneCfg["info_panels"][panel_name][panel_tab_id] = panel_tab_obj;
        if (refresh){
            var tab_content = panel_tab_obj.content;
            $('div#'+panel_name+' div#'+panel_tab_id,info_panel_context).html(tab_content);
        }
    },

    //Removes a tab from an info panel configuration.
    "removeInfoPanelTab" : function(panel_name,panel_tab_id){
        delete SunstoneCfg["info_panels"][panel_name][panel_tab_id];
    },

    //Runs a predefined action. Wraps the calls to opennebula.js and
    //can be use to run action depending on conditions and notify them
    //if desired. Returns 1 if some problem has been detected: i.e
    //the condition to run the action is not met, the action is not found
    "runAction" : function(action, data_arg, extra_param){

        var actions = SunstoneCfg["actions"];
        if (!actions[action]){
            notifyError("Action "+action+" not defined");
            return 1;
        }

        var action_cfg = actions[action];
        var notify = action_cfg.notify;

        var condition = action_cfg["condition"];

        //Is the condition to run the action met?
        //Should we inform if it is not met?
        if (condition && !condition()){
            if (notify) {
            notifyError("This action cannot be run");
            }
            return 1;
        }

        var call = action_cfg["call"];
        var callback = action_cfg["callback"];
        var err = action_cfg["error"];

        //We ease the use of:
        // * "create" calls to opennebula.js
        // * "single" element calls to opennebula.js
        // * "list" (get the pool of elements) calls to opennebula.js
        // * "monitor_global" (returns monitoring info from a pool of elements
        // * "monitor_single" (returns monitoring info from 1 element)
        // * "multiple" - actions to be run on a given list of elements
        //      (with maybe an extra parameter).
        // * The default actions. Simple call the the pre-defined "call"
        //      function with an extraparam if defined.
        switch (action_cfg.type){

        case "create":
        case "register":
            call({data:data_arg, success: callback, error:err});
            break;
        case "single":
            if (extra_param){
                call({
                    data:{
                        id:data_arg,
                        extra_param:extra_param
                    },
                    success: callback,error:err
                });
            } else {
                call({data:{id:data_arg}, success: callback,error:err});
            };
            break;
        case "list":
            call({success: callback, error:err});
            break;
        case "monitor_global":
            call({
                timeout: true,
                success: callback,
                error:err,
                data: {monitor: data_arg}});
            break;
        case "monitor":
        case "monitor_single":
            call({
                timeout: true,
                success: callback,
                error:err,
                data: {id:data_arg, monitor: extra_param}});
            break;
            case "multiple":
            //run on the list of nodes that come on the data
            $.each(data_arg,function(){
                if (extra_param){
                    call({
                        data:{
                            id:this,
                            extra_param:extra_param
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
            //This action is complemente handled by the "call" function.
                //we pass any data if present.
            if (data_arg && extra_param) {call(data_arg,extra_param);}
            else if (data_arg) {call(data_arg);}
            else {call();}
        }
        //notify submission
        if (notify) {
            notifySubmit(action,data_arg,extra_param);
        }

        return 0;
    },

    //returns a button object from the desired tab
    "getButton" : function(tab_id,button_name){
        var button = null;
        var buttons = SunstoneCfg["tabs"][tab_id]["buttons"];
        button = buttons[button_name];
        //not found, is it in the list then?
        if (!button && buttons["action_list"])
        {
            button = buttons["action_list"]["actions"][button_name];
        }
        return button;
    } //end sunstone methods

};



//Plugins have done their pre-ready jobs when we execute this. That means
//all startup configuration is in place regarding tabs, info panels etc.
$(document).ready(function(){

    //Contexts - make everything more efficient
    main_tabs_context = $('div.inner-center');
    dialogs_context = $('div#dialogs');
    plots_context = $('div#plots');
    info_panels_context = $('div#info_panels');

    readCookie();
    setLogin();

    //Insert the tabs in the DOM and their buttons.
    insertTabs();
//    hideSubTabs();
    insertButtons();

    //Enhace the look of select buttons
    initListButtons();

    //Prepare the standard confirmation dialogs
    setupConfirmDialogs();

    //This dialog is shared to update templates
    setupTemplateUpdateDialog();

    //Listen for .action_buttons
    //An action buttons runs a predefined action. If it has type
    //"multiple" it runs that action on the elements of a datatable.
    $('.action_button').live("click",function(){
        var error = 0;
        var table = null;
        var value = $(this).attr('value');
        var action = SunstoneCfg["actions"][value];
        if (!action) {
            notifyError("Action "+value+" not defined.");
            return false;
        };
        switch (action.type){
        case "multiple": //find the datatable
            var nodes = action.elements();
            error = Sunstone.runAction(value,nodes);
            break;
        default:
            error = Sunstone.runAction(value);
        }

        if (!error){
            //proceed to close confirm dialog in
            //case it was open
            $('div#confirm_dialog').dialog("close");
        };

        return false;
    });


    //Listen .confirm_buttons. These buttons show a confirmation dialog
    //before running the action.
    $('.confirm_button',main_tabs_context).live("click",function(){
        popUpConfirmDialog(this);
        return false;
    });

    //Listen .confirm_buttons. These buttons show a confirmation dialog
    //with a select box before running the action.
    $('.confirm_with_select_button',main_tabs_context).live("click",function(){
        popUpConfirmWithSelectDialog(this);
        return false;
    });

    //Jquery-enhace the buttons in the DOM
    $('button').button();

    //Close overlay dialogs when clicking outside of them.
    $(".ui-widget-overlay").live("click", function (){
        $("div:ui-dialog:visible").dialog("close");
    });

    //Close select lists when clicking somewhere else.
    $('*:not(.action_list,.list_button)').click(function(){
        $('.action_blocks .action_list:visible',main_tabs_context).hide();
    });

    //Close open panel
    $('.close_dialog_link').live("click",function(){
        hideDialog();
        return false;
    });

    //Start with the dashboard (supposing we have one).
    showTab('dashboard_tab');

});




//reads the cookie and places its info in the 'cookie' var
function readCookie(){
    $.each(document.cookie.split("; "), function(i,e){
        var e_split = e.split("=");
        var key = e_split[0];
        var value = e_split[1];
        cookie[key] = value;
    });
}

//sets the user info in the top bar and creates a listner in the
//signout button
function setLogin(){
    //This variables can be used anywhere
    switch(whichUI()){
    case "sunstone":
        username = cookie["one-user"];
        uid = cookie["one-user_id"];
        gid = cookie["one-user_gid"];
        break;
    case "ozones":
        username = cookie["ozones-user"];
        break;
    case "selfservice":
        username = cookie["occi-user"];
        break;
    };


    $("div#header span#user").html(username);

    $("div#header a#logout").click(function(){
        redirect = function(){window.location.href = "login";};
        switch(whichUI()){
        case "sunstone":
            OpenNebula.Auth.logout({success:redirect});
            break;
        case "ozones":
            oZones.Auth.logout({success:redirect});
            break;
        case "selfservice":
            OCCI.Auth.logout({success:function(){window.location.href = "ui";}});
            break;
        }
        return false;
    });
}

//returns whether we are Sunstone, or oZones
//not the most elegant way, but better in its own function
function whichUI(){
    if (typeof(OpenNebula)!="undefined")
        return "sunstone";
    if (typeof(oZones)!="undefined")
        return "ozones";
    if (typeof(OCCI)!="undefined")
        return "selfservice";
};

//Inserts all main tabs in the DOM
function insertTabs(){
    var tab_info;
    for (tab in SunstoneCfg["tabs"]){
        insertTab(tab);
    }
}


//Inserts a main tab in the DOM. This is done by
//adding the content to the proper div and by adding a list item
//link to the navigation menu
function insertTab(tab_name){
    var tab_info = SunstoneCfg['tabs'][tab_name];
    var condition = tab_info['condition'];
    var tabClass = tab_info['tabClass'] ? tab_info['tabClass'] : 'topTab';
    var parent = tab_info['parentTab'] ? tab_info['parentTab'] : '';
    var showOnTop = tab_info['showOnTopMenu'];

    //skip this tab if we do not meet the condition
    if (condition && !condition()) {return;}

    main_tabs_context.append('<div id="'+tab_name+'" class="tab" style="display:none;"></div>');

    $('div#'+tab_name,main_tabs_context).html(tab_info.content);

    var li_item = '<li id="li_'+tab_name+'" class="'+tabClass+' '+parent+'">'+tab_info.title+'<span class="ui-icon ui-icon-circle-plus plusIcon"></span></li>';

    //if this is a submenu...
    if (parent.length) {
        var children = $('div#menu ul#navigation li.'+parent);
        //if there are other submenus, insert after last of them
        if (children.length)
            $(children[children.length-1]).after(li_item);
        else //instert after parent menu
            $('div#menu ul#navigation li#li_'+parent).after(li_item);
    } else { //not a submenu, instert in the end
        $('div#menu ul#navigation').append(li_item);
    };

    if (parent){ //this is a subtab
        $('div#menu li#li_'+tab_name).hide();//hide by default
        $('div#menu li#li_'+parent+' span').css("display","inline-block");
    };

    if (showOnTop){
        $('div#header ul#menutop_ul').append('<li id="top_'+tab_name+'">'+tab_info.title+'</li>');
    };
};

function hideSubTabs(){
    for (tab in SunstoneCfg["tabs"]){
        var tab_info = SunstoneCfg["tabs"][tab];
        var tabClass = tab_info["tabClass"];
        if (tabClass=="subTab"){
            $('div#menu ul#navigation #li_'+tab).hide();
        };
    };
}



//Inserts the buttons of all tabs.
function insertButtons(){
    for (tab in SunstoneCfg["tabs"]){
        insertButtonsInTab(tab)
    }
}

//If we have defined a block of action buttons in a tab,
//this function takes care of inserting them in the DOM.
function insertButtonsInTab(tab_name){
    var buttons = SunstoneCfg["tabs"][tab_name]["buttons"];
    var button_code="";
    var sel_obj=null;
    var condition=null;

    //Check if we have included an appropiate space our tab to
    //insert them (an .action_blocks div)
    var action_block = $('div#'+tab_name+' div.action_blocks',main_tabs_context)

    if (action_block.length){

        //for every button defined for this tab...
        for (button_name in buttons){
            button_code = "";
            button = buttons[button_name];
            condition = button.condition;
            //if we meet the condition we proceed. Otherwise we skip it.
            if (condition && !condition()) { continue; }

            //depending on the type of button we generate different
            //code. There are 4 possible types:
            /*
             * select: We need to create a select element with actions inside.
             * image: a button consisting of a link with an image inside.
             * create: we make sure they have the "action_button" class.
             * default: generally buttons have the "<type>_button" class.
             */
            switch (button.type) {
            case "select":
                button_code = '<select class="multi_action_slct">';
                //for each subbutton in the list we add an option to the select.
                for (sel_name in button.actions){
                    sel_obj = button["actions"][sel_name];
                    condition = sel_obj.condition;
                    //only add if we meet the condition
                    if (condition && !condition()){ continue; };
                    button_code += '<option class="'+sel_obj.type+'_button" value="'+sel_name+'">'+sel_obj.text+'</option>';
                };
                button_code += '</select>';
                break;
            case "image":
                button_code = '<a href="#" class="action_button" value="'+button_name+'"><img class="image_button" src="'+button.img+'" alt="'+button.text+'" /></a>';
                break;
            case "create_dialog":
                button_code = '<button class="'+button.type+'_button action_button top_button" value="'+button_name+'">'+button.text+'</button>';
                break;
            default:
                button_code = '<button class="'+button.type+'_button top_button" value="'+button_name+'">'+button.text+'</button>';

            }

            if (button.alwaysActive) {
                button_code = $(button_code).addClass("alwaysActive");
            }

            action_block.append(button_code);

        }//for each button in tab
        $('.top_button',action_block).button();
    }//if tab exists
}

//Converts selects into buttons which show a list of actions when
//clicked. This lists have two parts, one for the last action run, and
//another containing a list of actions that can be folded/unfolded.
function initListButtons(){

    //for each multi_action select
    $('.multi_action_slct',main_tabs_context).each(function(){
        //prepare replacement buttons
        var buttonset = $('<div style="display:inline-block;" class="top_button"></div');
        var button1 = $('<button class="last_action_button action_button confirm_button confirm_with_select_button" value="">'+tr("Previous action")+'</button>').button();
        button1.attr('disabled','disabled');
        var button2 = $('<button class="list_button" value="">See more</button>').button({
            text:false,
            icons: { primary: "ui-icon-triangle-1-s" }
        });
        buttonset.append(button1);
        buttonset.append(button2);
        buttonset.buttonset();

        //prepare list
        var options = $('option', $(this));
        var list = $('<ul class="action_list"></ul>');
        $.each(options,function(){
            var classes = $(this).attr('class');
            var item = $('<li></li>');
            var a = $('<a href="#" class="'+classes+'" value="'+$(this).val()+'">'+$(this).text()+'</a>');
            a.val($(this).val());
            item.html(a);
            list.append(item);
        });
        list.css({
            "display":"none"
        });

        $(this).before(buttonset);
        $(this).parents('.action_blocks').append(list);
        $(this).remove();

    });

    //below the listeners for events on these buttons and list

    //enable run the last action button
    $('.action_list li a',main_tabs_context).click(function(){
        //enable run last action button
        var prev_action_button = $('.last_action_button',$(this).parents('.action_blocks'));
        prev_action_button.val($(this).val());
        prev_action_button.removeClass("confirm_with_select_button");
        prev_action_button.removeClass("confirm_button");
        prev_action_button.removeClass("action_button");
        prev_action_button.addClass($(this).attr('class'));
        prev_action_button.button("option","label",$(this).text());
        prev_action_button.button("enable");
        $(this).parents('ul').hide("blind",100);
        //return false;
    });

    //Show the list of actions in place
    $('.list_button',main_tabs_context).click(function(){
        $('.action_list',$(this).parents('.action_blocks')).css({
            "left": $(this).prev().position().left,
            "top": $(this).prev().position().top+13,
            "width": $(this).parent().outerWidth()-11
        });
        //100ms animation time
        $('.action_list',$(this).parents('.action_blocks')).toggle("blind",100);
        return false;
    });
}

//Prepares the standard confirm dialogs
function setupConfirmDialogs(){
    dialogs_context.append('<div id="confirm_dialog" title=\"'+tr("Confirmation of action")+'\"></div>');
    var dialog = $('div#confirm_dialog',dialogs_context);

    //add the HTML with the standard question and buttons.
        dialog.html(
        '<form action="javascript:alert(\'js error!\');">\
           <div id="confirm_tip">'+tr("You have to confirm this action.")+'</div>\
           <br />\
           <div id="question">'+tr("Do you want to proceed?")+'</div>\
           <br />\
           <div class="form_buttons">\
             <button id="confirm_proceed" class="action_button" value="">'+tr("OK")+'</button>\
             <button class="confirm_cancel" value="">'+tr("Cancel")+'</button>\
          </div>\
        </form>');

    //prepare the jquery dialog
    dialog.dialog({
        resizable:false,
        modal:true,
        width:300,
        heigth:200,
        autoOpen:false
    });

    //enhace the button look
    $('button',dialog).button();

    //if a cancel button is pressed, we close the dialog.
    $('button.confirm_cancel',dialog).click(function(){
        $(this).parents('div:ui-dialog').dialog("close");
        return false;
    });

    dialogs_context.append('<div id="confirm_with_select_dialog" title=\"'+tr("Confirmation of action")+'\"></div>');
    dialog = $('div#confirm_with_select_dialog',dialogs_context);

    dialog.html(
        '<form action="javascript:alert(\'js error!\');">\
           <div id="confirm_with_select_tip">'+tr("You need to select something.")+'</div>\
           <select style="margin: 10px 0;" id="confirm_select">\
           </select>\
           <div class="form_buttons">\
              <button id="confirm_with_select_proceed" class="" value="">'+tr("OK")+'</button>\
              <button class="confirm_cancel" value="">'+tr("Cancel")+'</button>\
           </div>\
         </form>');

    //prepare the jquery dialog
    dialog.dialog({
        resizable:false,
        modal:true,
        width:300,
        heigth:300,
        autoOpen:false
    });

    $('button',dialog).button();

    //if a cancel button is pressed, we close the dialog.
    $('button.confirm_cancel',dialog).click(function(){
        $(this).parents('div:ui-dialog').dialog("close");
        return false;
    });

    //when we proceed with a "confirm with select" we need to
    //find out if we are running an action with a parametre on a datatable
    //items or if its just an action
    $('button#confirm_with_select_proceed',dialog).click(function(){
        var context = $(this).parents('div:ui-dialog');
        var error = 0;
        var value = $(this).val();
        var action = SunstoneCfg["actions"][value];
        var param = $('select#confirm_select',context).val();

        if (!param.length){
            notifyError("You must select a value");
            return false;
        };

        if (!action) { notifyError("Action "+value+" not defined."); return false;};
        switch (action.type){
        case "multiple": //find the datatable
            var nodes = action.elements();
            error = Sunstone.runAction(value,nodes,param);
            break;
        default:
            error = Sunstone.runAction(value,param);
            break;
        }

        if (!error){
            context.dialog("close");
        }

        return false;
    });
}

//Popup a confirmation dialog.
//In order to find out the dialog action and
//tip for the user we need to access the clicked button
//configuration. We do this by discovering the name of the parent tab
//and with the value of the clicked element.
function popUpConfirmDialog(target_elem){
    var dialog = $('div#confirm_dialog');
    var value = $(target_elem).val();
    var tab_id = $(target_elem).parents('.tab').attr('id');
    var button = Sunstone.getButton(tab_id,value);
    var tip = button.tip;
    $('button#confirm_proceed',dialog).val(value);
    $('div#confirm_tip',dialog).text(tip);
    dialog.dialog("open");
}

//Same as previous. This time we need as well to access the updated
//select list, which is done through the pointer of found in the
//config of the button (a function returning the select options).
function popUpConfirmWithSelectDialog(target_elem){
    var dialog = $('div#confirm_with_select_dialog');
    var value = $(target_elem).val();
    var tab_id = $(target_elem).parents('.tab').attr('id');
    var button = Sunstone.getButton(tab_id,value);
    var tip = button.tip;
    var select_var = button.select();
    $('select#confirm_select',dialog).html(select_var);
    $('div#confirm_with_select_tip',dialog).text(tip);

    $('button#confirm_with_select_proceed',dialog).val(value);
    dialog.dialog("open");
}
