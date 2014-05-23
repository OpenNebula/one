 /* -------------------------------------------------------------------------- */
/* Copyright 2002-2014, OpenNebula Project (OpenNebula.org), C12G Labs        */
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

/*!
 * jQuery Cookie Plugin v1.4.0
 * https://github.com/carhartl/jquery-cookie
 *
 * Copyright 2013 Klaus Hartl
 * Released under the MIT license
 */
!function(a){"function"==typeof define&&define.amd?define(["jquery"],a):a(jQuery)}(function(a){function b(a){return h.raw?a:encodeURIComponent(a)}function c(a){return h.raw?a:decodeURIComponent(a)}function d(a){return b(h.json?JSON.stringify(a):String(a))}function e(a){0===a.indexOf('"')&&(a=a.slice(1,-1).replace(/\\"/g,'"').replace(/\\\\/g,"\\"));try{a=decodeURIComponent(a.replace(g," "))}catch(b){return}try{return h.json?JSON.parse(a):a}catch(b){}}function f(b,c){var d=h.raw?b:e(b);return a.isFunction(c)?c(d):d}var g=/\+/g,h=a.cookie=function(e,g,i){if(void 0!==g&&!a.isFunction(g)){if(i=a.extend({},h.defaults,i),"number"==typeof i.expires){var j=i.expires,k=i.expires=new Date;k.setDate(k.getDate()+j)}return document.cookie=[b(e),"=",d(g),i.expires?"; expires="+i.expires.toUTCString():"",i.path?"; path="+i.path:"",i.domain?"; domain="+i.domain:"",i.secure?"; secure":""].join("")}for(var l=e?void 0:{},m=document.cookie?document.cookie.split("; "):[],n=0,o=m.length;o>n;n++){var p=m[n].split("="),q=c(p.shift()),r=p.join("=");if(e&&e===q){l=f(r,g);break}e||void 0===(r=f(r))||(l[q]=r)}return l};h.defaults={},a.removeCookie=function(b,c){return void 0!==a.cookie(b)?(a.cookie(b,"",a.extend({},c,{expires:-1})),!0):!1}});
/*!
 * end jQuery Cookie Plugin v1.4.0
 */

var cookie = {};
var username = '';
var uid = '';
var gid = '';
var spinner = '<img src="images/ajax-loader.gif" alt="retrieving" class="loading_img" />';

var main_tabs_context;
var dialogs_context;
var plots_context;
var info_panels_context;

panel_extended = false;

// global settings
var top_interval = 10000; //ms
var top_interval_ids = {};

//Sunstone configuration is formed by predifined "actions", main tabs
//and "info_panels". Each tab has "content" and "buttons". Each
//"info_panel" has "tabs" with "content".
var SunstoneCfg = {
    "actions" : {},
     "tabs" : {},
     "info_panels" : {}
};

var language_options = '<option value="en_US">English (en_US)</option>\
   <option value="ca">Catalan (ca)</option>\
   <option value="cs_CZ">Czech (cs_CZ)</option>\
   <option value="nl_NL">Dutch (nl_NL)</option>\
   <option value="da">Danish (da)</option>\
   <option value="fr_FR">French (fr_FR)</option>\
   <option value="de">German (de)</option>\
   <option value="el_GR">Greek (el_GR)</option>\
   <option value="it_IT">Italian (el_GR)</option>\
   <option value="fa_IR">Persian (fa_IR)</option>\
   <option value="pl">Polish (pl)</option>\
   <option value="pt_BR">Portuguese (pt_BR)</option>\
   <option value="pt_PT">Portuguese (pt_PT)</option>\
   <option value="ru_RU">Russian (ru_RU)</option>\
   <option value="zh_CN">Simplified Chinese (zh_CN)</option>\
   <option value="sk_SK">Slovak (sk_SK)</option>\
   <option value="es_ES">Spanish (es_ES)</option>\
   <option value="zh_TW">Traditional Chinese (zh_TW)</option>';

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
        if (Config.isTabEnabled(tab_id)) {
            SunstoneCfg["tabs"][tab_id] = tab_obj;
            if (refresh){
                insertTab(tab_id);
                //$(document).foundationCustomForms();
            }
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
        popDialog(Sunstone.getInfoPanelHTML(panel_name, selected_tab), $("#"+selected_tab));
    },

    //Generates and returns the HTML div element for an info panel, with
    //Jquery tabs.
    "getInfoPanelHTML" : function(panel_name,selected_tab){
        var active_tab = $("dd.active a", $("#"+panel_name));
        if (active_tab) {
            var active_tab_href = active_tab.attr('href');
        }

        var dl_tabs = $('<div id="'+panel_name+'">\
            <div class="row">\
                <div class="large-12 columns">\
                    <dl class="tabs right-info-tabs text-center" data-tab>\
                    </dl>\
                </div>\
            </div>\
            <div class="tabs-content"></div>\
            </div>\
        </div>');

        var tabs = SunstoneCfg["info_panels"][panel_name];
        var tab=null;
        var active=false;

        for (panel_tab_name in tabs){
            if (Config.isTabPanelEnabled(selected_tab, panel_tab_name) == false) {
                continue;
            }

            tab=tabs[panel_tab_name];
            var dd = $('<dd><a href="#'+panel_tab_name+'"><i class="fa '+tab.icon+'"></i><br>'+tab.title+'</a></dd>').appendTo($('dl',dl_tabs));
            //$('ul', dl_tabs).append('<div id="'+panel_tab_name+'"><li id="'+panel_tab_name+'Tab">'+tab.content+'</li></div>');
            var li = $('<div id="'+panel_tab_name+'" class="content">'+tab.content+'</div>').appendTo($('.tabs-content', dl_tabs));

            if (active_tab_href) {
                if (active_tab_href == "#"+panel_tab_name) {
                    dd.addClass('active');
                    li.addClass('active');
                }
            }
            else {
                if (!active) {
                    dd.addClass('active');
                    li.addClass('active');
                    active = true;
                }
            }
        }
        if (selected_tab){
            // TODO select tab
            return dl_tabs
        }
        return dl_tabs

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
            call({success: callback, error:err, options:data_arg});
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
    }, //end sunstone methods

    "rightInfoVisible" : function(context) {
        return $(".right-info", context).is(':visible');
    },

    "rightListVisible" : function(context) {
        return $(".right-list", context).is(':visible');
    },

    "rightInfoResourceId" : function(context) {
        return $(".resource-id", context).text();
    },
};

//reads the cookie and places its info in the 'cookie' var
function zone_refresh(){
    // Populate Zones dropdown
    OpenNebula.Zone.list({
      timeout: true,
      success: function (request, obj_list){
          $('.zone-ul').empty();
          $.each(obj_list,function(){
              $('.zone-ul').append('<li><a id="'+this.ZONE.NAME+'" class="zone-choice">'+this.ZONE.NAME+'</a></li>');
          });
      },
      error: onError
    });
}



//reads the cookie and places its info in the 'cookie' var
function readCookie(){
    $.each(document.cookie.split("; "), function(i,e){
        var e_split = e.split("=");
        var key = e_split[0];
        var value = e_split[1];
        cookie[key] = value;
    });
}

//sets the user info in the top bar and creates a listener in the
//signout button
function setLogin(){
    //This variables can be used anywhere
    switch(whichUI()){
    case "sunstone":
        username = cookie["one-user"];
        uid = cookie["one-user_id"];
        gid = cookie["one-user_gid"];
        break;
    case "selfservice":
        username = cookie["occi-user"];
        uid = cookie["occi-user-id"];
        break;
    };

    var user_login_content =  '<a href="#" data-dropdown="drop1" class="button small radius secondary dropdown" id="logout">\
      <i class="fa fa-user fa-lg fa-fw header-icon"></i> '+ config['display_name'] + '</a>\
      <ul id="drop1" data-dropdown-content class="f-dropdown">\
        <li><a href="#" class="configuration"><i class="fa fa-cog"></i> Settings</a></li>\
        <li><a href="#" class="logout"><i class="fa fa-power-off"></i> Sign Out</a></li>\
      </ul>\
    <a href="#" data-dropdown="drop2" class="button small radius secondary dropdown" id="zonelector">\
      <i class="fa fa-home fa-lg fa-fw header-icon"></i> '+ config['zone_name'] + '</a>\
      <ul id="drop2" data-dropdown-content class="zone-ul f-dropdown"></ul>';

    $(".user-zone-info").html(user_login_content);

    // TODOO do not use same id for all drop1
    // TODOO only call dropdown initialization
    $(document).foundation();

    $("a.logout", $(".user-zone-info ")).click(function(){
        OpenNebula.Auth.logout({
          success: function(){
            window.location.href = "login";
          }
        });

        return false;
    });
}

//returns whether we are Sunstone, or other
//not the most elegant way, but better in its own function
function whichUI(){
    if (typeof(OpenNebula)!="undefined")
        return "sunstone";
    if (typeof(OCCI)!="undefined")
        return "selfservice";
};

//Inserts all main tabs in the DOM
function insertTabs(){
    var tab_info;
    for (tab in SunstoneCfg["tabs"]){
        insertTab(tab);

        if (config['view']['autorefresh']) {
            var tab_context = $("#" + tab);
            var refresh_button = $(".fa-refresh", $(".action_blocks", tab_context).first());
            setInterval(function(){
                if(Sunstone.rightListVisible(tab_context)){
                    refresh_button.click();
                }
                //else {console.log("top not visible for "+custom_id);}
            }, top_interval);
        }
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

    if (tab_info.no_content === true) {
        tabClass += " tab_with_no_content"
    }
    else {
        var tab_content_str;
        tab_content_str = '<div id="'+tab_name+'" class="tab" style="display:none;">';

        if (tab_info.list_header || tab_info.info_header) {
            tab_content_str += '<div class="row">\
              <div class="large-12 columns">\
                <h3 class="subheader header-title only-right-list">\
                  <span class="header-resource">' +
                    tab_info.list_header +
                  '</span>\
                </h3>\
                <h3 class="subheader header-title only-right-info" hidden>\
                  <span class="header-resource">' +
                    tab_info.info_header +
                  '</span>&emsp;\
                  <span class="resource-id"></span>\
                </h3>\
              </div>\
            </div>'
        }
/*
        if (tab_info.search_input) {
            tab_content_str += '<div class="row header-info">\
              <div class="large-3 columns right">' +
                tab_info.search_input +
              '</div>\
              <div class="large-9 columns">' +
                  (tab_info.subheader ? tab_info.subheader : "") +
              '</div>\
            </div>'
        }
*/
        if (tab_info.buttons) {
            tab_content_str += '<div class="row">\
              <div class="small-9 large-9 columns">\
                <div class="action_blocks">\
                </div>\
              </div>\
              <div class="small-3 large-3 columns only-right-list">'

            if (tab_info.search_input) {
                tab_content_str += tab_info.search_input;
            }

            tab_content_str += '</div>\
            </div>'
        }

        tab_content_str += '<div class="right-list">'

        if (tab_info.table) {
            tab_content_str += '<div class="row">\
                <div class="large-12 columns">'+
                    tab_info.table +
              '</div>\
            </div>'
        }

        if (tab_info.content) {
            tab_content_str += tab_info.content
        }


        if (tab_info.subheader) {
            tab_content_str += '<div class="row header-info">\
              <div class="large-12 columns text-center totals-info">' +
                '<h3 class="subheader">'+
                  (tab_info.subheader ? tab_info.subheader : "") +
                '</h3>\
              </div>\
            </div>'
        }

        tab_content_str += '</div>'

        tab_content_str += '<div class="right-info" hidden>'
        tab_content_str += '</div>'

        tab_content_str += '</div>';
        main_tabs_context.append(tab_content_str);
    }


    var li_item = '<li id="li_'+tab_name+'" class="'+tabClass+' '+parent+'"><a href="#">'+tab_info.title+'</a></li>';

    $('div#menu ul#navigation').append(li_item);

    //if this is a submenu...
    if (parent.length) {
        var children = $('div#menu ul#navigation #li_'+parent);
        //if there are other submenus, insert after last of them
        if (children.length) {
            $('div#menu li#li_'+tab_name).hide();//hide by default
            $('div#menu li#li_'+parent+' span').css("display","inline-block");
        }
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
function insertButtonsInTab(tab_name, panel_name, panel_buttons, custom_context){
    var buttons = panel_buttons ? panel_buttons : SunstoneCfg["tabs"][tab_name]["buttons"];
    var button_code="";
    var sel_obj=null;
    var condition=null;

    var context, custom_id;
    if (custom_context) {
        custom_id = custom_context.attr("id");
        context = custom_context;
    } else {
        custom_id = tab_name;
        context = $('div#'+tab_name, main_tabs_context);
    }

    var action_block = $('div.action_blocks', context)

    if (action_block.length){

        var buttons_row = $('<div class="text-center">'+
                  '<span class="left">'+

                    '<span id="'+custom_id+'refresh_buttons">'+
                    '</span>'+

                    (custom_context ? '' : '<span id="'+custom_id+'back_button" class="only-right-info">'+
                        '<a class="button small radius" href="back"><i class="fa fa-arrow-left"></i>&emsp;&emsp;<i class="fa fa-list"></i></a>'+
                    '</span>')+

                    '<span id="'+custom_id+'create_buttons" class="only-right-list">'+
                    '</span>'+
                  '</span>'+

                  '<span>'+
                    '<span id="'+custom_id+'vmsplay_buttons">'+
                    '</span>'+

                    "<a href='#' data-dropdown='"+custom_id+"vmspause_buttons' class='top_button small  button secondary dropdown radius'>"+
                        "<i class='fa fa-pause'/>"+
                    "</a>"+
                    "<ul id='"+custom_id+"vmspause_buttons' class='f-dropdown' data-dropdown-content>"+
                    "</ul>"+

                    "<a href='#' data-dropdown='"+custom_id+"vmsstop_buttons' class='top_button small  button secondary dropdown radius'>"+
                        "<i class='fa fa-stop'/>"+
                    "</a>"+
                    "<ul id='"+custom_id+"vmsstop_buttons' class='f-dropdown' data-dropdown-content>"+
                    "</ul>"+

                    "<a href='#' data-dropdown='"+custom_id+"vmsrepeat_buttons' class='top_button small  button secondary dropdown radius'>"+
                        "<i class='fa fa-repeat'/>"+
                    "</a>"+
                    "<ul id='"+custom_id+"vmsrepeat_buttons' class='f-dropdown' data-dropdown-content>"+
                    "</ul>"+

                    "<a href='#' data-dropdown='"+custom_id+"vmsplanification_buttons' class='top_button small  button secondary dropdown radius'>"+
                        "<i class='fa fa-th-list'/>"+
                    "</a>"+
                    "<ul id='"+custom_id+"vmsplanification_buttons' class='f-dropdown' data-dropdown-content>"+
                    "</ul>"+
                  '</span>'+

                  '<span class="right">'+
                    '<span id="'+custom_id+'main_buttons">'+
                    "</span>"+

                    "<a href='#' data-dropdown='"+custom_id+"more_buttons' class='top_button small  button secondary dropdown radius'> " +
                        "<i class='fa fa-ellipsis-v'/>"+
                    "</a>"+
                    "<ul id='"+custom_id+"more_buttons' class='f-dropdown' data-dropdown-content>"+
                    "</ul>"+

                    "<a href='#' data-dropdown='"+custom_id+"user_buttons' class='top_button small  secondary button dropdown radius'>"+
                        "<i class='fa fa-user'/>"+
                    "</a>"+
                    "<ul id='"+custom_id+"user_buttons' class='f-dropdown' data-dropdown-content>"+
                    "</ul>"+

                    "<a href='#' data-dropdown='"+custom_id+"vmsdelete_buttons' class='top_button small  button alert dropdown radius'>"+
                        "<i class='fa fa-trash-o'/>"+
                    "</a>"+
                    "<ul id='"+custom_id+"vmsdelete_buttons' class='f-dropdown' data-dropdown-content>"+
                    "</ul>"+

                    "<span id='"+custom_id+"delete_buttons'>"+
                    "</span>"+
                  "</span>"+
        "</div>");

        //for every button defined for this tab...
        for (button_name in buttons){
            button_code = "";
            button = buttons[button_name];

            //if we meet the condition we proceed. Otherwise we skip it.
            if (Config.isTabActionEnabled(tab_name, button_name, panel_name) == false) {
                continue;
            }

            var type = button.type+'_button';
            var str_class = [type]
            switch (button.type) {
            case "select":
                break;
            case "image":
                str_class.push("action_button")
                break;
            case "create_dialog":
                str_class.push("action_button")
                str_class.push("top_button")
                break;
            default:
                str_class.push("top_button")
            }

            if (button.alwaysActive) {
                str_class.push("alwaysActive");
            }

            if (button.custom_classes) {
                str_class.push(button.custom_classes);
            }

            var context;
            var text;
            switch (button.layout) {
            case "create":
                context = $("#"+custom_id+"create_buttons", buttons_row);
                text = button.text ? '<i class="fa fa-plus"/>  ' + button.text : '<i class="fa fa-plus"/>';
                str_class.push("success", "button", "small", "radius");
                button_code = '<button class="'+str_class.join(' ')+'" href="'+button_name+'">'+text+'</button>';
                break;
            case "refresh":
                context = $("#"+custom_id+"refresh_buttons", buttons_row);
                text = '<span class="fa-stack">'+
                    '<i class="fa fa-refresh fa-stack-lg" style="font-size: 1.5em"></i>'+
                    //'<i class="fa fa-play fa-stack-1x"></i>'+
                  '</span>';
                str_class.push("white_button", "refresh", "secondary", "button", "small", "radius");
                button_code = '<a class="'+str_class.join(' ')+'" href="'+button_name+'" style="padding-left: 5px">'+text+'</a>';
                break;
            case "top":
                context = $("#"+custom_id+"refresh_buttons", buttons_row);
                text = '<span class="fa-stack">'+
                    '<i class="fa fa-refresh fa-stack-2x" style="color: #dfdfdf"></i>'+
                    '<i class="fa fa-play fa-stack-1x"></i>'+
                  '</span>';
                str_class.push("white_button", "toggle_top_button", "only-right-list","secondary", "button", "small", "radius");
                button_code = '<a class="'+str_class.join(' ')+'" style="padding-left:0px; margin-right: 20px">'+text+'</a>';
                break;
            case "main":
                context = $("#"+custom_id+"main_buttons", buttons_row);
                text = button.text;
                str_class.push("secondary", "button", "small", "radius");
                button_code = '<button class="'+str_class.join(' ')+'" href="'+button_name+'">'+text+'</button>';
                break;
            case "vmsplay_buttons":
                context = $("#"+custom_id+"vmsplay_buttons", buttons_row);
                text = button.text;
                str_class.push("secondary", "button", "small", "radius");
                button_code = '<button class="'+str_class.join(' ')+'" href="'+button_name+'">'+text+'</button>';
                break;
            case "vmspause_buttons":
                context = $("#"+custom_id+"vmspause_buttons", buttons_row);
                text = button.text;
                button_code = '<li><a class="'+str_class.join(' ')+'" href="'+button_name+'">'+text+'</a></li>';
                break;
            case "vmsstop_buttons":
                context = $("#"+custom_id+"vmsstop_buttons", buttons_row);
                text = button.text;
                button_code = '<li><a class="'+str_class.join(' ')+'" href="'+button_name+'">'+text+'</a></li>';
                break;
            case "vmsrepeat_buttons":
                context = $("#"+custom_id+"vmsrepeat_buttons", buttons_row);
                text = button.text;
                button_code = '<li><a class="'+str_class.join(' ')+'" href="'+button_name+'">'+text+'</a></li>';
                break;
            case "vmsdelete_buttons":
                context = $("#"+custom_id+"vmsdelete_buttons", buttons_row);
                text = button.text;
                button_code = '<li><a class="'+str_class.join(' ')+'" href="'+button_name+'">'+text+'</a></li>';
                break;
            case "vmsplanification_buttons":
                context = $("#"+custom_id+"vmsplanification_buttons", buttons_row);
                text = button.text;
                button_code = '<li><a class="'+str_class.join(' ')+'" href="'+button_name+'">'+text+'</a></li>';
                break;
            case "more_select":
                context = $("#"+custom_id+"more_buttons", buttons_row);
                text = button.text;
                button_code = '<li><a class="'+str_class.join(' ')+'" href="'+button_name+'">'+text+'</a></li>';
                break;
            case "user_select":
                context = $("#"+custom_id+"user_buttons", buttons_row);
                text = button.text;
                button_code = '<li><a class="'+str_class.join(' ')+'" href="'+button_name+'">'+text+'</a></li>';
                break;
            case "del":
                context = $("#"+custom_id+"delete_buttons", buttons_row);
                text = '<i class=" fa fa-trash-o"/> ';
                str_class.push("alert", "button", "small", "radius");
                button_code = '<button class="'+str_class.join(' ')+'" href="'+button_name+'">'+text+'</button>';
                break;
            default:
                context = $("#"+custom_id+"main_buttons", buttons_row);
                text = button.text;
                str_class.push("secondary", "button", "small", "radius");
                button_code = '<button class="'+str_class.join(' ')+'" href="'+button_name+'">'+text+'</button>';
            }

            context.append(button_code);
        }//for each button in tab
        //$('.top_button',action_block).button();
        //$('.top_button',action_block).addClass("secondary small button")

        action_block.append(buttons_row);

        if  ($("#"+custom_id+"more_buttons li", action_block).length == 0 ) {
            $("a[data-dropdown="+custom_id+"more_buttons]", action_block).remove()
        }

        if  ($("#"+custom_id+"user_buttons li", action_block).length == 0 ) {
            $("a[data-dropdown="+custom_id+"user_buttons]", action_block).remove()
        }

        if  ($("#"+custom_id+"vmsplanification_buttons li", action_block).length == 0 ) {
            $("a[data-dropdown="+custom_id+"vmsplanification_buttons]", action_block).remove()
        }

        if  ($("#"+custom_id+"vmsdelete_buttons li", action_block).length == 0 ) {
            $("a[data-dropdown="+custom_id+"vmsdelete_buttons]", action_block).remove()
        }

        if  ($("#"+custom_id+"vmsstop_buttons li", action_block).length == 0 ) {
            $("a[data-dropdown="+custom_id+"vmsstop_buttons]", action_block).remove()
        }

        if  ($("#"+custom_id+"vmspause_buttons li", action_block).length == 0 ) {
            $("a[data-dropdown="+custom_id+"vmspause_buttons]", action_block).remove()
        }

        if  ($("#"+custom_id+"vmsrepeat_buttons li", action_block).length == 0 ) {
            $("a[data-dropdown="+custom_id+"vmsrepeat_buttons]", action_block).remove()
        }

        if  ($("#"+custom_id+"user_buttons li", action_block).length == 0 ) {
            $("a[data-dropdown="+custom_id+"user_buttons]", action_block).remove()
        }
        //action_block.foundationButtons();
        $('.top_button, .list_button',action_block).attr('disabled', false);
        $('.top_button, .list_button',action_block).attr('disabled', true);
        $('.create_dialog_button',action_block).attr('disabled', false);
        $('.alwaysActive',action_block).attr('disabled', false);

    $(document).foundation();
    }//if tab exists
}

//Converts selects into buttons which show a list of actions when
//clicked. This lists have two parts, one for the last action run, and
//another containing a list of actions that can be folded/unfolded.
function initListButtons(){

}

//Prepares the standard confirm dialogs
function setupConfirmDialogs(){
    dialogs_context.append('<div id="confirm_dialog" title=\"'+tr("Confirmation of action")+'\"></div>');
    var dialog = $('div#confirm_dialog',dialogs_context);

    //add the HTML with the standard question and buttons.
        dialog.html(
        '<div class="row">\
            <h3 class="subheader">'+tr("Confirm")+'<br>&emsp;<small class="confirm_action"></small></h3>\
          </div>\
        <form action="">\
           <div id="confirm_tip">'+tr("You have to confirm this action.")+'</div>\
           <br />\
           <div id="question">'+tr("Do you want to proceed?")+'</div>\
           <br />\
           <div class="form_buttons">\
             <button id="confirm_proceed" class="action_button radius button right" value="">'+tr("OK")+'</button>\
          </div>\
            <a class="close-reveal-modal">&#215;</a>\
        </form>');

    dialog.addClass("reveal-modal").attr("data-reveal", "");
    dialogs_context.append('<div id="confirm_with_select_dialog" title=\"'+tr("Confirmation of action")+'\"></div>');
    dialog = $('div#confirm_with_select_dialog',dialogs_context);

    dialog.html(
        '<div class="row">\
            <h3 class="subheader">'+tr("Confirm")+'<br>&emsp;<small class="confirm_action"></small></h3>\
          </div>\
          <form action="">\
            <div class="row">\
                <div id="confirm_with_select_tip">'+tr("You need to select something.")+'</div>\
            </div>\
            <br />\
            <div class="row">\
                <div class="large-12 columns" id="confirm_select">\
                </div>\
            </div>\
            <br />\            <br />\
           <div class="form_buttons">\
              <button id="confirm_with_select_proceed" class="action_button radius button right" value="">'+tr("OK")+'</button>\
           </div>\
            <a class="close-reveal-modal">&#215;</a>\
         </form>');

    dialog.addClass("reveal-modal").attr("data-reveal", "");

    //when we proceed with a "confirm with select" we need to
    //find out if we are running an action with a parametre on a datatable
    //items or if its just an action
    $('button#confirm_with_select_proceed',dialog).click(function(){
        var context = $(this).parents('div.reveal-modal');
        var error = 0;
        var value = $(this).val();
        var action = SunstoneCfg["actions"][value];
        var param = $('select.resource_list_select',context).val();

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
            context.foundation('reveal', 'close')
            $('.button.dropdown').find('ul').removeClass('show-dropdown');
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
    var value = $(target_elem).attr('href');
    var tab_id = $(target_elem).parents('.tab').attr('id');
    var button = Sunstone.getButton(tab_id,value);

    if (button.tip == undefined)
        var tip = tr("You have to confirm this action");
    else
        var tip = button.tip

    $('button#confirm_proceed',dialog).val(value);

    var action = SunstoneCfg["actions"][value];
    if (action.elements()) {
        var str = value.split('.');
        $(".confirm_action", dialog).html(str[1] + ' ' + str[0] + ': ' + action.elements().join(', '))
    }

    $('div#confirm_tip',dialog).text(tip);
    dialog.foundation().foundation('reveal', 'open');
}

//Same as previous. This time we need as well to access the updated
//select list, which is done through the pointer of found in the
//config of the button (a function returning the select options).
function popUpConfirmWithSelectDialog(target_elem){
    var dialog = $('div#confirm_with_select_dialog');
    var value = $(target_elem).attr('href');
    var tab_id = $(target_elem).parents('.tab').attr('id');
    var button = Sunstone.getButton(tab_id,value);
    var tip = tr("You have to confirm this action");

    if (button.tip == undefined)
        var tip = tr("You have to confirm this action");
    else
        var tip = button.tip

    if (button.custom_select){
        $('div#confirm_select', dialog).html(button.custom_select);
    } else{
        insertSelectOptions('div#confirm_select', dialog, button.select, null, true);
    }

    $('div#confirm_with_select_tip',dialog).text(tip);

    var action = SunstoneCfg["actions"][value];
    if (action.elements()) {
        var str = value.split('.');
        $(".confirm_action", dialog).html(str[1] + ' ' + str[0] + ': ' + action.elements().join(', '))
    }

    $('button#confirm_with_select_proceed',dialog).val(value);
    dialog.foundation().foundation('reveal', 'open');
}


/* Some useful functions for Sunstone default plugins */
var INTERVAL=60000; //milisecs

var last_selected_row = null;

function someTime(){ //some time under 30secs
    return Math.floor(Math.random()*30000);
}

//introduces 0s before a number until in reaches 'length'.
function pad(number,length) {
    var str = '' + number;
    while (str.length < length)
        str = '0' + str;
    return str;
}

//turns a Unix-formatted time into a human readable string
function pretty_time(time_seconds)
{
    var d = new Date();
    d.setTime(time_seconds*1000);

    var secs = pad(d.getSeconds(),2);
    var hour = pad(d.getHours(),2);
    var mins = pad(d.getMinutes(),2);
    var day = pad(d.getDate(),2);
    var month = pad(d.getMonth()+1,2); //getMonths returns 0-11
    var year = d.getFullYear();

    return hour + ":" + mins +":" + secs + "&nbsp;" + day + "/" + month + "/" + year;
}

// Format time for plot axis
// If show date, only date information is shown
function pretty_time_axis(time, show_date){
    var d = new Date();
    d.setTime(time*1000);

    var secs = pad(d.getSeconds(),2);
    var hour = pad(d.getHours(),2);
    var mins = pad(d.getMinutes(),2);
    var day = pad(d.getDate(),2);
    var month = pad(d.getMonth()+1,2); //getMonths returns 0-11
    var year = d.getFullYear();

    if (show_date)
        return day + "/" + month;
    else
        return hour + ":" + mins;
}

function pretty_time_runtime(time){
    var d = new Date();
    d.setTime(time*1000);

    var secs = pad(d.getUTCSeconds(),2);
    var hour = pad(d.getUTCHours(),2);
    var mins = pad(d.getUTCMinutes(),2);
    var day = d.getUTCDate()-1;
    var month = pad(d.getUTCMonth()+1,2); //getMonths returns 0-11
    var year = d.getUTCFullYear();

    return day + "d " + hour + "h " + mins + "m ";
}

function _format_date(unix_timestamp) {
  var difference_in_seconds = (Math.round((new Date()).getTime() / 1000)) - unix_timestamp,
      current_date = new Date(unix_timestamp * 1000), minutes, hours,
      months = new Array(
        'January','February','March','April','May',
        'June','July','August','September','October',
        'November','December');

  if(difference_in_seconds < 60) {
    return difference_in_seconds + "s" + " ago";
  } else if (difference_in_seconds < 60*60) {
    minutes = Math.floor(difference_in_seconds/60);
    return minutes + "m" + " ago";
  } else if (difference_in_seconds < 60*60*24) {
    hours = Math.floor(difference_in_seconds/60/60);
    return hours + "h" + " ago";
  } else if (difference_in_seconds > 60*60*24){
    if(current_date.getYear() !== new Date().getYear())
      return current_date.getDay() + " " + months[current_date.getMonth()].substr(0,3) + " " + _fourdigits(current_date.getYear());
    else {
        return current_date.getDay() + " " + months[current_date.getMonth()].substr(0,3);
    }
  }

  return difference_in_seconds;

  function _fourdigits(number)  {
        return (number < 1000) ? number + 1900 : number;}

  //function _plural(number) {
  //  if(parseInt(number) === 1) {
  //    return "";
  //  }
  //  return "s";
  //}
}
//returns a human readable size in Kilo, Mega, Giga or Tera bytes
//if no from_bytes, assumes value comes in Ks
function humanize_size(value,from_bytes,sufix) {
    if (typeof(value) === "undefined") {
        value = 0;
    }
    var binarySufix = ["", "K", "M", "G", "T" ];

    var i = from_bytes ? 0 : 1;
    while (value >= 1024 && i < 4){
        value = value / 1024;
        i++;
    }
    value = Math.round(value * 10) / 10;

    if (value - Math.round(value) == 0) {
        value = Math.round(value);
    }

    if(sufix == undefined) {
        sufix = "B";
    }

    var st = value + binarySufix[i] + sufix;
    return st;
}

function humanize_size_from_mb(value) {
    if (typeof(value) === "undefined") {
        value = 0;
    }
    var binarySufix =  ["MB", "GB", "TB" ];
    var i=0;
    while (value >= 1024 && i < 2){
        value = value / 1024;
        i++;
    }
    value = Math.round(value * 10) / 10;

    if (value - Math.round(value) == 0) {
        value = Math.round(value);
    }

    var st = value + binarySufix[i];
    return st;
}

//Wrapper to add an element to a dataTable
function addElement(element,dataTable){
    dataTable.fnAddData(element);
}

//deletes an element with id 'tag' from a dataTable
function deleteElement(dataTable,tag){
    var tr = $(tag,dataTable).parents('tr')[0];
    dataTable.fnDeleteRow(tr);
    recountCheckboxes(dataTable);

    var tab = dataTable.parents(".tab");
    if (Sunstone.rightInfoVisible(tab)) {
        $("a[href='back']", tab).click();
    }
}

//Handle the activation of action buttons and the check_all box
//when elements in a datatable are modified.
function recountCheckboxes(dataTable, custom_context){
    var table = $('tbody',dataTable);

    var context;
    if (custom_context){
        context = custom_context;
    } else {
        context = table.parents('.tab');
        if ($(".right-info", context).is(':visible')) {
            return;
        }
    }

    var nodes = $('tr',table); //visible nodes
    var total_length = nodes.length;
    var checked_length = $('input.check_item:checked',nodes).length;
    var last_action_b = $('.last_action_button',context);

    if (checked_length) { //at least 1 element checked
        //enable action buttons
        $('.top_button, .list_button',context).attr('disabled', false);

        //enable checkall box
        if (total_length == checked_length){
            $('.check_all',dataTable).attr('checked','checked');
        } else {
            $('.check_all',dataTable).removeAttr('checked');
        };
    } else { //no elements cheked
        //disable action buttons, uncheck checkAll
        $('.check_all',dataTable).removeAttr('checked');
        $('.top_button, .list_button',context).attr('disabled', true);
    };

    //any case the create dialog buttons should always be enabled.
    $('.create_dialog_button',context).attr('disabled', false);
    $('.alwaysActive',context).attr('disabled', false);
}

//Init action buttons and checkboxes listeners
function tableCheckboxesListener(dataTable, custom_context){
    //Initialization - disable all buttons
    var context = custom_context||dataTable.parents('.tab');

    $('.last_action_button',context).attr('disabled', true);
    $('.top_button, .list_button',context).attr('disabled', true);
    //These are always enabled
    $('.create_dialog_button',context).attr('disabled', false);
    $('.alwaysActive',context).attr('disabled', false);

    //listen to changes in the visible inputs
    $('tbody input.check_item',dataTable).live("change",function(){
        var datatable = $(this).parents('table');

        if($(this).is(":checked"))
        {
            $(this).parents('tr').children().each(function(){$(this).addClass('markrowchecked');});
        }
        else
        {
            $(this).parents('tr').children().removeClass('markrowchecked');
            $(this).parents('tr').children().removeClass('markrowselected');
        }

        recountCheckboxes(datatable, context);
    });
}

// Updates a data_table, with a 2D array containing the new values
// Does a partial redraw, so the filter and pagination are kept
function updateView(item_list,dataTable){
    var selected_row_id = $($('td.markrowselected',dataTable.fnGetNodes())[1]).html();
    if (!selected_row_id) selected_row_id = $($('td.markrowselected',dataTable.fnGetNodes())[0]).html();
    var checked_row_ids = new Array();

    $.each($(dataTable.fnGetNodes()), function(){
        if($('td.markrowchecked',this).length!=0)
        {
            if (!isNaN($($('td',$(this))[1]).html()))
            {
                checked_row_ids.push($($('td',$(this))[1]).html());
            }
            else
            {
                checked_row_ids.push($($('td',$(this))[0]).html());
            }
        }
    });

    if (dataTable) {
        var dTable_settings = dataTable.fnSettings();
        var prev_start = dTable_settings._iDisplayStart;

        dataTable.fnClearTable(false);
        dataTable.fnAddData(item_list, false);

        var new_start = prev_start;

        if(new_start > item_list.length - 1) {
            if(item_list.length > 0)
                new_start = item_list.length - 1;
            else
                new_start = 0;
        }

        dTable_settings.iInitDisplayStart = new_start;

        dataTable.fnDraw(true);
    };

    if(selected_row_id)
    {
        $.each($(dataTable.fnGetNodes()),function(){
            if($($('td',this)[1]).html()==selected_row_id)
            {
                $('td',this)[2].click();
            }
        });
    }

    if(checked_row_ids.length!=0)
    {
        $.each($(dataTable.fnGetNodes()),function(){
            var current_id = $($('td',this)[1]).html();

            if (isNaN(current_id))
            {
                current_id = $($('td',this)[0]).html();
            }

            if (current_id)
            {
                if(jQuery.inArray(current_id, checked_row_ids)!=-1)
                {
                    $('input.check_item',this).first().click();
                    $('td',this).addClass('markrowchecked');
                }
            }
        });
    }
}

//replaces an element with id 'tag' in a dataTable with a new one
function updateSingleElement(element,dataTable,tag){
    // fnGetData should be used instead, otherwise it depends on the visible columns
    var nodes = dataTable.fnGetNodes();
    var tr = $(tag,nodes).parents('tr')[0];
    if(tr){
        var checked_val = $('input.check_item',tr).attr('checked');
        var position = dataTable.fnGetPosition(tr);
        dataTable.fnUpdate(element,position,undefined,false);
        $('input.check_item',tr).attr('checked',checked_val);
        recountCheckboxes(dataTable);
    }
}

function getElementData(id, resource_tag, dataTable){
    var nodes = dataTable.fnGetNodes();
    var tr = $(resource_tag+'_'+id,nodes).parents('tr')[0];
    return dataTable.fnGetData(tr);
}

// Returns an string in the form key=value key=value ...
// Does not explore objects in depth.
function stringJSON(json){
    var str = "";
    for (field in json) {
        str+= field + '=' + json[field] + ' ';
    };
    return str;
}

//Notifications
//Notification of submission of action
function notifySubmit(action, args, extra_param){
    var action_text = action.replace(/OpenNebula\./,'').replace(/\./,' ');

    var msg = "";
    if (!args || (typeof args == 'object' && args.constructor != Array)){

        msg += action_text;
    } else {

        msg += action_text + ": " + args;
    };
    if (extra_param && extra_param.constructor != Object) {
        msg += " >> " + extra_param;
    };

    $.jGrowl(msg, {theme: "jGrowl-notify-submit", position: "bottom-right"});
}

//Notification on error
function notifyError(msg){
    $.jGrowl(msg, {theme: "jGrowl-notify-error", position: "bottom-right", sticky: true });
}

//Standard notification
function notifyMessage(msg){
    $.jGrowl(msg, {theme: "jGrowl-notify-submit", position: "bottom-right"});
}

function notifyCustom(title, msg, sticky) {
    msg = (title ? title : "") + msg;
    $.jGrowl(msg, {theme: "jGrowl-notify-submit", position: "bottom-right", sticky: sticky });
}

// Returns an HTML string with the json keys and values
// Attempts to css format output, giving different values to
// margins etc. according to depth level etc.
// See example of use in plugins.
function prettyPrintJSON(template_json,padding,weight, border_bottom,padding_top_bottom){
    var str = ""
    if (!template_json){ return "Not defined";}
    if (!padding) {padding=10};
    if (!weight) {weight="bold";}
    if (!border_bottom) {border_bottom = "1px solid #efefef";}
    if (!padding_top_bottom) {padding_top_bottom=6;}
    var field = null;

    if (template_json.constructor == Array){
        for (field = 0; field < template_json.length; ++field){
            str += prettyPrintRowJSON(field,template_json[field],padding,weight, border_bottom,padding_top_bottom);
        }
    } else {
        for (field in template_json) {
            str += prettyPrintRowJSON(field,template_json[field],padding,weight, border_bottom,padding_top_bottom);
        }
    }
    return str;
}

function prettyPrintRowJSON(field,value,padding,weight, border_bottom,padding_top_bottom){
    var str="";

    if (typeof value == 'object'){
        //name of field row
        str += '<tr>\
                  <td class="key_td" style=\
                      "padding-left:'+padding+'px;\
                       font-weight:'+weight+';\
                       border-bottom:'+border_bottom+';\
                       padding-top:'+padding_top_bottom+'px;\
                       padding-bottom:'+padding_top_bottom+'px;">'
                       +tr(field)+
                 '</td>\
                  <td class="value_td" style=\
                      "border-bottom:'+border_bottom+';\
                       padding-top:'+padding_top_bottom+'px;\
                       padding-bottom:'+padding_top_bottom+'px">\
                  </td>\
                </tr>';
        //attributes rows
        //empty row - prettyprint - empty row
        str += prettyPrintJSON(value,padding+25,"normal","0",1);
    } else {
        str += '<tr>\
                    <td class="key_td" style="\
                    padding-left:'+padding+'px;\
                    font-weight:'+weight+';\
                    border-bottom:'+border_bottom+';\
                    padding-top:'+padding_top_bottom+'px;\
                    padding-bottom:'+padding_top_bottom+'px">'+
                    tr(field)+
                   '</td>\
                    <td class="value_td" style="\
                       border-bottom:'+border_bottom+';\
                       padding-top:'+padding_top_bottom+'px;\
                       padding-bottom:'+padding_top_bottom+'px">'+
                    value+
                   '</td>\
                </tr>';
    };

    return str;
}

//Add a listener to the check-all box of a datatable, enabling it to
//check and uncheck all the checkboxes of its elements.
function initCheckAllBoxes(datatable, custom_context){

    //small css hack
    $('input.check_all', datatable).css({"border":"2px"});
    $('input.check_all', datatable).live("change",function(){
        var table = $(this).closest('.dataTables_wrapper');
        var checked = $(this).attr('checked');
        if (checked) { //check all
            $('tbody input.check_item',table).attr('checked','checked');
            $('td',table).addClass('markrowchecked');
        } else { //uncheck all
            $('tbody input.check_item',table).removeAttr('checked');
            $('td',table).removeClass('markrowchecked');
        };

        var context = custom_context||table.parents('.tab');
        recountCheckboxes(table, context);
    });
}

//standard handling for the server errors on ajax requests.
//Pops up a message with the information.
function onError(request,error_json, container) {
    var method;
    var action;
    var object;
    var id;
    var reason;
    var m;
    var message = error_json.error.message;

    if ( typeof onError.disabled == 'undefined' ) {
        onError.disabled=false;
    };

    //redirect to login if unauthenticated
    if (error_json.error.http_status=="401") {
        switch (whichUI()){
        case "selfservice":
            window.location.href = "ui";
            break;
        default:
            window.location.href = "login";
        };

        onError.disabled=false;
        return false;
    };


    if (!message){
        if (!onError.disabled){
            notifyError(tr("Cannot contact server: is it running and reachable?"));
            onError.disabled=true;
        }
        return false;
    };

    if (error_json.error.http_status=="404") {
        notifyError(message);
        return false;
    }

    if (container) {
        container.show();
        return false;
    }

    if (message.match(/^Network is unreachable .+$/)){
        if (!onError.disabled){
            notifyError(tr("Network is unreachable: is OpenNebula running?"));
            onError.disabled=true;
        };
        return false;
    } else {
        onError.disabled=false;
    };


    //Parse known errors:
    var get_error = /^\[(\w+)\] Error getting ([\w ]+) \[(\d+)\]\.$/;
    var auth_error = /^\[(\w+)\] User \[(\d+)\] not authorized to perform action on ([\w ]+).$/;

    if (m = message.match(get_error)) {
        method  = m[1];
        action  = "Show";
        object  = m[2];
        id      = m[3];
    } else if (m = message.match(auth_error)) {
        method = m[1];
        object     = m[3];
        reason = tr("Unauthorized");
    };

    if (m) {
        var rows;
        var i;
        var value;
        rows = ["method","action","object","id","reason"];
        message = "";
        for (i = 0; i<rows.length; i++){
            key = rows[i];
            value = eval(key);
            if (value)
                message += "<tr><td class=\"key_error\">"+key+"</td><td>"+value+"</td></tr>";
        }
        message = "<table>" + message + "</table>";
    };

    notifyError(message);
    return true;
}

//Replaces the checkboxes of a datatable with a ajax-loading spinner.
//Used when refreshing elements of a datatable.
function waitingNodes(dataTable){
    $('tr input.check_item:visible',dataTable).replaceWith(spinner);
    //recountCheckboxes(dataTable);
}


//The following functions extract the value of a specific column
//in a dataTable. If the order of datatable columns is changed this
//should be the only place to adjust.
function getUserName(uid){
    if (typeof(dataTable_users) != "undefined"){
        return getName(uid,dataTable_users,2);
    }
    return uid;
}

function getGroupName(gid){
    if (typeof(dataTable_groups) != "undefined"){
        return getName(gid,dataTable_groups,2);
    }
    return gid;
}

function getImageName(id){
    if (typeof(dataTable_images) != "undefined"){
        return getName(id,dataTable_images,4);
    }
    return id;
};

function getClusterName(id){
    if (typeof(dataTable_clusters) != "undefined"){
        return getName(id,dataTable_clusters,2);
    }
    return id;
};

function getDatastoreName(id){
    if (typeof(dataTable_datastores) != "undefined"){
        return getName(id,dataTable_datastores,4);
    }
    return id;
};

function getVNetName(id){
    if (typeof(dataTable_vNetworks) != "undefined"){
        return getName(id,dataTable_vNetworks,4);
    }
    return id;
};

function getHostName(id){
    if (typeof(dataTable_hosts) != "undefined"){
        return getName(id,dataTable_hosts,2);
    }
    return id;
};

function getTemplateName(id){
    if (typeof(dataTable_templates) != "undefined"){
        return getName(id,dataTable_templates,4);
    }
    return id;
};

function getZoneName(id){
    if (typeof(dataTable_zones) != "undefined"){
        return getName(id,dataTable_zones,2);
    }
    return id;
};

// Returns the value of the column with the resource of specified
// id in the dataTable.
function getName(id,dataTable,name_col){
    var name = id;
    if (typeof(dataTable) == "undefined") {
        return name;
    }
    var nodes = dataTable.fnGetData();

    $.each(nodes,function(){
        if (id == this[1]) {
            name = this[name_col];
            return false;
        }
    });
    return name;
};

// A more general version of the above.
// Search a datatable record matching the filter_str in the filter_col. Returns
// the value of that record in the desired value column.
function getValue(filter_str,filter_col,value_col,dataTable){
    var value="";
    if (typeof(dataTable) == "undefined") return value;

    var nodes = dataTable.fnGetData();

    $.each(nodes,function(){
        if (filter_str == this[filter_col]){
            value = this[value_col];
            return false;
        };
    });
    return value;
};

//Replaces all class"tip" divs with an information icon that
//displays the tip information on mouseover.
function setupTips(context, position){

    $('ui-dialog').css('z-index', '1000')
    //For each tip in this context
    $('.tip',context).each(function(){
        var obj = $(this);
        obj.removeClass('tip');
        var tip = obj.html();

        var tip_classes = ['has-tip']
        if (position) {
            tip_classes.push(position)
        }
        //replace the text with an icon and spans
        obj.html('<span data-tooltip class="'+tip_classes.join(' ')+'" data-width="210" title="'+tip+'"><i class="fa fa-question-circle"></i></span>');
        obj.foundation();
    });

}

//returns an array of ids of selected elements in a dataTable
function getSelectedNodes(dataTable, force_datatable){
    var selected_nodes = [];
    if (dataTable){
        var tab = dataTable.parents(".tab")
        if (Sunstone.rightInfoVisible(tab) && !force_datatable) {
            selected_nodes.push(Sunstone.rightInfoResourceId(tab));
        } else {
        //Which rows of the datatable are checked?
        var nodes = $('tbody input.check_item:checked',dataTable);
            $.each(nodes,function(){
                selected_nodes.push($(this).val());
            });
        }
    };
    return selected_nodes;
}

// TODO: Too many arguments. Change to use a params object
function insertSelectOptions(id, context, resource, init_val, empty_value,
    extra_options, filter_att, filter_val){

    $(id, context).html('<i class="fa fa-spinner fa-spin"></i>');

    OpenNebula[resource].list({
        timeout: true,
        success: function (request, obj_list){
            var select_str='<select class="resource_list_select">';

            if (empty_value){
                select_str += '<option class="empty_value" value="">'+
                                tr("Please select")+'</option>';
            }

            if (resource == "Cluster"){
                if(!extra_options){
                    extra_options = "";
                }

                extra_options += '<option value="-1">Default (none)</option>';
            }

            if (extra_options){
                select_str += extra_options;
            }

            if (!filter_att){
                filter_att = [];
            }

            var res_name = OpenNebula[resource].resource;
            $.each(obj_list,function(){
                var id = this[res_name].ID;
                var name = this[res_name].NAME;
                var add = true;

                for (var i=0;i<filter_att.length;i++){
                    if (this[res_name][filter_att[i]] == filter_val[i]){
                        add = false;
                        break;
                    }
                }

                if (add){
                    select_str +='<option elem_id="'+id+'" value="'+id+'">'+
                                    id+': '+name+'</option>';
                }
            });

            select_str+="</select>";

            $(id, context).html(select_str);

            if (init_val){
                $(id+" .resource_list_select", context).val(init_val);
                $(id+" .resource_list_select", context).change();
            }
        },
        error: onError
    });

}

//Escape doublequote in a string and return it
function escapeDoubleQuotes(string){
    if (string != undefined) {
        return string.replace(/\\/g,'\\').replace(/"/g,'\\"');
    } else {
        return string;
    }
}

function derivative(data) {
    for(var i=0; i<data.length-1; i++)
    {
        // Each elem is [timestamp, cumulative value]
        var first = data[i];
        var second = data[i+1];

        // value now - value before / seconds
        var speed = (second[1] - first[1]) / (second[0] - first[0]);

        // The first element is replaced with the second one
        data[i] = [first[0], speed];
    }

    // The last elem must be removed
    data.pop();
}

function plot_graph(response, info) {

    series = [];

    var attributes = info.monitor_resources.split(',');

    if (info.labels) {
        labels = info.labels.split(',')
    }

    for (var i=0; i<attributes.length; i++)
    {
        var attribute = attributes[i];

        var data = response.monitoring[attribute];

        if(info.derivative == true) {
            derivative(data);
        }

        series.push({
            stack: attribute,
            // Turns label TEMPLATE/BLABLA into BLABLA
            label: labels ? labels[i] : attribute[i].split('/').pop(),
            data: data
        });
    }

    var humanize = info.humanize_figures ?
        humanize_size : function(val){ return val };

    var options = {
//        colors: [ "#cdebf5", "#2ba6cb", "#6f6f6f" ]
        colors: [ "#2ba6cb", "#707D85", "#AC5A62" ],
        legend : { show : (info.div_legend != undefined),
                   noColumns: attributes.length,
                   container: info.div_legend
                 },
        xaxis : {
            tickFormatter: function(val,axis){
                return pretty_time_axis(val, info.show_date);
            },
            color: "#999",
            size: 8
        },
        yaxis : { labelWidth: 50,
                  tickFormatter: function(val, axis) {
                      return humanize(val, info.convert_from_bytes, info.y_sufix);
                  },
                  min: 0,
                color: "#999",
                size: 8
                },
        series: {
            lines: {
                lineWidth: 1
            }
        },
        grid: {
            borderWidth: 1,
            borderColor: "#cfcfcf"
        }
    };

    $.plot(info.div_graph, series, options);
}


function plot_totals(response, info) {

    series = [];

    var attributes = info.monitor_resources.split(',');

    if (info.labels) {
        labels = info.labels.split(',')
    }

    var min = Number.MAX_VALUE;
    var max = Number.MIN_VALUE;

    // Get min and max times, from any resource, using the first attribute
    for (var id in response) {
        if(id != "resource") {
            if(info.derivative == true) {
                for (var i=0; i<attributes.length; i++)
                {
                    var attribute = attributes[i];

                    var data = response[id][attribute];

                    derivative(data);
                }
            }

            if (response[id][attributes[0]].length > 0) {
                min = Math.min(min,
                    parseInt(response[id][attributes[0]][0][0]) );

                max = Math.max(max,
                    parseInt(response[id][attributes[0]][ response[id][attributes[0]].length - 1 ][0]) );
            }
        }
    }

    // First flot stack hack: Flot will stack values, but only they exist for all
    // series. Given these two series:
    //
    //        [3,x], [4,x], [5,x]
    // [2,x], [3,x], [4,x]
    //
    // Flot will draw values for 3 and 4. That's why we add 0s at the begining
    // and end of each serie
    //
    // [2,0], [2.9,0] [3,x], [4,x], [5,x]
    // [2,x],         [3,x], [4,x], [4.1,0] [5,0]

    for (var i=0; i<attributes.length; i++)
    {
        var attribute = attributes[i];

        for (var id in response) {
            if(id != "resource") {
                var data = response[id][attribute];

                if(data.length == 0) {
                    continue;
                }

                var local_min = parseInt( data[0][0] );
                var local_max = parseInt( data[data.length - 1][0] );

                if(local_min > min) {
                    data.unshift([local_min-1, 0]);
                    data.unshift([min, 0]);
                }

                if(local_max < max) {
                    data.push([local_max+1, 0]);
                    data.push([max, 0]);
                }

                // Invisible line
                series.push({
                  color: "rgba(0,0,0,0.0)",
                  shadowSize: 0,
                  stack: attribute,
                  data: data
                });
            }
        }

        // Second flot stack hack: We are not interested in the stacked position
        // of each line, we only want to draw the totals. To do that, the last
        // serie to be added is just a line with 0s stacked on top of the
        // invisible ones

        series.push({
            stack: attribute,
            // Turns label TEMPLATE/BLABLA into BLABLA
            label: labels ? labels[i] : attribute[i].split('/').pop(),
            data: [[min, 0], [max,0]]
        });
    }

    var humanize = info.humanize_figures ?
        humanize_size : function(val){ return val };

    var options = {
        //colors: [ "#2ba6cb", "#cdebf5", "#6f6f6f" ],
        colors: [ "#2ba6cb", "#707D85", "#AC5A62" ],
        legend : { show : (info.div_legend != undefined),
                   noColumns: attributes.length,
                   backgroundColor: "black",
                   container: info.div_legend
                 },
        xaxis : {
            tickFormatter: function(val,axis){
                return pretty_time_axis(val, info.show_date);
            }
        },
        yaxis : { labelWidth: 50,
                  tickFormatter: function(val, axis) {
                      return humanize(val, info.convert_from_bytes, info.y_sufix);
                  },
                  min: 0
                }
    };

    $.plot(info.div_graph, series, options);
}


//Shows run a custom action when clicking on rows.
function infoListener(dataTable, info_action, target_tab){
    $('tbody tr',dataTable).die("click");
    $('tbody tr',dataTable).live("click",function(e){

        if ($(e.target).is('input') ||
            $(e.target).is('select') ||
            $(e.target).is('option')) return true;

        var aData = dataTable.fnGetData(this);
        if (!aData) return true;
        var id = $(aData[0]).val();
        if (!id) return true;

        if (info_action)
        {
            //If ctrl is hold down, make check_box click
            if (e.ctrlKey || e.metaKey || $(e.target).is('input'))
            {
                $('.check_item',this).trigger('click');
            }
            else
            {
                if(!target_tab){
                    target_tab = activeTab;
                }

                showElement(target_tab, info_action, id);
            };
        }
        else
        {
            $('.check_item',this).trigger('click');
        };

        return false;
    });
}

function mustBeAdmin(){
    return gid == 0;
}

function mustNotBeAdmin(){
    return !mustBeAdmin();
}

/* Below functions to easier permission management */

function ownerUse(resource){
    return parseInt(resource.PERMISSIONS.OWNER_U);
};
function ownerManage(resource){
    return parseInt(resource.PERMISSIONS.OWNER_M);
};
function ownerAdmin(resource){
    return parseInt(resource.PERMISSIONS.OWNER_A);
};

function groupUse(resource){
    return parseInt(resource.PERMISSIONS.GROUP_U);
};
function groupManage(resource){
    return parseInt(resource.PERMISSIONS.GROUP_M);
};
function groupAdmin(resource){
    return parseInt(resource.PERMISSIONS.GROUP_A);
};

function otherUse(resource){
    return parseInt(resource.PERMISSIONS.OTHER_U);
};
function otherManage(resource){
    return parseInt(resource.PERMISSIONS.OTHER_M);
};
function otherAdmin(resource){
    return parseInt(resource.PERMISSIONS.OTHER_A);
};


function ownerPermStr(resource){
    var result = "";
    result += ownerUse(resource) ? "u" : "-";
    result += ownerManage(resource) ? "m" : "-";
    result += ownerAdmin(resource) ? "a" : "-";
    return result;
};

function groupPermStr(resource){
    var result = "";
    result += groupUse(resource) ? "u" : "-";
    result += groupManage(resource) ? "m" : "-";
    result += groupAdmin(resource) ? "a" : "-";
    return result;
};

function otherPermStr(resource){
    var result = "";
    result += otherUse(resource) ? "u" : "-";
    result += otherManage(resource) ? "m" : "-";
    result += otherAdmin(resource) ? "a" : "-";
    return result;
};

function setPermissionsTable(resource,context){
    if (ownerUse(resource))
        $('.owner_u',context).attr('checked','checked');
    if (ownerManage(resource))
        $('.owner_m',context).attr('checked','checked');
    if (ownerAdmin(resource))
        $('.owner_a',context).attr('checked','checked');
    if (groupUse(resource))
        $('.group_u',context).attr('checked','checked');
    if (groupManage(resource))
        $('.group_m',context).attr('checked','checked');
    if (groupAdmin(resource))
        $('.group_a',context).attr('checked','checked');
    if (otherUse(resource))
        $('.other_u',context).attr('checked','checked');
    if (otherManage(resource))
        $('.other_m',context).attr('checked','checked');
    if (otherAdmin(resource))
        $('.other_a',context).attr('checked','checked');
};


var Quotas = {
    "vms" : function(info, default_quotas){
        if (!$.isEmptyObject(info.VM_QUOTA)){
            var vms_bar = quotaBar(
                info.VM_QUOTA.VM.VMS_USED,
                info.VM_QUOTA.VM.VMS,
                default_quotas.VM_QUOTA.VM.VMS);

            var quotas_tab_html =
            '<fieldset><legend>' + tr("VMs") + '</legend><div>'+vms_bar+'</div><br></fieldset>'

            return quotas_tab_html;
        } else {
            return '';
        }
    },
    "cpu" : function(info, default_quotas){
        if (!$.isEmptyObject(info.VM_QUOTA)){
            var cpu_bar = quotaBarFloat(
                info.VM_QUOTA.VM.CPU_USED,
                info.VM_QUOTA.VM.CPU,
                default_quotas.VM_QUOTA.VM.CPU);

            var quotas_tab_html =
            '<fieldset><legend>' + tr("CPU") + '</legend><div>'+cpu_bar+'</div><br></fieldset>'

            return quotas_tab_html;
        } else {
            return '';
        }
    },
    "memory" : function(info, default_quotas){
        if (!$.isEmptyObject(info.VM_QUOTA)){
            var memory_bar = quotaBarMB(
                info.VM_QUOTA.VM.MEMORY_USED,
                info.VM_QUOTA.VM.MEMORY,
                default_quotas.VM_QUOTA.VM.MEMORY);

            var quotas_tab_html =
            '<fieldset><legend>' + tr("Memory") + '</legend><div>'+memory_bar+'</div><br></fieldset>'

            return quotas_tab_html;
        } else {
            return '';
        }
    },
    "volatile_size" : function(info, default_quotas){
        if (!$.isEmptyObject(info.VM_QUOTA)){
            var volatile_bar = quotaBarMB(
                info.VM_QUOTA.VM.VOLATILE_SIZE_USED,
                info.VM_QUOTA.VM.VOLATILE_SIZE,
                default_quotas.VM_QUOTA.VM.VOLATILE_SIZE);

            var quotas_tab_html =
            '<fieldset><legend>' + tr("Volatile disks") + '</legend><div>'+volatile_bar+'</div><br></fieldset>'

            return quotas_tab_html;
        } else {
            return '';
        }
    },
    "datastore" : function(info, default_quotas) {
        if (!$.isEmptyObject(info.DATASTORE_QUOTA)){
            var quotas_tab_html =
            '<fieldset style="padding: 5px 15px">\
                <legend>'+tr("Datastore")+'</legend>\
                <table class="quota_table extended_table">\
                <thead>\
                    <tr>\
                        <th style="width:16%">'+tr("ID")+'</th>\
                        <th style="width:42%">'+tr("Images")+'</th>\
                        <th style="width:42%">'+tr("Size")+'</th>\
                    </tr>\
                </thead>\
                <tbody>';

            var ds_quotas = [];

            if ($.isArray(info.DATASTORE_QUOTA.DATASTORE))
                ds_quotas = info.DATASTORE_QUOTA.DATASTORE;
            else if (info.DATASTORE_QUOTA.DATASTORE.ID)
                ds_quotas = [info.DATASTORE_QUOTA.DATASTORE];

            for (var i=0; i < ds_quotas.length; i++){

                var default_ds_quotas = default_quotas.DATASTORE_QUOTA[ds_quotas[i].ID]

                if (default_ds_quotas == undefined){
                    default_ds_quotas = {
                        "IMAGES"    : "0",
                        "SIZE"      : "0"
                    }
                }

                var img_bar = quotaBar(
                    ds_quotas[i].IMAGES_USED,
                    ds_quotas[i].IMAGES,
                    default_ds_quotas.IMAGES);

                var size_bar = quotaBarMB(
                    ds_quotas[i].SIZE_USED,
                    ds_quotas[i].SIZE,
                    default_ds_quotas.SIZE);

                quotas_tab_html +=
                '<tr>\
                    <td>'+ds_quotas[i].ID+'</td>\
                    <td>'+img_bar+'</td>\
                    <td>'+size_bar+'</td>\
                </tr>';
            }

            quotas_tab_html +=
                    '</tbody>\
                </table>\
            </fieldset>';

            return quotas_tab_html;
        } else {
            return '';
        }
    },
    "image" : function(info, default_quotas) {
        if (!$.isEmptyObject(info.IMAGE_QUOTA)){
            var quotas_tab_html =
            '<fieldset style="padding: 5px 15px">\
                <legend>'+tr("Image")+'</legend>\
                <table class="quota_table extended_table">\
                <thead>\
                    <tr>\
                        <th style="width:16%">'+tr("ID")+'</th>\
                        <th style="width:84%">'+tr("Running VMs")+'</th>\
                    </tr>\
                </thead>\
                <tbody>';

            var img_quotas = [];

            if ($.isArray(info.IMAGE_QUOTA.IMAGE))
                img_quotas = info.IMAGE_QUOTA.IMAGE;
            else if (info.IMAGE_QUOTA.IMAGE.ID)
                img_quotas = [info.IMAGE_QUOTA.IMAGE];

            for (var i=0; i < img_quotas.length; i++){

                var default_img_quotas = default_quotas.IMAGE_QUOTA[img_quotas[i].ID]

                if (default_img_quotas == undefined){
                    default_img_quotas = {
                        "RVMS"  : "0"
                    }
                }

                var rvms_bar = quotaBar(
                    img_quotas[i].RVMS_USED,
                    img_quotas[i].RVMS,
                    default_img_quotas.RVMS);

                quotas_tab_html +=
                '<tr>\
                    <td>'+img_quotas[i].ID+'</td>\
                    <td>'+rvms_bar+'</td>\
                </tr>';
            }

            quotas_tab_html +=
                    '</tbody>\
                </table>\
            </fieldset>';

            return quotas_tab_html;
        } else {
            return '';
        }
    },
    "network" : function(info, default_quotas){
        if (!$.isEmptyObject(info.NETWORK_QUOTA)){
            var quotas_tab_html =
            '<fieldset style="padding: 5px 15px">\
                <legend>'+tr("Network")+'</legend>\
                <table class="quota_table extended_table">\
                    <thead>\
                        <tr>\
                            <th style="width:16%">'+tr("ID")+'</th>\
                            <th style="width:84%">'+tr("Leases")+'</th>\
                        </tr>\
                    </thead>\
                    <tbody>';

            var net_quotas = [];

            if ($.isArray(info.NETWORK_QUOTA.NETWORK))
                net_quotas = info.NETWORK_QUOTA.NETWORK;
            else if (info.NETWORK_QUOTA.NETWORK.ID)
                net_quotas = [info.NETWORK_QUOTA.NETWORK];

            for (var i=0; i < net_quotas.length; i++){

                var default_net_quotas = default_quotas.NETWORK_QUOTA[net_quotas[i].ID]

                if (default_net_quotas == undefined){
                    default_net_quotas = {
                        "LEASES" : "0"
                    }
                }

                var leases_bar = quotaBar(
                    net_quotas[i].LEASES_USED,
                    net_quotas[i].LEASES,
                    default_net_quotas.LEASES);

                quotas_tab_html +=
                '<tr>\
                    <td>'+net_quotas[i].ID+'</td>\
                    <td>'+leases_bar+'</td>\
                </tr>';
            }

            quotas_tab_html +=
                    '</tbody>\
                </table>\
            </fieldset>';

            return quotas_tab_html;
        } else {
            return '';
        }
    },
    "default_quotas" : function(default_quotas){
        // Initialize the VM_QUOTA to unlimited if it does not exist
        if ($.isEmptyObject(default_quotas.VM_QUOTA)){
            default_quotas.VM_QUOTA = {
                "VM" : {
                    "VMS"           : "0",
                    "MEMORY"        : "0",
                    "CPU"           : "0",
                    "VOLATILE_SIZE" : "0"
                }
            }
        }

        // Replace the DATASTORE array with a map

        var ds_quotas = [];

        if ($.isArray(default_quotas.DATASTORE_QUOTA.DATASTORE))
            ds_quotas = default_quotas.DATASTORE_QUOTA.DATASTORE;
        else if (default_quotas.DATASTORE_QUOTA.DATASTORE)
            ds_quotas = [default_quotas.DATASTORE_QUOTA.DATASTORE];

        delete default_quotas.DATASTORE_QUOTA;

        default_quotas.DATASTORE_QUOTA = {};

        for (var i=0; i < ds_quotas.length; i++){
            default_quotas.DATASTORE_QUOTA[ds_quotas[i].ID] = ds_quotas[i]
        }

        // Replace the IMAGE array with a map

        var img_quotas = [];

        if ($.isArray(default_quotas.IMAGE_QUOTA.IMAGE))
            img_quotas = default_quotas.IMAGE_QUOTA.IMAGE;
        else if (default_quotas.IMAGE_QUOTA.IMAGE)
            img_quotas = [default_quotas.IMAGE_QUOTA.IMAGE];

        delete default_quotas.IMAGE_QUOTA;

        default_quotas.IMAGE_QUOTA = {};

        for (var i=0; i < img_quotas.length; i++){
            default_quotas.IMAGE_QUOTA[img_quotas[i].ID] = img_quotas[i]
        }

        // Replace the NETWORK array with a map

        var net_quotas = [];

        if ($.isArray(default_quotas.NETWORK_QUOTA.NETWORK))
            net_quotas = default_quotas.NETWORK_QUOTA.NETWORK;
        else if (default_quotas.NETWORK_QUOTA.NETWORK)
            net_quotas = [default_quotas.NETWORK_QUOTA.NETWORK];

        delete default_quotas.NETWORK_QUOTA;

        default_quotas.NETWORK_QUOTA = {};

        for (var i=0; i < net_quotas.length; i++){
            default_quotas.NETWORK_QUOTA[net_quotas[i].ID] = net_quotas[i]
        }

        return default_quotas;
    }
}
// Sets up a dialog to edit and update user and group quotas
// Called from user/group plugins
function setupQuotasDialog(dialog){
    dialog.addClass("reveal-modal large max-height").attr("data-reveal", "");

    $('#add_quota_button',dialog).click(function(){
        var sel = $('.tabs-content div.content.active',dialog).attr("id");
        var fields = $('div#'+sel+' input,div#'+sel+' select',dialog);
        var json = {};

        for (var i = 0; i < fields.length; i++){
            var field = $(fields[i]);
            var name = field.attr('name');
            var value = field.val();
            if (name == 'ID' && !value.length){
                notifyError(tr("Please select an element"));
                return false;
            };
            if (!value) value = -1;
            json[name] = value;
        };

        json['TYPE'] = sel.split("_quota")[0].toUpperCase();

        if (json['TYPE'] == "VM" &&
            $('.current_quotas table tbody tr.vm_quota', dialog).length){
            notifyError("Only 1 VM quota is allowed")
            return false;
        }


        var tr = quotaListItem(json)
        $('.current_quotas table tbody',dialog).append($(tr).hide().fadeIn());
        return false;
    });

    $('form', dialog).submit(function(){
        var obj = {};
        $('table tbody tr',this).each(function(){
            var json = JSON.parse($(this).attr('quota'));
            var type = json['TYPE'];
            delete json['TYPE'];
            if (typeof obj[type.toUpperCase()] == "undefined") {
                obj[type.toUpperCase()] = [];
            }
            obj[type.toUpperCase()].push(json);
        });

        var action = $('div.form_buttons button',this).val();
        var sel_elems = SunstoneCfg["actions"][action].elements();
        Sunstone.runAction(action,sel_elems,obj);
        dialog.foundation('reveal', 'close');
        return false;
    });
}

function popUpQuotasDialog(dialog, resource, sel_elems){
    insertSelectOptions("#image_quota select",      dialog, "Image",    null, true);
    insertSelectOptions("#network_quota select",    dialog, "Network",  null, true);
    insertSelectOptions("#datastore_quota select",  dialog, "Datastore",null, true);

    $('table tbody',dialog).empty();
    //If only one user is selected we fecth the user's quotas, otherwise we do nothing.
    if (sel_elems.length == 1){
        var id = sel_elems[0];
        Sunstone.runAction(resource + '.fetch_quotas',id);
    };

    $('input[value="vm"]', dialog).click();

    dialog.foundation().foundation('reveal', 'open');

    $("input[name='VMS']",dialog).focus();
}


//Action to be performed when an edit quota icon is clicked.
function setupQuotaIcons(){
    $('.quota_edit_icon').live('click',function(){
        var dialog = $(this).parents('form');
        var tr = $(this).parents('tr');
        var quota = JSON.parse(tr.attr('quota'));
        switch (quota.TYPE){
            case "VM":
            $('div#vm_quota input[name="VMS"]',dialog).val(quota.VMS);
            $('div#vm_quota input[name="MEMORY"]',dialog).val(quota.MEMORY);
            $('div#vm_quota input[name="CPU"]',dialog).val(quota.CPU);
            $('div#vm_quota input[name="VOLATILE_SIZE"]',dialog).val(quota.VOLATILE_SIZE);
            break;
            case "DATASTORE":
            $('div#datastore_quota select[name="ID"]',dialog).val(quota.ID);
            $('div#datastore_quota input[name="SIZE"]',dialog).val(quota.SIZE);
            $('div#datastore_quota input[name="IMAGES"]').val(quota.IMAGES);
            break;
            case "IMAGE":
            $('div#image_quota select[name="ID"]',dialog).val(quota.ID);
            $('div#image_quota input[name="RVMS"]',dialog).val(quota.RVMS);
            break;
            case "NETWORK":
            $('div#network_quota select[name="ID"]',dialog).val(quota.ID);
            $('div#network_quota input[name="LEASES"]',dialog).val(quota.LEASES);
            break;
        }
        $('.tabs a[href="#'+quota.TYPE.toLowerCase()+'_quota"]',dialog).trigger('click');
        tr.fadeOut(function(){$(this).remove()});
        return false;
    });
}

// Returns an object with quota information in form of list items
function parseQuotas(elem, formatter_f){
    var quotas = [];
    var results = {
        VM : "",
        DATASTORE : "",
        IMAGE : "",
        NETWORK : ""
    }
    //max 1 vm quota
    if (!$.isEmptyObject(elem.VM_QUOTA)){
        elem.VM_QUOTA.VM.TYPE = 'VM'
        quotas.push(elem.VM_QUOTA.VM)
    }

    var ds_arr = []
    if ($.isArray(elem.DATASTORE_QUOTA.DATASTORE)){
        ds_arr = elem.DATASTORE_QUOTA.DATASTORE
    } else if (!$.isEmptyObject(elem.DATASTORE_QUOTA)){
        ds_arr = [elem.DATASTORE_QUOTA.DATASTORE]
    }

    for (var i = 0; i < ds_arr.length; i++){
        ds_arr[i].TYPE = 'DATASTORE';
        quotas.push(ds_arr[i]);
    }

    var im_arr = []
    if ($.isArray(elem.IMAGE_QUOTA.IMAGE)){
        im_arr = elem.IMAGE_QUOTA.IMAGE
    } else if (!$.isEmptyObject(elem.IMAGE_QUOTA)){
        im_arr = [elem.IMAGE_QUOTA.IMAGE]
    }

    for (var i = 0; i < im_arr.length; i++){
        im_arr[i].TYPE = 'IMAGE';
        quotas.push(im_arr[i]);
    }

    var vn_arr = []
    if ($.isArray(elem.NETWORK_QUOTA.NETWORK)){
        vn_arr = elem.NETWORK_QUOTA.NETWORK
    } else if (!$.isEmptyObject(elem.NETWORK_QUOTA)){
        vn_arr = [elem.NETWORK_QUOTA.NETWORK]
    }

    for (var i = 0; i < vn_arr.length; i++){
        vn_arr[i].TYPE = 'NETWORK';
        quotas.push(vn_arr[i]);
    }

    for (var i = 0; i < quotas.length; i++){
        var tr = formatter_f(quotas[i]);
        results[quotas[i].TYPE] += tr;
    }
    return results;
}

//Receives a quota json object. Returns a nice string out of it.
function quotaListItem(quota_json){
    var value = JSON.stringify(quota_json)
    var str = '<tr quota=\''+value+'\' ';

    if (quota_json.TYPE == "VM")
        str += ' class="vm_quota" ';

    str += '><td>'+
        quota_json.TYPE+
        '</td><td style="width:100%;">';
    switch(quota_json.TYPE){
    case "VM":
        str +=  'VMs: ' + quota_json.VMS + (quota_json.VMS_USED ? ' (' + quota_json.VMS_USED + '). ' : ". ") + '<br>' +
               'Memory: ' + quota_json.MEMORY + (quota_json.MEMORY_USED ? ' MB (' + quota_json.MEMORY_USED + ' MB). ' : " MB. ") + '<br>' +
               'CPU: ' + quota_json.CPU +  (quota_json.CPU_USED ? ' (' + quota_json.CPU_USED + '). ' : ". ") + '<br>' +
               'Volatile disks: ' + quota_json.VOLATILE_SIZE + (quota_json.VOLATILE_SIZE_USED ? ' MB (' + quota_json.VOLATILE_SIZE_USED + ' MB). ' : " MB. ");
        break;
    case "DATASTORE":
        str +=  'ID/Name: ' + getDatastoreName(quota_json.ID) + '. ' + '<br>' +
               'Size: ' + quota_json.SIZE +  (quota_json.SIZE_USED ? ' MB (' + quota_json.SIZE_USED + ' MB). ' : " MB. ") + '<br>' +
               'Images: ' + quota_json.IMAGES +  (quota_json.IMAGES_USED ? ' (' + quota_json.IMAGES_USED + '). ' : ".");
        break;
    case "IMAGE":
        str +=  'ID/Name: ' + getImageName(quota_json.ID) + '. ' + '<br>' +
               'RVMs: ' + quota_json.RVMS +  (quota_json.RVMS_USED ? ' (' + quota_json.RVMS_USED + '). ' : ". ");
        break;
    case "NETWORK":
        str +=  'ID/Name: ' + getVNetName(quota_json.ID) + '. ' + '<br>' +
               'Leases: ' + quota_json.LEASES +  (quota_json.LEASES_USED ? ' (' + quota_json.LEASES_USED + '). ': ". ");
        break;
    }
    str += '</td><td><button class="quota_edit_icon radius tiny"><i class="fa fa-pencil"></i></button></td></tr>';
    return str;
}

/* Returns the code of a jquery progress bar
   Options: object with width, height, label and fontSize as keys
*/
function progressBar(value, opts){
    if (value > 100) value = 100;

    if (!opts) opts = {};

    if (!opts.width) opts.width = 'auto';

    if (!opts.label) opts.label = "";

    if (!opts.height) opts.height = '10px';

    if (!opts.fontSize) opts.fontSize = '0.6em';

    if (!opts.labelVPos) opts.labelVPos = '-4px';

    if (!opts.labelHPos) opts.labelHPos = '90px';

    return '<div style="height:'+opts.height+';width:'+opts.width+';position:relative" class="ratiobar ui-progressbar ui-widget ui-widget-content ui-corner-all" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="'+value+'">\
            <span style="position:absolute;width: 100%; text-align: center;font-weight:normal;font-size:'+opts.fontSize+';">'+opts.label+'</span>\
           <div class="ui-progressbar-value ui-widget-header ui-corner-left ui-corner-right" style="width: '+value+'%;"/>\
         </div>';
}

function loadAccounting(resource, id, graphs, options){
    var secs_in_day = 3600 * 24;
    var now = Math.floor(new Date().getTime() / 1000)
    var start = options && options.start ? options.start : now - secs_in_day;
    var end = options && options.end ? options.end : now;
    var interval;
    if (options && options.interval){
        interval = options.interval;
    } else {
        //If we are asking more than one interval is one day, otherwise 1 hour
        interval = (end - start) > secs_in_day ? secs_in_day : 3600;
    }

    for (var i = 0; i < graphs.length; i++){
        var graph_cfg = graphs[i];
        graph_cfg.start =  start
        graph_cfg.end = end
        graph_cfg.interval = interval
        // If the date range is longer than 24 hours, then show only
        // date, otherwise show time in the x axis
        graph_cfg.show_date = (end - start) > (3600 * 24)? true : false;
        Sunstone.runAction(resource+".accounting", id, graph_cfg);
    };
}

function htmlDecode(value){
  return $('<div/>').html(value).text();
};

// Convert from hash to string
function convert_template_to_string(template_json,unshown_values)
{
    if (unshown_values)
       template_json = $.extend({}, template_json, unshown_values);


    var template_str = "\n";
    $.each(template_json, function(key, value)
    {
        // value can be an array
        if (!value)
        {
            template_str=template_str+key+"=\n";
        }
        else
        {
            if (value.constructor == Array)
            {
                var it=null;
                $.each(value, function(index, element)
                {
                   if (!element) return true;
                   // current value can be an object
                   if (typeof element == 'object')
                   {
                        template_str+=key+"=[";
                        for(var current_key in element)
                        {
                            template_str+=current_key+"=\""+element[current_key].toString().replace(/"/g,"\\\"")+"\",";
                        }
                        template_str=template_str.substring(0,template_str.length-1);
                        template_str+="]\n";
                   }
                   else // or a string
                   {
                     template_str=template_str+key+"=\""+ element.toString().replace(/"/g,"\\\"") +"\"\n";
                   }
                })
            }
            else // or a single value
            {
                // which in turn can be an object
                   if (typeof value == 'object')
                   {
                        template_str+=key+"=[";
                        for(var current_key in value)
                        {
                            template_str+=current_key+"=\""+value[current_key].toString().replace(/"/g,"\\\"")+"\",";
                        }
                        template_str=template_str.substring(0,template_str.length-1);
                        template_str+="]\n";
                   }
                   else // or a string
                   {
                      template_str=template_str+key+"=\""+ value.toString().replace(/"/g,"\\\"")+"\"\n";
                   }
            }
        }
    })

    return htmlDecode(template_str);
}

// Create the extended template table (with listeners)
function insert_extended_template_table(template_json,resource_type,resource_id,table_name,unshown_values)
{
    var str = '<table id="'+resource_type.toLowerCase()+'_template_table" class="dataTable configuration_attrs"  cellpadding="0" cellspacing="0" border="0">\
                 <thead>\
                   <tr>\
                     <th colspan="3">' +
                      table_name +
                     '</th>\
                   </tr>\
                  </thead>'+
                  fromJSONtoHTMLTable(template_json,
                                               resource_type,
                                               resource_id) +
                  '<tr>\
                    <td class="key_td"><input type="text" name="new_key" id="new_key" /></td>\
                    <td class="value_td"><textarea rows="1" type="text" name="new_value" id="new_value"></textarea></td>\
                    <td class="text-right"><button type="button" id="button_add_value" class="button small secondary">'+tr("Add")+'</button>\</td>\
                  </tr>' +
                 '</table>'

    // Remove previous listeners
    $("#new_key").die();
    $("#new_value").die();
    $("#new_value_vectorial").die();
    $("#div_minus").die();
    $("#div_edit").die();
    $(".input_edit_value").die();
    $("#div_edit_vectorial").die();
    $(".input_edit_value_vectorial").die();
    $("#div_minus_vectorial").die();
    $("#button_add_value").die();
    $("#button_add_value_vectorial").die();
    $("#div_add_vectorial").die();

    // Add listener for add key and add value for Extended Template
    $('#button_add_value').live("click", function() {
        new_value = $('#new_value',$(this).parent().parent()).val();
        new_key   = $('#new_key',$(this).parent().parent()).val();

        if ( new_key != "" )
        {
            var template_json_bk = $.extend({}, template_json);
            if(template_json[$.trim(new_key)] && (template_json[$.trim(new_key)] instanceof Array))
            {
                template_json[$.trim(new_key)].push($.trim(new_value));
            }
            else
            {
                template_json[$.trim(new_key)]=$.trim(new_value);
            }
            template_str  = convert_template_to_string(template_json,unshown_values);

            Sunstone.runAction(resource_type+".update_template",resource_id,template_str);
            template_json = template_json_bk;
        }
    });

    // Capture the enter key
    $('#new_value').live("keypress", function(e) {
          var ev = e || window.event;
          var key = ev.keyCode;

          if (key == 13 && !ev.altKey)
          {
             //Get the button the user wants to have clicked
             $('#button_add_value', $(this).parent().parent()).click();
             ev.preventDefault();
          }
    })

    // Listener for single values

    // Listener for key,value pair remove action
    $("#div_minus").live("click", function() {
        // Remove div_minus_ from the id
        field               = this.firstElementChild.id.substring(10,this.firstElementChild.id.length);
        var list_of_classes = this.firstElementChild.className.split(" ");
        var ocurrence=null;

        if (list_of_classes.length!=1)
        {
                $.each(list_of_classes, function(index, value) {
                    if (value.match(/^ocurrence_/))
                        ocurrence=value.substring(10,value.length);;
                });
        }

        // Erase the value from the template
        if(ocurrence!=null)
            template_json[field].splice(ocurrence,1);
        else
            delete template_json[field];

        template_str = convert_template_to_string(template_json,unshown_values);

        // Let OpenNebula know
        Sunstone.runAction(resource_type+".update_template",resource_id,template_str);
    });

    // Listener for key,value pair edit action
    $("#div_edit").live("click", function() {
        var key_str=this.firstElementChild.id.substring(9,this.firstElementChild.id.length);

        var value_str = $("#value_td_input_"+key_str).text();
        input = $("#value_td_input_"+key_str).html('<textarea class="input_edit_value" id="input_edit_'+key_str+'" type="text"></textarea>');
        $('#input_edit_'+key_str).val(value_str);

        // Capture the enter key
        $('#input_edit_'+key_str).die();
        $('#input_edit_'+key_str).live("keypress", function(e) {
              var ev = e || window.event;
              var key = ev.keyCode;

              if (key == 13 && !ev.altKey)
              {
                 $('#input_edit_'+key_str).blur();
              }
        })

    });



     $(".input_edit_value").live("change", function() {
        var key_str          = $.trim(this.id.substring(11,this.id.length));
        var value_str        = $.trim(this.value);
        var template_json_bk = $.extend({}, template_json);

        delete template_json[key_str];
        template_json[key_str]=value_str;

        template_str = convert_template_to_string(template_json,unshown_values);

        // Let OpenNebula know
        Sunstone.runAction(resource_type+".update_template",resource_id,template_str);

        template_json = template_json_bk;
    });

    // Listeners for vectorial attributes
    // Listener for key,value pair edit action for subelement of vectorial key
    $("#div_edit_vectorial").live("click", function() {
        var key_str         = $.trim(this.firstElementChild.id.substring(9,this.firstElementChild.id.length));
        var list_of_classes = this.firstElementChild.className.split(" ");
        var ocurrence       = " ";
        var vectorial_key   = null;

        if (list_of_classes.length!=1)
        {
                $.each(list_of_classes, function(index, value) {
                    if (value.match(/^ocurrence_/))
                        ocurrence+=value+" ";
                });
        }

        if (list_of_classes.length!=1)
        {
                $.each(list_of_classes, function(index, value) {
                    if (value.match(/^vectorial_key_/))
                        vectorial_key=value;
                });
        }


        if (ocurrence!=" ")
        {
           var value_str = $.trim($(".value_td_input_"+key_str+"."+ocurrence.substring(1,ocurrence.length-1)+"."+vectorial_key).text());
           $(".value_td_input_"+key_str+"."+ocurrence.substring(1,ocurrence.length-1)+"."+vectorial_key).html('<input class="input_edit_value_vectorial'+ocurrence+vectorial_key+'" id="input_edit_'+key_str+'" type="text" value="'+value_str+'"/>');

        }
        else
        {
           var value_str = $.trim($(".value_td_input_"+key_str+"."+vectorial_key).text());
           $(".value_td_input_"+key_str+"."+vectorial_key).html('<input class="input_edit_value_vectorial'+ocurrence+vectorial_key+'" id="input_edit_'+key_str+'" type="text" value="'+value_str+'"/>');
        }

    });

     $(".input_edit_value_vectorial").live("change", function() {
        var key_str          = $.trim(this.id.substring(11,this.id.length));
        var value_str        = $.trim(this.value);
        var template_json_bk = $.extend({}, template_json);

        var list_of_classes  = this.className.split(" ");
        var ocurrence        = null;
        var vectorial_key    = null;

        if (list_of_classes.length!=1)
        {
                $.each(list_of_classes, function(index, value) {
                    if (value.match(/^ocurrence_/))
                        ocurrence=value.substring(10,value.length);
                });
        }

        if (list_of_classes.length!=1)
        {
                $.each(list_of_classes, function(index, value) {
                    if (value.match(/^vectorial_key_/))
                        vectorial_key=value.substring(14,value.length);
                });
        }

        if (ocurrence!=null)
            template_json[vectorial_key][ocurrence][key_str]=value_str;
        else
            template_json[vectorial_key][key_str]=value_str;

        template_str = convert_template_to_string(template_json,unshown_values);

        // Let OpenNebula know
        Sunstone.runAction(resource_type+".update_template",resource_id,template_str);

        template_json = template_json_bk;
    });

    // Listener for key,value pair remove action
    $("#div_minus_vectorial").live("click", function() {
        // Remove div_minus_ from the id
        var field           = this.firstElementChild.id.substring(10,this.firstElementChild.id.length);
        var list_of_classes = this.firstElementChild.className.split(" ");
        var ocurrence       = null;
        var vectorial_key   = null;

        if (list_of_classes.length!=1)
        {
                $.each(list_of_classes, function(index, value) {
                    if (value.match(/^ocurrence_/))
                        ocurrence=value.substring(10,value.length);
                });
        }

        if (list_of_classes.length!=1)
        {
                $.each(list_of_classes, function(index, value) {
                    if (value.match(/^vectorial_key_/))
                        vectorial_key=value.substring(14,value.length);
                });
        }

        // Erase the value from the template
        if(ocurrence!=null)
            delete template_json[vectorial_key][ocurrence][field];
        else
            delete template_json[vectorial_key][field];

        template_str = convert_template_to_string(template_json,unshown_values);

        // Let OpenNebula know
        Sunstone.runAction(resource_type+".update_template",resource_id,template_str);
    });

    // Listener for vectorial key,value pair add action
    $("#div_add_vectorial").live("click", function() {
        if (!$('#button_add_value_vectorial').html())
        {
            var field           = this.firstElementChild.id.substring(18,this.firstElementChild.id.length);
            var list_of_classes = this.firstElementChild.className.split(" ");
            var ocurrence       = null;
            var vectorial_key   = null;

            if (list_of_classes.length!=1)
            {
                $.each(list_of_classes, function(index, value) {
                    if (value.match(/^ocurrence_/))
                        ocurrence=value;
                });
            }

            if (list_of_classes.length!=1)
            {
                $.each(list_of_classes, function(index, value) {
                    if (value.match(/^vectorial_key_/))
                        vectorial_key=value;
                });
            }


            $(this).parent().parent().after('<tr>\
                                              <td class="key_td"><input type="text" style="text-align:center" name="new_key_vectorial" id="new_key_vectorial" /></td>\
                                              <td class="value_td"><input type="text" name="new_value" id="new_value_vectorial" /></td>\
                                              <td class=""><button class="'+vectorial_key+" "+ocurrence+'" id="button_add_value_vectorial">'+tr("Add")+'</button>\</td>\
                                             </tr>');
        }
    });

    // Add listener for add key and add value for Extended Template
    $('#button_add_value_vectorial').live("click", function() {
        if ( $('#new_value_vectorial').val() != "" && $('#new_key_vectorial').val() != "" )
        {
            var list_of_classes  = this.className.split(" ");
            var ocurrence        = null;
            var vectorial_key    = null;
            var template_json_bk = $.extend({}, template_json);

            if (list_of_classes.length!=1)
            {
                $.each(list_of_classes, function(index, value) {
                    if (value.match(/^vectorial_key_/))
                        vectorial_key=value;
                });
            }

            if (list_of_classes.length!=1)
            {
                $.each(list_of_classes, function(index, value) {
                    if (value.match(/^ocurrence_/))
                        ocurrence=value;
                });
            }

            vectorial_key=vectorial_key.substring(14,vectorial_key.length);

            if (ocurrence!=null)
            {
                ocurrence=ocurrence.substring(10,ocurrence.length);
                template_json[vectorial_key][ocurrence][$('#new_key_vectorial').val()] = $.trim($('#new_value_vectorial').val());
            }
            else
            {
                template_json[vectorial_key][$('#new_key_vectorial').val()] = $.trim($('#new_value_vectorial').val());
            }

            template_str  = convert_template_to_string(template_json,unshown_values);

            Sunstone.runAction(resource_type+".update_template",resource_id,template_str);
            // This avoids to get a messed template if the update fails
            template_json = template_json_bk;
        }
    });

    // Capture the enter key
    $('#new_value_vectorial').live("keypress", function(e) {
          var ev = e || window.event;
          var key = ev.keyCode;

          if (key == 13)
          {
             //Get the button the user wants to have clicked
             $('#button_add_value_vectorial').click();
             ev.preventDefault();
          }
    })



    return str;
}

// Returns an HTML string with the json keys and values
function fromJSONtoHTMLTable(template_json,resource_type,resource_id,vectorial,ocurrence){
    var str = ""
    if (!template_json){ return "Not defined";}
    var field = null;

    // Iterate for each value in the JSON object
    for (field in template_json)
    {
        str += fromJSONtoHTMLRow(field,
                                 template_json[field],
                                 resource_type,
                                 resource_id,
                                 vectorial,
                                 ocurrence);
    }

    return str;
}


// Helper for fromJSONtoHTMLTable function
function fromJSONtoHTMLRow(field,value,resource_type,resource_id, vectorial_key,ocurrence){
    var str = "";

    // value can be an array
    if (value.constructor == Array)
    {
        var it=null;

        for (it = 0; it < value.length; ++it)
        {
           var current_value = value[it];

           // if value is object, we are dealing with a vectorial value
           if (typeof current_value == 'object')
           {
               str += '<tr id="'+resource_type.toLowerCase()+'_template_table_'+field+'">\
                           <td class="key_td key_vectorial_td">'+tr(field)+'</td>\
                           <td class="value_vectorial_td"></td>\
                           <td class="text-right">\
                             <span id="div_add_vectorial">\
                               <a id="div_add_vectorial_'+field+'" class="add_vectorial_a ocurrence_'+it+' vectorial_key_'+field+'" href="#"><i class="fa fa-plus-sign"/></a>\
                             </span>&emsp;\
                             <span id="div_minus">\
                               <a id="div_minus_'+field+'" class="remove_vectorial_x ocurrence_'+it+'" href="#"><i class="fa fa-pencil-square-o"/><i class="fa fa-trash-o"/></a>\
                             </span>\
                           </td>'


               str += fromJSONtoHTMLTable(current_value,
                                          resource_type,
                                          resource_id,
                                          field,
                                          it);
           }
           else
           {
               // if it is a single value, create the row for this occurence of the key
               str += fromJSONtoHTMLRow(field,
                                        current_value,
                                        resource_type,
                                        resource_id,
                                        false,
                                        it);
           }
        }
    }
    else // or value can be a string
    {
        var ocurrence_str="";
        if (ocurrence!=null)
            ocurrence_str=" ocurrence_"+ocurrence;

        // If it comes from a vectorial daddy key, then reflect so in the html
        if (vectorial_key)
        {
            str += '<tr>\
                     <td class="key_td key_vectorial_td" style="text-align:center">'+tr(field)+'</td>\
                     <td class="value_td value_vectorial_td value_td_input_'+field+ocurrence_str+' vectorial_key_'+vectorial_key+'" id="value_td_input_'+field+'">'+value+'</td>\
                     <td class="text-right">\
                       <span id="div_edit_vectorial">\
                         <a id="div_edit_'+field+'" class="edit_e'+ocurrence_str+' vectorial_key_'+vectorial_key+'" href="#"><i class="fa fa-pencil-square-o"/></a>\
                       </span>&emsp;\
                       <span id="div_minus_vectorial">\
                         <a id="div_minus_'+field+'" class="remove_x'+ocurrence_str+' vectorial_key_'+vectorial_key+'" href="#"><i class="fa fa-trash-o"/></a>\
                       </span>\
                     </td>\
                   </tr>';
        }
        else
        {
           // If it is not comming from a vectorial daddy key, it can still vectorial itself
           if (typeof value == 'object')
           {
               str += '<tr id="'+resource_type.toLowerCase()+'_template_table_'+field+'">\
                           <td class="key_td key_vectorial_td">'+tr(field)+'</td>\
                           <td class="value_vectorial_td"></td>\
                           <td class="text-right">\
                             <span id="div_add_vectorial">\
                               <a id="div_add_vectorial_'+field+'" class="add_vectorial_a'+ocurrence_str+' vectorial_key_'+field+'" href="#"><i class="fa fa-plus-sign"/></a>\
                             </span>&emsp;\
                             <span id="div_minus">\
                               <a id="div_minus_'+field+'" class="remove_vectorial_x'+ocurrence_str+'" href="#"><i class="fa fa-trash-o"/></a>\
                             </span>\
                           </td>'
               str += fromJSONtoHTMLTable(value,
                          resource_type,
                          resource_id,
                          field,
                          ocurrence);
           }
           else // or, just a single value
           {
                str += '<tr>\
                         <td class="key_td">'+tr(field)+'</td>\
                         <td class="value_td" id="value_td_input_'+field+'">'+value+'</td>\
                         <td class="text-right">\
                           <span id="div_edit">\
                             <a id="div_edit_'+field+'" class="edit_e'+ocurrence_str+'" href="#"><i class="fa fa-pencil-square-o"/></a>\
                           </span>&emsp;\
                           <span id="div_minus">\
                             <a id="div_minus_'+field+'" class="remove_x'+ocurrence_str+'" href="#"><i class="fa fa-trash-o"/></a>\
                           </span>\
                         </td>\
                       </tr>';
            }
        }

    }


    return str;
}

//Returns an octet given a permission table with checkboxes
function buildOctet(permTable){
    var owner=0;
    var group=0;
    var other=0;

    if ($('.owner_u',permTable).is(':checked'))
        owner+=4;
    if ($('.owner_m',permTable).is(':checked'))
        owner+=2;
    if ($('.owner_a',permTable).is(':checked'))
        owner+=1;

    if ($('.group_u',permTable).is(':checked'))
        group+=4;
    if ($('.group_m',permTable).is(':checked'))
        group+=2;
    if ($('.group_a',permTable).is(':checked'))
        group+=1;

    if ($('.other_u',permTable).is(':checked'))
        other+=4;
    if ($('.other_m',permTable).is(':checked'))
        other+=2;
    if ($('.other_a',permTable).is(':checked'))
        other+=1;

    return ""+owner+group+other;
};


// Returns HTML with listeners to control permissions
function insert_permissions_table(tab_name, resource_type, resource_id, owner, group, vm_uid, vm_gid){
     var str ='<table class="'+resource_type.toLowerCase()+'_permissions_table dataTable extended_table">'

     if (Config.isTabActionEnabled(tab_name, resource_type+'.chmod')) {
        str += '<thead><tr>\
             <th style="width:130px">'+tr("Permissions")+':</th>\
             <th style="width:40px;text-align:center;">'+tr("Use")+'</th>\
             <th style="width:40px;text-align:center;">'+tr("Manage")+'</th>\
             <th style="width:40px;text-align:center;">'+tr("Admin")+'</th></tr></thead>\
         <tr>\
             <td class="key_td">'+tr("Owner")+'</td>\
             <td style="text-align:center"><input type="checkbox" class="permission_check owner_u" /></td>\
             <td style="text-align:center"><input type="checkbox" class="permission_check owner_m" /></td>\
             <td style="text-align:center"><input type="checkbox" class="permission_check owner_a" /></td>\
         </tr>\
         <tr>\
             <td class="key_td">'+tr("Group")+'</td>\
             <td style="text-align:center"><input type="checkbox" class="permission_check group_u" /></td>\
             <td style="text-align:center"><input type="checkbox" class="permission_check group_m" /></td>\
             <td style="text-align:center"><input type="checkbox" class="permission_check group_a" /></td>\
         </tr>\
         <tr>\
             <td class="key_td">'+tr("Other")+'</td>\
             <td style="text-align:center"><input type="checkbox" class="permission_check other_u" /></td>\
             <td style="text-align:center"><input type="checkbox" class="permission_check other_m" /></td>\
             <td style="text-align:center"><input type="checkbox" class="permission_check other_a" /></td>\
         </tr>'

        $(document).off('change', ".permission_check");
        $(document).on('change', ".permission_check", function(){
            var permissions_table  = $("."+resource_type.toLowerCase()+"_permissions_table");
            var permissions_octect = { octet : buildOctet(permissions_table) };

            Sunstone.runAction(resource_type+".chmod",resource_id,permissions_octect);
        });
    }

    var context = '.'+resource_type.toLowerCase()+'_permissions_table';

    if (Config.isTabActionEnabled(tab_name, resource_type+'.chgrp') || Config.isTabActionEnabled(tab_name, resource_type+'.chown')) {
        str += '<thead><tr><th colspan="4" style="width:130px">'+tr("Ownership")+'</th>\</tr></thead>'

        if (Config.isTabActionEnabled(tab_name, resource_type+'.chown')) {
            str += '<tr>\
                <td class="key_td">'+tr("Owner")+'</td>\
                <td colspan="2" id="value_td_owner">'+owner+'</td>\
                 <td><div id="div_edit_chg_owner">\
                        <a id="div_edit_chg_owner_link" class="edit_e" href="#"><i class="fa fa-pencil-square-o right"/></a>\
                     </div>\
                 </td>\
            </tr>'

            // Handlers for chown
            $(document).off("click", context + " #div_edit_chg_owner_link");
            $(document).on("click", context + " #div_edit_chg_owner_link", function() {
                var tr_context = $(this).parents("tr");
                insertSelectOptions("#value_td_owner", tr_context, "User", vm_uid, false);
            });

            $(document).off("change", context + " #value_td_owner .resource_list_select");
            $(document).on("change", context + " #value_td_owner .resource_list_select", function() {
                var value_str = $(this).val();
                if(value_str!="")
                {
                    // Let OpenNebula know
                    var resource_struct = new Array();
                    resource_struct[0]  = resource_id;
                    Sunstone.runAction(resource_type+".chown",resource_struct,value_str);
                }
            });
        }

        if (Config.isTabActionEnabled(tab_name, resource_type+'.chgrp')) {
           str += '<tr>\
                <td class="key_td">'+tr("Group")+'</td>\
                <td colspan="2" id="value_td_group">'+group+'</td>\
                 <td><div id="div_edit_chg_group">\
                        <a id="div_edit_chg_group_link" class="edit_e" href="#"><i class="fa fa-pencil-square-o right"/></a>\
                     </div>\
                 </td>\
            </tr>'

            // Handlers for chgrp
            $(document).off("click", context + " #div_edit_chg_group_link");
            $(document).on("click", context + " #div_edit_chg_group_link", function() {
                var tr_context = $(this).parents("tr");
                insertSelectOptions("#value_td_group", tr_context, "Group", vm_gid, false);
            });

            $(document).off("change", context + " #value_td_group .resource_list_select");
            $(document).on("change", context + " #value_td_group .resource_list_select", function() {
                var value_str = $(this).val();
                if(value_str!="")
                {
                    // Let OpenNebula know
                    var resource_struct = new Array();
                    resource_struct[0]  = resource_id;
                    Sunstone.runAction(resource_type+".chgrp",resource_struct,value_str);
                }
            });
        }
    }

    str += '</table>'

    return str;
}

function insert_rename_tr(tab_name, resource_type, resource_id, resource_name){
    var str =
    '<tr class="'+resource_type.toLowerCase()+'_rename">\
        <td class="key_td">'+tr("Name")+'</td>\
        <td class="value_td_rename">'+resource_name+'</td>\
        <td>\
            <div id="div_edit_rename">\
                <a id="div_edit_rename_link" class="edit_e" href="#"><i class="fa fa-pencil-square-o right"/></a>\
            </div>\
        </td>\
    </tr>';

    var context = '.'+resource_type.toLowerCase()+'_rename';

    $(document).off("click", context+" #div_edit_rename_link");
    $(document).off("change", context+" .input_edit_value_rename");

    // Listener for edit link for rename
    $(document).on("click", context + " #div_edit_rename_link", function() {
        var value_str = $(".value_td_rename", context).text();
        $(".value_td_rename", context).html('<input class="input_edit_value_rename" id="input_edit_rename" type="text" value="'+value_str+'"/>');
    });

    $(document).on("change", context + " .input_edit_value_rename", function() {
        var value_str = $(".input_edit_value_rename", context).val();
        if(value_str!="")
        {
            // Let OpenNebula know
            var name_template = {"name": value_str};
            Sunstone.runAction(resource_type+".rename", resource_id, name_template);
        }
    });

    return str;
}

function insert_cluster_dropdown(resource_type, resource_id, cluster_value, cluster_id, context_str){
    var str =  '<td class="key_td">' + tr("Cluster") + '</td>\
                <td class="value_td_cluster">'+(cluster_value.length ? cluster_value : "-")+'</td>\
                <td>\
                  <div id="div_edit_chg_cluster">\
                     <a id="div_edit_chg_cluster_link" class="edit_e" href="#"><i class="fa fa-pencil-square-o right"/></a>\
                  </div>\
                </td>';

    $(document).off("click", context_str + " #div_edit_chg_cluster_link");
    $(document).on("click", context_str + " #div_edit_chg_cluster_link", function() {
        var tr_context = $(this).parents("tr");
        insertSelectOptions(".value_td_cluster", tr_context, "Cluster", cluster_id, false);
    });

    $(document).off("change", context_str + " .value_td_cluster .resource_list_select");
    $(document).on("change", context_str + " .value_td_cluster .resource_list_select", function() {
        var value_str = $(this).val();
        if(value_str!="")
        {
            // Let OpenNebula know
            var resource_struct = new Array();
            resource_struct[0]  = resource_id;
            Sunstone.runAction(resource_type+".addtocluster",resource_struct,value_str);
        }
    });

    return str;
}

//insert_group_dropdown("User",info.ID,info.GNAME,info.GID) +
function insert_group_dropdown(resource_type, resource_id, group_value, group_id, context_str){
    var str =  '<td class="key_td">' + tr("Group") + '</td>\
                <td class="value_td_group">'+ group_value +'</td>\
                <td>\
                  <div id="div_edit_chg_group">\
                     <a id="div_edit_chg_group_link" class="edit_e" href="#"><i class="fa fa-pencil-square-o right"/></a>\
                  </div>\
                </td>';

    $(document).off("click", context_str + " #div_edit_chg_group_link");
    $(document).on("click", context_str + " #div_edit_chg_group_link", function() {
        var tr_context = $(this).parents("tr");
        insertSelectOptions(".value_td_group", tr_context, "Group", group_id, false);
    });

    $(document).off("change", context_str + " .value_td_group .resource_list_select");
    $(document).on("change", context_str + " .value_td_group .resource_list_select", function() {
        var value_str = $(this).val();
        if(value_str!="")
        {
            // Let OpenNebula know
            var resource_struct = new Array();
            resource_struct[0]  = resource_id;
            Sunstone.runAction(resource_type+".chgrp",resource_struct,value_str);
        }
    });

    return str;
}

/*
 * Helpers for quotas
 */

function quotaBar(usage, limit, default_limit, not_html){
    var int_usage = parseInt(usage, 10);
    var int_limit = quotaIntLimit(limit, default_limit);
    return quotaBarHtml(int_usage, int_limit, null, not_html);
}

function quotaBarMB(usage, limit, default_limit, not_html){
    var int_usage = parseInt(usage, 10);
    var int_limit = quotaIntLimit(limit, default_limit);

    info_str = humanize_size(int_usage * 1024)+' / '
            +((int_limit > 0) ? humanize_size(int_limit * 1024) : '-')

    return quotaBarHtml(int_usage, int_limit, info_str, not_html);
}

function quotaBarFloat(usage, limit, default_limit, not_html){
    var float_usage = parseFloat(usage, 10);
    var float_limit = quotaFloatLimit(limit, default_limit);
    return quotaBarHtml(float_usage, float_limit, null, not_html);
}

function quotaBarHtml(usage, limit, info_str, not_html){
    percentage = 0;

    if (limit > 0){
        percentage = Math.floor((usage / limit) * 100);

        if (percentage > 100){
            percentage = 100;
        }
    }

    info_str = info_str || ( usage+' / '+((limit > 0) ? limit : '-') );

    if (not_html) {
        return {
            "percentage": percentage,
            "str": info_str
        }
    } else {
        html = '<span class="progress-text right" style="font-size: 12px">'+info_str+'</span><br><div class="progress radius" style="height: 10px; margin-bottom:0px"><span class="meter" style="width: '
            +percentage+'%"></div>';

        return html;
    }
}

function usageBarHtml(usage, limit, info_str, color){
    percentage = 0;

    if (limit > 0){
        percentage = (usage / limit) * 100;

        if (percentage > 100){
            percentage = 100;
        }
    }

    info_str = info_str || ( usage+' / '+((limit > 0) ? limit : '-') );

    var classes = "meter";
    if (color){
        if (percentage <= 20){
            classes += " usage-low";
        } else if (percentage >= 80){
            classes += " usage-high";
        } else {
            classes += " usage-mid";
        }
    }

    html = '<div class="progress-container"><div class="progress secondary round">\
    <span class="'+classes+'" style="width: '+percentage+'%"></span></div>\
    <div class="progress-text">'+info_str+'</div></div>';

    return html;
}

function quotaIntLimit(limit, default_limit){
    i_limit = parseInt(limit, 10);
    i_default_limit = parseInt(default_limit, 10);

    if (i_limit == -1){
        i_limit = i_default_limit;
    }

    if (isNaN(i_limit))
    {
        i_limit = 0;
    }

    return i_limit
}

function quotaFloatLimit(limit, default_limit){
    f_limit = parseFloat(limit, 10);
    f_default_limit = parseFloat(default_limit, 10);

    if (f_limit == -1){
        f_limit = f_default_limit;
    }

    if (isNaN(f_limit))
    {
        f_limit = 0;
    }

    return f_limit
}

function quotaDashboard(html_tag, legend, font_large_size, font_small_size, quota){
    return '<div class="row">'+
          '<div class="large-12 columns text-center" style="margin-bottom: 5px">'+
            '<span id="'+html_tag+'_percentage" style="font-size:'+font_large_size+';">'+quota.percentage+'</span>'+'<span style="font-size:20px; color: #999">'+"%"+'</span>'+
          '</div>'+
        '</div>'+
        '<div class="row">'+
          '<div class="large-12 columns text-center">'+
            '<div class="progress large radius">'+
            '  <span id="'+html_tag+'_meter" class="meter" style="width: '+quota.percentage+'%"></span>'+
            '</div>'+
          '</div>'+
        '</div>'+
        '<div class="row">'+
          '<div class="large-12 columns text-center">'+
            '<span>'+legend+'</span>'+
            '<br>'+
            '<span id="'+html_tag+'_str" style="color: #999; font-size: '+font_small_size+';">'+quota.str+'</span>'+
          '</div>'+
        '</div>';
}

var activeTab;
var outerLayout, innerLayout;

function hideDialog(){
    innerLayout.close("south");
}

function popDialog(content, context){
    $(".right-info", context).html(content);
    context.foundation();
    //innerLayout.open("south");
}

function popDialogLoading(context){
    $(".right-list", context).hide();
    $(".right-info", context).show();
    $(".only-right-list", context).hide();
    $(".only-right-info", context).show();
    var loading = '<div style="margin-top:'+Math.round($("#dialog").height()/6)+'px; text-align: center; width: 100%"><img src="images/pbar.gif" alt="loading..." /></div>';
    popDialog(loading, context);
}

function showTab(tabname,highlight_tab){
    //Since menu items no longer have an <a> element
    //we no longer expect #tab_id here, but simply tab_id
    //So safety check - remove # from #tab_id if present to ensure compatibility

    //$('tbody input.check_item:checked').click();
    //$('td').removeClass('markrowchecked markrowselected');

    if(!SunstoneCfg['tabs'][tabname]){
        return false;
    }

    last_selected_row = null;

    if (tabname.indexOf('#') == 0)
        tabname = tabname.substring(1);
    if (highlight_tab && highlight_tab.indexOf('#') == 0)
        highlight_tab == highlight.substring(1);

    //check if we are already in the target tab
    if( activeTab == tabname &&
        Sunstone.rightListVisible(tab)){

        return false;
    }

    activeTab = tabname;

    if (!highlight_tab) highlight_tab = activeTab;

    //clean selected menu
    $("#navigation li").removeClass("navigation-active-li");
    $("div#header ul#menutop_ul li").removeClass("navigation-active-li");

    //select tab in left menu
    var li = $("#navigation li#li_"+highlight_tab)
    li.addClass("navigation-active-li");

    //select tab in top menu
    var top_li = $("div#header ul#menutop_ul li#top_"+highlight_tab);
    top_li.addClass("navigation-active-li");

    var tab = $('#'+activeTab);
    //show tab
    $(".tab").hide();
    tab.show();
    $(".right-list", tab).show();
    $(".right-info", tab).hide();
    $(".only-right-list", tab).show();
    $(".only-right-info", tab).hide();

    recountCheckboxes($(".dataTable", tab).first());

    var res = SunstoneCfg['tabs'][activeTab]['resource']
    if (res){
        Sunstone.runAction(res+".list");
    } else {
        var action = activeTab+".refresh";

        if(SunstoneCfg["actions"][action]){
            Sunstone.runAction(action);
        }
    }
}

function showElement(tabname, info_action, element_id){
    if(!SunstoneCfg['tabs'][tabname]){
        return false;
    }

    showTab(tabname);

    var context = $('#'+tabname);
    popDialogLoading(context);

    var res = SunstoneCfg['tabs'][tabname]['resource'];

    Sunstone.runAction(info_action,element_id);
    $(".resource-id", context).html(element_id);
    //enable action buttons
    $('.top_button, .list_button', context).attr('disabled', false);
}

function setupTabs(){

    var topTabs = $(".left-content ul li.topTab");
    var subTabs = $(".left-content ul li.subTab");

    subTabs.live("click",function(){
        //leave floor to topTab listener in case of tabs with both classes
        if ($(this).hasClass('topTab')) return false;

        var tab = $(this).attr('id').substring(3);
        showTab(tab);
        return false;
    });

    topTabs.live("click",function(e){
        var tab = $(this).attr('id').substring(3);
        //Subtabs have a class with the name of  this tab
        var subtabs = $('div#menu li.'+tab);

        //toggle subtabs only when clicking on the icon or when clicking on an
        //already selected menu
        if ($(this).hasClass("tab_with_no_content")){
            //for each subtab, we hide the subsubtabs
            subtabs.each(function(){
                //for each subtab, hide its subtabs
                var subsubtabs = $(this).attr('id').substr(3);
                //subsubtabs class
                subsubtabs = $('div#menu li.'+subsubtabs);
                subsubtabs.hide();
            });
            //hide subtabs and reset icon to + position, since all subsubtabs
            //are hidden
            subtabs.fadeToggle('fast');
            $(this).removeClass('active');
            return false;
        }
        else {
            showTab(tab);
            return false;
        }


    });

};



//Plugins have done their pre-ready jobs when we execute this. That means
//all startup configuration is in place regarding tabs, info panels etc.
$(document).ready(function(){

    //Contexts - make everything more efficient
    main_tabs_context = $('div.right-content');
    dialogs_context = $('div#dialogs');
    plots_context = $('div#plots');
    info_panels_context = $('div#info_panels');



    //Insert the tabs in the DOM and their buttons.
    insertTabs();
//    hideSubTabs();
    insertButtons();

    //Enhace the look of select buttons
    initListButtons();

    //Prepare the standard confirmation dialogs
    setupConfirmDialogs();

    $(".tab").hide();

    setupTabs();

    readCookie();
    setLogin();

    $("a[href='back']").live("click", function(e){
        $(".navigation-active-li a", $("#navigation")).click();
        e.preventDefault();
    });

    //Listen for .action_buttons
    //An action buttons runs a predefined action. If it has type
    //"multiple" it runs that action on the elements of a datatable.
    $('.action_button').live("click",function(){
        var error = 0;
        var table = null;
        var value = $(this).val()
        if ($.isEmptyObject(value)) {
            value = $(this).attr('href');
        }

        if(!$(this).hasClass("refresh")){
            $(document).foundation('dropdown', 'closeall');
        }

        var action = SunstoneCfg["actions"][value];
        if (!action) {
            notifyError("Action "+value+" not defined.");
            return false;
        };
        switch (action.type){
        case "multiple": //find the datatable
            var context = $(this).parents(".tab");
            var nodes = action.elements();
            error = Sunstone.runAction(value,nodes);
            break;
        default:
            error = Sunstone.runAction(value);
        }

        if (!error && !$(this).hasClass("refresh")){
            //proceed to close confirm dialog in
            //case it was open
            $('div#confirm_dialog').foundation('reveal', 'close');
        };

        return false;
    });

    //Listen .toggle_top_buttons.
    //$(".toggle_top_button").live("click", function(){
    //    var tab = $(this).parents(".tab");
    //    var custom_id = tab.attr('id');
//
    //    if(top_interval_ids[custom_id] == null){
    //        $(this).html('<i class="fa fa-eye-slash"/>');
//
    //        var refresh_button = $(".fa-refresh", $(this).parents(".action_blocks"));
    //        top_interval_ids[custom_id] = setInterval(function(){
    //            if(Sunstone.rightListVisible(tab)){
    //                //console.log("top for "+custom_id);
    //                refresh_button.click();
    //            }
    //            //else {console.log("top not visible for "+custom_id);}
    //        }, top_interval);
    //    } else {
    //        clearInterval(top_interval_ids[custom_id]);
    //        top_interval_ids[custom_id] = null;
//
    //        $(this).html('<i class="fa fa-eye"/>');
    //    }
    //});

    //Listen .confirm_buttons. These buttons show a confirmation dialog
    //before running the action.
    $('.confirm_button',main_tabs_context).live("click",function(){
        $(document).foundation('dropdown', 'closeall');
        popUpConfirmDialog(this);
        return false;
    });

    //Listen .confirm_buttons. These buttons show a confirmation dialog
    //with a select box before running the action.
    $('.confirm_with_select_button',main_tabs_context).live("click",function(){
        $(document).foundation('dropdown', 'closeall');
        popUpConfirmWithSelectDialog(this);
        return false;
    });

    //Jquery-enhace the buttons in the DOM
    //$('button').button();

    //Close overlay dialogs when clicking outside of them.
    $(".ui-widget-overlay").live("click", function (){
        $("div:ui-dialog:visible").foundation('reveal', 'close');
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

    zone_refresh();


   $('#zonelector').die();
   $('#zonelector').live("click", function(){
       zone_refresh();
   });

    $('a.zone-choice').live("click", function(){
      $.ajax({
        url: 'config',
        type: "HEAD",
        headers: {
            "ZONE_NAME" : this.id
        },
        dataType: "json",
        success: function(){
            window.location.href = ".";
        },
        error: function(response){
        }
      });
    });

    //Start with the dashboard (supposing we have one).
    showTab('dashboard-tab');

    $(document).foundation({
      reveal : {
        animation: 'fade',
        animation_speed: 150
      }
    })
});

// Format time in UTC, YYYY/MM/DD
// time is in ms
function time_UTC(time){
    var d = new Date(time);

    return d.getUTCFullYear() + '/' + (d.getUTCMonth()+1) + '/' + d.getUTCDate();
}

// div is a jQuery selector
// The following options can be set:
//   fixed_user     fix an owner user ID
//   fixed_group    fix an owner group ID
//   init_group_by  "user", "group", "vm". init the group-by selector
//   fixed_group_by "user", "group", "vm". set a fixed group-by selector
function accountingGraphs(div, opt){

    if(div.html() != ""){
        return false;
    }

    div.html(
    '<div class="row">\
      <div class="large-4 left columns">\
        <label for="acct_start_time">'+tr("Start time")+'</label>\
        <input id="acct_start_time" type="text" placeholder="2013/12/30"/>\
      </div>\
      <div class="large-4 left columns">\
        <label for="acct_end_time">'+tr("End time")+'</label>\
        <input id="acct_end_time" type="text" placeholder="'+tr("Today")+'"/>\
      </div>\
      <div id="acct_group_by_container" class="large-4 left columns">\
        <label for="acct_group_by">' +  tr("Group by") + '</label>\
        <select id="acct_group_by" name="acct_group_by">\
          <option value="user">' + tr("User") + '</option>\
          <option value="group">' + tr("Group") + '</option>\
          <option value="vm">' + tr("VM") + '</option>\
        </select>\
      </div>\
    </div>\
    <div class="row" id="acct_owner">\
      <div class="large-4 text-center columns large-offset-4">\
        <input id="acct_owner_all"   type="radio" name="acct_owner" value="acct_owner_all" checked/><label for="acct_owner_all">' + tr("All") + '</label>\
        <input id="acct_owner_group" type="radio" name="acct_owner" value="acct_owner_group" /><label for="acct_owner_group">' + tr("Group") + '</label>\
        <input id="acct_owner_user"  type="radio" name="acct_owner" value="acct_owner_user" /><label for="acct_owner_user">' + tr("User") + '</label>\
      </div>\
      <div class="large-4 columns">\
        <div id="acct_owner_select"/>\
      </div>\
    </div>\
    <br>\
    <div class="row">\
      <div class="large-6 large-centered columns">\
        <button class="button radius success large-12" id="acct_submit" type="button">'+tr("Get accounting info")+'</button>\
      </div>\
    </div>\
    <br>\
    <div class="row">\
    </div>\
    <div id="acct_placeholder">\
      <div class="row">\
        <div class="large-8 large-centered columns">\
          <div class="text-center">\
            <span class="fa-stack fa-5x" style="color: #dfdfdf">\
              <i class="fa fa-cloud fa-stack-2x"></i>\
              <i class="fa fa-bar-chart-o fa-stack-1x fa-inverse"></i>\
            </span>\
            <div id="acct_no_data" class="hidden">\
              <br>\
              <p style="font-size: 18px; color: #999">'+
              tr("There are no accounting records")+
              '</p>\
            </div>\
          </div>\
        </div>\
      </div>\
    </div>\
    <div id="acct_content" class="hidden">\
      <div class="row">\
        <div class="large-12 columns graph_legend">\
          <h3 class="subheader"><small>'+tr("CPU hours")+'</small></h3>\
        </div>\
        <div class="large-12 columns">\
          <div class="large-12 columns centered graph" id="acct_cpu_graph" style="height: 200px;">\
          </div>\
        </div>\
      </div>\
      <div class="row">\
        <div class="large-12 columns graph_legend">\
          <h3 class="subheader"><small>'+tr("Memory GB hours")+'</small></h3>\
        </div>\
        <div class="large-12 columns">\
          <div class="large-12 columns centered graph" id="acct_mem_graph" style="height: 200px;">\
          </div>\
        </div>\
      </div>\
      <div class="row">\
        <div class="large-12 columns graph_legend">\
          <h3 class="subheader"><small>'+tr("CPU hours")+'</small></h3>\
        </div>\
        <div class="large-12 columns" style="overflow:auto">\
          <table id="acct_cpu_datatable" class="datatable twelve">\
            <thead>\
              <tr>\
                <th>'+tr("Date")+'</th>\
              </tr>\
            </thead>\
            <tbody id="tbody_acct_cpu_datatable">\
            </tbody>\
          </table>\
        </div>\
      </div>\
      <div class="row">\
        <div class="large-12 columns graph_legend">\
          <h3 class="subheader"><small>'+tr("Memory GB hours")+'</small></h3>\
        </div>\
        <div class="large-12 columns" style="overflow:auto">\
          <table id="acct_mem_datatable" class="datatable twelve">\
            <thead>\
              <tr>\
                <th>'+tr("Date")+'</th>\
              </tr>\
            </thead>\
            <tbody id="tbody_acct_mem_datatable">\
            </tbody>\
          </table>\
        </div>\
      </div>\
    </div>');

    if (opt == undefined){
        opt = {};
    }

    //--------------------------------------------------------------------------
    // Init start time to 1st of last month
    //--------------------------------------------------------------------------
    var d = new Date();

    d.setDate(1);
    d.setMonth(d.getMonth() - 1);

    $("#acct_start_time", div).val(d.getFullYear() + '/' + (d.getMonth()+1) + '/' + d.getDate());

    //--------------------------------------------------------------------------
    // VM owner: all, group, user
    //--------------------------------------------------------------------------

    if (opt.fixed_user != undefined || opt.fixed_group != undefined){
      $("#acct_owner", div).hide();
/*
        $("input[name='acct_owner']", div).attr("disabled", "disabled");

        $("#acct_owner_select", div).show();

        if(opt.fixed_user != undefined){
            var text = tr("User") +" " + opt.fixed_user;
            $("input[value='acct_owner_user']", div).attr("checked", "checked");
        } else {
            var text = tr("Group") + " " + opt.fixed_group;
            $("input[value='acct_owner_group']", div).attr("checked", "checked");
        }

        $("#acct_owner_select", div).text(text);
*/
    } else {
        $("input[name='acct_owner']", div).change(function(){
            var value = $(this).val();

            switch (value){
            case "acct_owner_all":
                $("#acct_owner_select", div).hide();
                break;

            case "acct_owner_group":
                $("#acct_owner_select", div).show();
                insertSelectOptions("#acct_owner_select", div, "Group");
                break;

            case "acct_owner_user":
                $("#acct_owner_select", div).show();
                insertSelectOptions("#acct_owner_select", div, "User", -1, false,
                    '<option value="-1">'+tr("<< me >>")+'</option>');
                break;
            }
        });
    }

    //--------------------------------------------------------------------------
    // Init group by select
    //--------------------------------------------------------------------------

    if(opt.init_group_by != undefined){
        $("#acct_group_by", div).val(opt.init_group_by);
    }else if(opt.fixed_group_by != undefined){
        $("#acct_group_by", div).val(opt.fixed_group_by);
        $("#acct_group_by_container", div).hide();
    }

    //--------------------------------------------------------------------------
    // Submit request
    //--------------------------------------------------------------------------

    $("#acct_submit", div).on("click", function(){
        var start_time = -1;
        var end_time = -1;

        var v = $("#acct_start_time", div).val();
        if (v == ""){
            notifyError(tr("Time range start is mandatory"));
            return false;
        }else{
            start_time = Date.parse(v+' UTC');

            if (isNaN(start_time)){
                notifyError(tr("Time range start is not a valid date. It must be YYYY/MM/DD"));
                return false;
            }

            // ms to s
            start_time = start_time / 1000;
        }

        var v = $("#acct_end_time", div).val();
        if (v != ""){

            end_time = Date.parse(v+' UTC');

            if (isNaN(end_time)){
                notifyError(tr("Time range end is not a valid date. It must be YYYY/MM/DD"));
                return false;
            }

            // ms to s
            end_time = end_time / 1000;
        }

        var options = {
            "start_time": start_time,
            "end_time": end_time
        };

        if (opt.fixed_user != undefined){
            options.userfilter = opt.fixed_user;
        } else if (opt.fixed_group != undefined){
            options.group = opt.fixed_group;
        } else {
            var select_val = $("#acct_owner_select .resource_list_select", div).val();

            switch ($("input[name='acct_owner']:checked", div).val()){
            case "acct_owner_all":
                break;

            case "acct_owner_group":
                if(select_val != ""){
                    options.group = select_val;
                }
                break;

            case "acct_owner_user":
                if(select_val != ""){
                    options.userfilter = select_val;
                }
                break;
            }
        }

        OpenNebula.VM.accounting({
    //        timeout: true,
            success: function(req, response){
                fillAccounting(div, req, response);
            },
            error: onError,
            data: options
        });

        return false;
    });
}

function fillAccounting(div, req, response) {
    var options = req.request.data[0];

    //--------------------------------------------------------------------------
    // Time slots
    //--------------------------------------------------------------------------

    // start_time is mandatory
    var start = new Date(options.start_time * 1000);

    var end = new Date();

    if(options.end_time != undefined && options.end_time != -1){
        var end = new Date(options.end_time * 1000)
    }

    // granularity of 1 day
    var times = [];

    var tmp_time = start;

    // End time is the start of the last time slot. We use <=, to
    // add one extra time step
    while (tmp_time <= end) {
        times.push(tmp_time.getTime());

        // day += 1
        tmp_time.setUTCDate( tmp_time.getUTCDate() + 1 );
    }

    //--------------------------------------------------------------------------
    // Flot options
    //--------------------------------------------------------------------------

    var options = {
        colors: ["#0098C3","#0A00C2","#AB00C2","#C20037","#C26B00","#78C200","#00C22A","#00B8C2"],

        xaxis : {
            mode: "time",
            timeformat: "%y/%m/%d",
            color: "#999",
            size: 8,
            ticks: 4,
            minTickSize: [1, "day"]
        },
        yaxis : { labelWidth: 50,
                  min: 0,
                color: "#999",
                size: 8
                },
        series: {
            bars: {
                show: true,
                lineWidth: 1,
                fill: true,
                barWidth: 24*60*60*1000 * 0.8,
                align: "center"
            },
            stack: true
        },
        legend : {
            show : false
        },
        grid: {
            borderWidth: 1,
            borderColor: "#cfcfcf",
            hoverable: true
        },
        tooltip: true,
        tooltipOpts: {
            content: "%x | %s | %y"
        }
    };

    //--------------------------------------------------------------------------
    // Group by
    //--------------------------------------------------------------------------

    // TODO: Allow to change group by dynamically, instead of calling oned again

    switch ($("#acct_group_by", div).val()){
    case "user":
        var group_by_fn = function(history){
            return history.VM.UID;
        }

        var group_by_name = function(history){
            return history.VM.UNAME;
        }

        var group_by_prefix = tr("User");

        break;

    case "group":
        var group_by_fn = function(history){
            return history.VM.GID;
        }

        var group_by_name = function(history){
            return history.VM.GNAME;
        }

        var group_by_prefix = tr("Group");

        break;

    case "vm":
        var group_by_fn = function(history){
            return history.OID;
        }

        var group_by_name = function(history){
            return history.VM.NAME;
        }

        var group_by_prefix = tr("VM");

        break;
    }

    //--------------------------------------------------------------------------
    // Filter history entries
    //--------------------------------------------------------------------------

    // TODO filter
    // True to proccess, false to discard
    var filter_by_fn = function(history){
//        return history.OID == 3605 || history.OID == 2673;
        return true;
    }

    //--------------------------------------------------------------------------
    // Process data series for flot
    //--------------------------------------------------------------------------

    var series = {};

    $("#acct_no_data", div).hide();

    if(response.HISTORY_RECORDS == undefined){
        $("#acct_placeholder", div).show();
        $("#acct_content", div).hide();

        $("#acct_no_data", div).show();
        return false;
    }

    $.each(response.HISTORY_RECORDS.HISTORY, function(index, history){

/*
        if(!filter_by_fn(history)){
            return true; //continue
        }
*/
        var group_by = group_by_fn(history);

        if (series[group_by] == undefined){
            series[group_by] = {};
            series[group_by].data_points = {};

            series[group_by].data_points[times[0]] = {};
            series[group_by].data_points[times[times.length-2]] = {};

            series[group_by].data_points[times[0]].CPU_HOURS = 0;
            series[group_by].data_points[times[times.length-2]].CPU_HOURS = 0;

            series[group_by].data_points[times[0]].MEM_HOURS = 0;
            series[group_by].data_points[times[times.length-2]].MEM_HOURS = 0;

            var name = group_by_name(history);
            series[group_by].name = name;
            series[group_by].label = group_by_prefix+" "+group_by+" "+name;
        }

        var serie = series[group_by].data_points;

        for (var i = 0; i<times.length-1; i++){

            var t = times[i];
            var t_next = times[i+1];

            if( (history.ETIME*1000 > t || history.ETIME == 0) &&
                (history.STIME != 0 && history.STIME*1000 <= t_next) ) {

                var stime = t;
                if(history.STIME != 0){
                    stime = Math.max(t, history.STIME*1000);
                }

                var etime = t_next;
                if(history.ETIME != 0){
                    etime = Math.min(t_next, history.ETIME*1000);
                }

                var n_hours = (etime - stime) / 1000 / 60 / 60;

                if(serie[t] == undefined){
                    serie[t] = {};
                    serie[t].CPU_HOURS = 0;
                    serie[t].MEM_HOURS = 0;
                }

                // --- cpu ---

                var val = parseFloat(history.VM.TEMPLATE.CPU) * n_hours;

                if (!isNaN(val)){
                    serie[t].CPU_HOURS += val;
                }

                // --- mem ---

                var val = parseInt(history.VM.TEMPLATE.MEMORY)/1024 * n_hours;

                if (!isNaN(val)){
                    serie[t].MEM_HOURS += val;
                }
            }
        }
    });

    //--------------------------------------------------------------------------
    // Create series, draw plots
    //--------------------------------------------------------------------------

    var cpu_plot_series = [];
    var mem_plot_series = [];

    $.each(series, function(key, val){
        var cpu_data = [];
        var mem_data = [];

        $.each(val.data_points, function(time,num){
            cpu_data.push([parseInt(time),num.CPU_HOURS]);
            mem_data.push([parseInt(time),num.MEM_HOURS]);
        });

        cpu_plot_series.push(
        {
            label: val.label,
            name: val.name,
            id: key,
            data: cpu_data
        });

        mem_plot_series.push(
        {
            label: val.label,
            name: val.name,
            id: key,
            data: mem_data
        });
    });

    var cpu_plot = $.plot($("#acct_cpu_graph", div), cpu_plot_series, options);
    var mem_plot = $.plot($("#acct_mem_graph", div), mem_plot_series, options);

    //--------------------------------------------------------------------------
    // Init dataTables
    //--------------------------------------------------------------------------

    $("#acct_cpu_datatable",div).dataTable().fnClearTable();
    $("#acct_cpu_datatable",div).dataTable().fnDestroy();

    $("#acct_cpu_datatable thead",div).remove();
    $("#acct_cpu_datatable",div).width("100%");


    $("#acct_mem_datatable",div).dataTable().fnClearTable();
    $("#acct_mem_datatable",div).dataTable().fnDestroy();

    $("#acct_mem_datatable thead",div).remove();
    $("#acct_mem_datatable",div).width("100%");


    cpu_plot_data = cpu_plot.getData();
    mem_plot_data = mem_plot.getData();

    var thead =
    '<thead>\
      <tr>\
        <th>'+tr("Date UTC")+'</th>\
        <th>'+tr("Total")+'</th>';

    $.each(cpu_plot_data, function(i, serie){
        thead += '<th style="border-bottom: '+serie.color+' 4px solid !important;'+
            ' border-left: 10px solid white; border-right: 5px solid white;'+
            ' white-space: nowrap">'+
            group_by_prefix+' '+serie.id+'<br/>'+serie.name+'</th>';
    });

    thead += '</tr></thead>';

    $("#acct_cpu_datatable",div).append(thead);

    thead =
    '<thead>\
      <tr>\
        <th>'+tr("Date UTC")+'</th>\
        <th>'+tr("Total")+'</th>';

    $.each(mem_plot_data, function(i, serie){
        thead += '<th style="border-bottom: '+serie.color+' 4px solid !important;'+
            ' border-left: 10px solid white; border-right: 5px solid white;'+
            ' white-space: nowrap">'+
            group_by_prefix+' '+serie.id+'<br/>'+serie.name+'</th>';
    });

    thead += '</tr></thead>';

    $("#acct_mem_datatable",div).append(thead);


    var cpu_dataTable_data = [];
    var mem_dataTable_data = [];

    for (var i = 0; i<times.length-1; i++){
        var t = times[i];

        var cpu_row = [];
        var mem_row = [];

        var time_st = time_UTC(t);

        cpu_row.push(time_st);
        mem_row.push(time_st);

        cpu_row.push(0);
        mem_row.push(0);

        var cpu_total = 0;
        var mem_total = 0;

        $.each(series, function(key, val){
            var v = val.data_points[t];

            if(v != undefined){
                var cpu_v = (v.CPU_HOURS * 100).toFixed() / 100;
                var mem_v = (v.MEM_HOURS * 100).toFixed() / 100;

                cpu_total += cpu_v;
                mem_total += mem_v;

                cpu_row.push(cpu_v);
                mem_row.push(mem_v);
            } else {
                cpu_row.push(0);
                mem_row.push(0);
            }
        });

        cpu_row[1] = cpu_total;
        mem_row[1] = mem_total;

        cpu_dataTable_data.push(cpu_row);
        mem_dataTable_data.push(mem_row);
    }

    var acct_cpu_dataTable = $("#acct_cpu_datatable",div).dataTable({
        "bSortClasses" : false,
        "bDeferRender": true,
        "aoColumnDefs": [
            { "bSortable": false, "aTargets": ['_all'] },
        ]
    });

    var acct_mem_dataTable = $("#acct_mem_datatable",div).dataTable({
        "bSortClasses" : false,
        "bDeferRender": true,
        "aoColumnDefs": [
            { "bSortable": false, "aTargets": ['_all'] },
        ]
    });

    acct_cpu_dataTable.fnAddData(cpu_dataTable_data);
    acct_mem_dataTable.fnAddData(mem_dataTable_data);

    $("#acct_placeholder", div).hide();
    $("#acct_content", div).show();
}
