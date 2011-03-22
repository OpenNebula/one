/* -------------------------------------------------------------------------- */
/* Copyright 2002-2011, OpenNebula Project Leads (OpenNebula.org)             */
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


//TODOs: handle confirm and confirm with select dialogs

var cookie = {};
var username = '';
var uid = '';
var spinner = '<img src="/images/ajax-loader.gif" alt="retrieving" class="loading_img"/>';

var SunstoneCfg = {
    "actions" : {
            
    
     },
        
     "tabs" : { 
           
     },
        
     "info_panels" : {
        
     }
};


var Sunstone = {
    
    
    "addAction" : function (name,action_obj) {
        SunstoneCfg["actions"][name] = action_obj;
    },
    
    "updateAction" : function(name,action_obj) {
         SunstoneCfg["actions"][name] = action_obj;
    },
    
    "removeAction" : function(action) {
         SunstoneCfg["actions"][action] = null;
    },
    
    "addActions" : function(actions) {
        for (action in actions){
            Sunstone.addAction(action,actions[action]);
        }  
    },
    
    "addMainTab" : function(tab_id,title_arg,content_arg, buttons_arg,refresh,condition_f) {
        SunstoneCfg["tabs"][tab_id] = {title: title_arg,
                                        content: content_arg,
                                        buttons: buttons_arg,
                                        condition: condition_f 
                                        };
        if (refresh){
            
        }
    },
    
    "updateMainTabContent" : function(tab_id,content_arg,refresh){
        SunstoneCfg["tabs"][tab_id]["content"]=content_arg;
        if (refresh){
            $('div#'+tab).html(tab_info.content);
        }
    },
    
    "updateMainTabButtons" : function(tab_id,buttons_arg,refresh){
        SunstoneCfg["tabs"][tab_id]["buttons"]=buttons_arg;
        if (refresh){
            $('div#'+tab_name+' .action_blocks').empty();
            insertButtonsInTab(tab_name);
        }
    },
    
    "removeMainTab" : function(tab_id,refresh) {
         SunstoneCfg["tabs"][tab_id]=null;
         if (refresh) {
             $('div#'+tab_name).remove();
         }
    },
    
    "getInfoPanelHTML" : function(name,selected_tab){
        var info_panel = $('<div id="'+name+'"><ul></ul></div>');
        var tabs = SunstoneCfg["info_panels"][name];
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
    
    "addInfoPanel" : function(name, info_panel){
        SunstoneCfg["info_panels"][name]=info_panel;
    },
    
    "updateInfoPanel" : function(name, info_panel){
        SunstoneCfg["info_panels"][name]=info_panel;
    },
    
    "removeInfoPanel" : function(name){
        SunstoneCfg["info_panels"][name] = null;
    },
    
    "popUpInfoPanel" : function(name, selected_tab){
        popDialog(Sunstone.getInfoPanelHTML(name, selected_tab));
    },
    
    "addInfoPanelTab" : function(info_panel, tab_name, tab){
        SunstoneCfg["info_panels"][info_panel][tab_name] = tab;
    },
    
    "updateInfoPanelTab" : function(info_panel, tab_name, tab, refresh){
        SunstoneCfg["info_panels"][info_panel][tab_name] = tab;
        if (refresh){
            refreshInfoPanelTab(info_panel,tab_name);
        }
    },
    
    
    "removeInfoPanelTab" : function(info_panel,tab_name){
        SunstoneCfg["info_panels"][info_panel][tab_name] = null;
    },
    
    "runAction" : function(action, data_arg, extra_param){
    
        var actions = SunstoneCfg["actions"];
        if (!actions[action]){
            notifyError("Action "+action+" not defined");
            return;
        }
        
        var action_cfg = actions[action];
        var notify = action_cfg.notify;
        
        var condition = action_cfg["condition"];
        if (condition && !condition() && notify){
            //we do not meet the condition to run this action
            notifyError("This action cannot be run");
            return;
        }
        
        var call = action_cfg["call"];
        var callback = action_cfg["callback"];
        var err = action_cfg["error"];
       
        
        
        $('div#confirm_with_select_dialog').dialog("close");
        $('div#confirm_dialog').dialog("close");
        
        
        //We ease the use of:
        // * Create call
        // * Confirm and confirm with select calls
        // * Calls on multiple elements
        // * Other calls
        switch (action_cfg.type){
            
            case "create":
                call({data:data_arg, success: callback, error:err});
                break;
            case "single":
                call({data:{id:data_arg}, success: callback,error:err});
                break;
            case "list":
                call({success: callback, error:err});
                break;
            case "multiple":
                //run on the list of nodes that come on the data
                $.each(data_arg,function(){
                    if (extra_param){
                        call({data:{id:this,extra_param:extra_param}, success: callback, error: err});
                    } else {
                        call({data:{id:this}, success: callback, error:err});
                    }
                });
                break;
            default: 
                //we have supposedly altered an action and we want it to do
                //something completely different
                if (data_arg && extra_param) {call(data_arg,extra_param);}
                else if (data_arg) {call(data_arg);}
                else {call();}
        }
        
    },
    
    "runActionOnDatatableNodes": function(action,dataTable,extra_param){
        if (dataTable != null){
            
            //Which rows of the datatable are checked?
            var nodes = $('input:checked',dataTable.fnGetNodes());
            var data = [];
            $.each(nodes,function(){
                data.push($(this).val());
            });
            Sunstone.runAction(action,data,extra_param);
            
        } else {
            Sunstone.runAction(action,extra_param);
        };
    },
    "getButton" : function(tab_name,button_name){
            var button = null;
            var buttons = SunstoneCfg["tabs"][tab_name]["buttons"];
            button = buttons[button_name];
            if (!button && buttons["action_list"]) //not found, is it in the list then?
            {
                button = buttons["action_list"]["actions"][button_name];
            }
            return button;            
    } //end sunstone methods
    
};
        
    



//plugins have done their jobs when we execute this
$(document).ready(function(){
    readCookie();
    setLogin();
    insertTabs();
    insertButtons();
    
    initListButtons();
    setupCreateDialogs(); //listener for create
    setupConfirmDialogs();
    
    $('.action_button').live("click",function(){
        
        var table = null;
        var value = $(this).attr("value");
        var action = SunstoneCfg["actions"][value];
        if (!action) { notifyError("Action "+value+" not defined."); return false;};
        switch (action.type){
            case "multiple": //find the datatable
                table = action.dataTable();
                Sunstone.runActionOnDatatableNodes(value,table);
                break;
            default:
                Sunstone.runAction(value);
        }
        return false;
    });
    
    $('.confirm_button').live("click",function(){
        popUpConfirmDialog(this);
        return false;
    });
    
    $('.confirm_with_select_button').live("click",function(){
        popUpConfirmWithSelectDialog(this);
        return false;
    });
    
    
    $('button').button();
	$('div#select_helpers').hide();

    
    	$(".ui-widget-overlay").live("click", function (){
		$("div:ui-dialog:visible").dialog("close");
    });



    //Close select lists...
    $('*:not(.action_list,.list_button)').click(function(){
       $('.action_list:visible').hide();
    });
    
    showTab('#dashboard_tab');
    
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

//sets the user info in the top bar and creates a listner in the signout button
function setLogin(){
    username = cookie["one-user"];
    uid = cookie["one-user_id"];

    $("#user").html(username);
    $("#logout").click(function(){
        OpenNebula.Auth.logout({success:function(){
                                    window.location.href = "/login";
                                    }
                                });
        return false;
    });
}


function insertTabs(){
    var tab_info;
    for (tab in SunstoneCfg["tabs"]){
        tab_info = SunstoneCfg["tabs"][tab];
        
        //skip this tab if we do not meet the condition
        if (tab_info.condition && !tab_info.condition()) {continue;}
        $("div.inner-center").append('<div id="'+tab+'" class="tab"></div>');
        $('div#'+tab).html(tab_info.content);
        
        $('ul#navigation').append('<li><a href="#'+tab+'">'+tab_info.title+'</a></li>');
        
    }
}


function insertButtons(){
     for (tab in SunstoneCfg["tabs"]){
        insertButtonsInTab(tab)
    }
}

function insertButtonsInTab(tab_name){
    var buttons = SunstoneCfg["tabs"][tab_name]["buttons"];
    var button_code="";
    var sel_obj=null;
    
    if ($('div#'+tab_name+' .action_blocks').length){
        for (button_name in buttons){
            button_code = "";
            button = buttons[button_name];
            if (button.condition()) {
                switch (button.type) {
                  case "select":
                    button_code = '<select class="multi_action_slct">';
                 
                    for (sel_name in button.actions){
                        sel_obj = button["actions"][sel_name];
                        if (sel_obj.condition()){
                                button_code += '<option class="'+sel_obj.type+'_button" value="'+sel_name+'">'+sel_obj.text+'</option>';
                        };
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
            }
            $('div#'+tab_name+' .action_blocks').append(button_code);
                
        }//for each button in tab
    }//if tab exists
}

// We do not insert info panels code, we generate it dynamicly when
// we need it with getInfoPanelHTML()
//~ function insertInfoPanels(){
    //~ var panels = SunstoneCfg["info_panels"];
    //~ tabs = null;
    //~ //For each defined dialog
    //~ for (panel in panels) {
        //~ addInfoPanel(panel);
    //~ }
//~ }
//~ 
//~ function addInfoPanel(name){
    //~ var tabs = SunstoneCfg["info_panels"][name];
    //~ $('#info_panels').append('<div id="'+name+'"></div>');
    //~ for (tab in tabs){
        //~ addInfoPanelTab(name,tab);
    //~ }
    //~ //at this point jquery tabs structure is ready, so we enable it
    //~ $('div#'+name).tabs();
//~ }
//~ 
//~ function refreshInfoPanel(name){
    //~ $('#info_panels div#'+name).tabs("destroy");
    //~ $('#info_panels div#'+name).remove();
    //~ $('#info_panels').append('<div id="'+name+'"></div>');
    //~ var tabs = SunstoneCfg["info_panels"][name];
     //~ for (tab in tabs){
        //~ addInfoPanelTab(name,tab);
    //~ }
     //~ //at this point jquery tabs structure is ready, so we enable it
    //~ $('div#'+name).tabs();
//~ }
//~ 
//~ function addInfoPanelTab(panel_name,tab_name){
    //~ var tab = SunstoneCfg["info_panels"][panel_name][tab_name];
    //~ if ( !$('div#'+panel_name+' ul').length ) {
        //~ $('div#'+panel_name).prepend('<ul></ul>');
    //~ }
    //~ $('div#'+panel_name+' ul').append('<li><a href="#'+tab_name+'">'+tab.title+'</a></li>');
    //~ $('div#'+panel_name).append('<div id="'+tab_name+'">'+tab.content+'</div>');
//~ }
//~ 


//Tries to refresh a tab content if it is somewhere in the DOM
function refreshInfoPanelTab(panel_name,tab_name){
    var tab = SunstoneCfg["info_panels"][panel_name][tab_name];
    $('div#'+panel_name+' div#'+tab_name).html(tab.content);
}

//Converts selects into buttons which show a of actions when clicked
function initListButtons(){

        //for each multi_action select
        $('.multi_action_slct').each(function(){
             //prepare replacement buttons
            buttonset = $('<div style="display:inline-block;" class="top_button"></div');
            button1 = $('<button class="last_action_button action_button confirm_button confirm_with_select_button" value="">Previous action</button>').button();
            button1.attr("disabled","disabled");
            button2 = $('<button class="list_button" value="">See more</button>').button({
                text:false,
                icons: { primary: "ui-icon-triangle-1-s" }
                });
            buttonset.append(button1);
            buttonset.append(button2);
            buttonset.buttonset();

            //prepare list
            options = $('option', $(this));
             list = $('<ul class="action_list"></ul>');
            $.each(options,function(){
                classes = $(this).attr("class");
                item = $('<li></li>');
                a = $('<a href="#" class="'+classes+'" value="'+$(this).val()+'">'+$(this).text()+'</a>');
                a.val($(this).val());
                item.html(a);
                list.append(item);
            });
            list.css({
                "display":"none"
            });


            //replace the select and insert the buttons
            $(this).before(buttonset);
            $(this).parents('.action_blocks').append(list);
            $(this).remove();
            //$(this).replaceWith(list);

        });


        //listen for events on this buttons and list

        //enable run the last action button
        $('.action_list li a').click(function(){
                //enable run last action button
                prev_action_button = $('.last_action_button',$(this).parents('.action_blocks'));
                prev_action_button.val($(this).val());
                prev_action_button.removeClass("confirm_with_select_button");
                prev_action_button.removeClass("confirm_button");
                prev_action_button.removeClass("action_button");
                prev_action_button.addClass($(this).attr("class"));
                prev_action_button.button("option","label",$(this).text());
                prev_action_button.button("enable");
                $(this).parents('ul').hide("blind",100);
                //return false;
        });


        //Show the list of actions in place
        $('.list_button').click(function(){
            $('.action_list',$(this).parents('.action_blocks')).css({
                "left": $(this).prev().position().left,
                "top": $(this).prev().position().top+13,
                "width": $(this).parent().outerWidth()-11
            });
            $('.action_list',$(this).parents('.action_blocks')).toggle("blind",100);
            return false;
        });
}

//Sets up all the "+ New Thing" dialogs.
function setupCreateDialogs(){
//	createHostDialog();
//	createClusterDialog();
//	createVMachineDialog();
//	createVNetworkDialog();
//	createUserDialog();
//    createImageDialog();
    
    //Todo listener on "create" class to trigger the right dialog.
}

//Adds the dialogs bodies
function setupConfirmDialogs(){
    
    //confirm
    if (!($('div#confirm_dialog').length)){
        $('div#dialogs').append('<div id="confirm_dialog" title="Confirmation of action"></div>');
    };

	$('div#confirm_dialog').html(
			'<form action="javascript:alert(\'js error!\');">\
			<div id="confirm_tip">Do you want to proceed?</div>\
			<br />\
			<div id="question">Do you want to proceed?</div>\
			<br />\
			<div class="form_buttons">\
			  <button id="confirm_proceed" class="action_button" value="">OK</button>\
			  <button class="confirm_cancel" value="">Cancel</button>\
			</div>\
			</form>');
            
    //prepare the jquery dialog
	$('div#confirm_dialog').dialog({
			resizable:false,
			modal:true,
			width:300,
			heigth:200,
			autoOpen:false
		});

    $('div#confirm_dialog button').button();
    
    if (!($('div#confirm_with_select_dialog').length)){
        $('div#dialogs').append('<div id="confirm_with_select_dialog" title="Confirmation of action"></div>');
    };

	$('div#confirm_with_select_dialog').html(
			'<form action="javascript:alert(\'js error!\');">\
			<div id="confirm_with_select_tip"></div>\
			<select style="margin: 10px 0;" id="confirm_select">\
			</select>\
			<div class="form_buttons">\
			  <button id="confirm_with_select_proceed" class="" value="">OK</button>\
			  <button class="confirm_cancel" value="">Cancel</button>\
			</div>\
			</form>');
            
    	//prepare the jquery dialog
	$('div#confirm_with_select_dialog').dialog({
			resizable:false,
			modal:true,
			width:300,
			heigth:300,
			autoOpen:false
		});
        
    $('div#confirm_with_select_dialog button').button();
    
    $('button.confirm_cancel').click(function(){
		$('div#confirm_with_select_dialog').dialog("close");
        $('div#confirm_dialog').dialog("close");
		return false;
	});
    
    $('button#confirm_with_select_proceed').click(function(){
        var value = $(this).val();
        var action = SunstoneCfg["actions"][value];
        var param = $('select#confirm_select').val();
        if (!action) { notifyError("Action "+value+" not defined."); return false;};
        switch (action.type){
            case "multiple": //find the datatable
                table = SunstoneCfg["actions"][value].dataTable();
                Sunstone.runActionOnDatatableNodes(value,table,param);
                break;
            default:
                Sunstone.runAction(action,param);
                break;
        }
        return false;
        
    });
    
}

function popUpConfirmDialog(target_elem){
    var value = $(target_elem).val();
    var tab_id = $(target_elem).parents('.tab').attr('id');
    var button = Sunstone.getButton(tab_id,value);
    var tip = button.tip;
    $('button#confirm_proceed').val(value);
    $('div#confirm_tip').text(tip);
    $('div#confirm_dialog').dialog("open");
}

function popUpConfirmWithSelectDialog(target_elem){
    var value = $(target_elem).val();
    var tab_id = $(target_elem).parents('.tab').attr('id');
    var button = Sunstone.getButton(tab_id,value);
    var tip = button.tip;
    var select_var = button.select();
    $('select#confirm_select').html(select_var);
    $('div#confirm_with_select_tip').text(tip);
    
    $('button#confirm_with_select_proceed').val(value);
    $('div#confirm_with_select_dialog').dialog("open");
   
   
}


