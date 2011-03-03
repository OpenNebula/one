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
        SunstoneCfg["actions"].name = action_obj;
    },
    
    "updateAction" : function(action,new_action) {
        
    },
    
    "removeAction" : function(action) {
        
    },
    
    "addMainTab" : function(title_arg,content_arg, buttons_arg,tab_id) {
        SunstoneCfg["tabs"][tab_id] = {title: title_arg,
                                        content: content_arg,
                                        buttons: buttons_arg };
    },
    
    "updateMainTab" : function(tab_id,new_content){
        
    },
    
    "removeMainTab" : function(tab_id) {
        
    },
    
    "runAction" : function(action, data_arg, extra_param){
    
        var actions = Sunstone.actions;
        if (!actions[action]){
            notifyError("Action "+action+" not defined");
            return;
        }
        
        var action_cfg = actions[action];
        
        var call = action_cfg.run;
        var callback = action_cfg.callback;
        var err = action_cfg.callback;
        var notify = action_cfg.notify;
        
        $('div#confirm_with_select_dialog').dialog("close");
        $('div#confirm_dialog').dialog("close");
        
        
        //We ease the use of:
        // * Create call
        // * Confirm and confirm with select calls
        // * Calls on multiple elements
        // * Other calls
        switch (actions[action].type){
            
            case "create","single":
                call({data:data_arg, success: callback,error:err});
                break;
            case "list":
                call({success: callback, error:err});
                break;
            case "multiple":
                //run on the list of nodes that come on the data
                $.each(data_arg,function(){
                    if (extra_param){
                        //unsupported
                    } else {
                        call({data:this, success: callback, error:err});
                    }
                });
                break;
            default: 
                //we have supposedly altered an action and we want it to do
                //something completely different
                call(data,extra_param);
        }
        
    },
    
    "runActionOnDatatableNodes": function(action,datatable){
        if (dataTable != null){
            
            //Which rows of the datatable are checked?
            var nodes = $('input:checked',dataTable.fnGetNodes());
            var data = [];
            $.each(nodes,function(){
                data.push($(this).val());
            });
            runAction(action,data);
            
        } else {
            runAction(action);
        };
    }//meter coma y seguir aquí
    
};
        
        
         //~ "actions" : {
            //~ 
            //~ "VM.create" = {
                //~ 
            //~ },
            //~ 
            //~ "VM.deploy" = {
                //~ 
            //~ },
            //~ 
            //~ "VM.migrate" = {
                //~ 
            //~ },
            //~ 
            //~ "VM.livemigrate" = {
                //~ 
            //~ },
            //~ 
            //~ "VM.hold" = {
                //~ 
            //~ },
            //~ 
            //~ "VM.release" = {
                //~ 
            //~ },
            //~ 
            //~ "VM.suspend" = {
                //~ 
            //~ },
            //~ 
            //~ "VM.resume" = {
                //~ 
            //~ },
            //~ 
            //~ "VM.stop" = {
                //~ 
            //~ },
            //~ 
            //~ "VM.restart" = {
                //~ 
            //~ },
            //~ 
            //~ "VM.shutdown" = {
                //~ 
            //~ },
            //~ 
            //~ "VM.cancel" = {
                //~ 
            //~ },
            //~ 
            //~ "VM.delete" = {
                //~ 
            //~ },
            //~ 
            //~ "Network.publish" = {
                //~ 
            //~ },
            //~ 
            //~ "Network.unpublish" = {
                //~ 
            //~ },
            //~ 
            //~ "Network.delete" = {
                //~ 
            //~ },
            //~ 
            //~ "User.create" = {
                //~ 
            //~ },
            //~ 
            //~ "User.delete" = {
                //~ 
            //~ },
            //~ 
            //~ "Image.enable" = {
                //~ 
            //~ },
            //~ 
            //~ "Image.disable" = {
                //~ 
            //~ },
            //~ 
            //~ "Image.persistent" = {
                //~ 
            //~ },
            //~ 
            //~ "Image.nonpersistent" = {
                //~ 
            //~ },
            //~ 
            //~ "Image.publish" = {
                //~ 
            //~ },
            //~ 
            //~ "Image.unpublish" = {
                //~ 
            //~ },
            //~ 
            //~ "Image.delete" = {
                //~ 
            //~ }


//plugins have done their jobs when we execute this
$(document).ready(function(){
    readCookie();
    setLogin();
    insertTabs();
    insertButtons();
    
    
    initListButtons();
    setupCreateDialogs(); //listener for create
    setupConfirmDialogs();
    setupTips();
    
    $('.action_button').live("click",function(){
        
        var table = null;
        if ($(this).parents('table').length){
            table = $(this).parents('table').dataTable();
        }
        //if no table found the action will be run as custom
        Sunstone.runActionOnDatatableNodes($(this).value,table);
    });
    
    $('.confirm_button').live("click",function(){
        popUpConfirmDialog(this);
    });
    
    $('.confirm_with_select_button').live("click",function(){
        popUpConfirmWithSelectDialog(this)
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
        $("div.inner-center").append('<div id="'+tab+'" class="tab"></div>');
        $('div#'+tab).html(tab_info.content);
        
        $('ul#navigation').append('<li><a href="#'+tab+'">'+tab_info.title+'</a></li>');
        
    }
}


function insertButtons(){
    var buttons;
    var tab_id;
    var button_code;
    
    for (tab in SunstoneCfg["tabs"]){
        buttons = SunstoneCfg["tabs"][tab].buttons;
        content = SunstoneCfg["tabs"][tab].content;
        if ($('div#'+tab+' .action_blocks').length){
            $.each(buttons,function(){
                button_code = "";
                if (this.condition()) {
                
                  switch (this.type) {
                      case "select":
                        button_code = '<select class="multi_action_slct">';
                        $.each(this.action,function(){
                            if (this.condition()){
                                    switch (this.type){
                                        case "create":
                                            button_code += '<option class="create" value="'+this.value+'">'+this.text+'</option>';
                                            break;
                                        case "action":
                                            button_code += '<option class="action_button" value="'+this.value+'">'+this.text+'</option>';
                                        case "confirm":
                                            button_code += '<option class="confirm_button" value="'+this.value+'">'+this.text+'</option>';
                                        case "confirm_with_select":
                                            button_code += '<option class="confirm_with_select_button" select_id="'+this.select+'" value="'+this.value+'">'+this.text+'</option>';
                                    }
                                
                            };
                        });
                        button_code += '</select>';
                        break;
                      case "confirm_with_select":
                        button_code = '<button class="confirm_with_select top_button" class="confirm_with_select_button" select_id="'+this.select+'" tip="'+this.tip+'" value="'+this.action+'">'+this.text+'</button>';
                        break;
                      case "action":
                      case "create":
                      case "confirm":
                      default:
                        button_code = '<button class="'+this.type+'_button top_button" value="'+this.action+'">'+this.text+'</button>';
                    
                  }
                }
                $('div#'+tab+' .action_blocks').append(button_code);
                
            });
        }
    }
    
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
			  <button id="proceed" class="action_button" value="">OK</button>\
			  <button id="cancel" value="">Cancel</button>\
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
			  <button id="action_button" value="">OK</button>\
			  <button id="confirm_with_select_cancel" value="">Cancel</button>\
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
    
}

function popUpConfirmDialog(target_elem){
    button = $(target_elem);
    value = button.val();
    action = SunstoneCfg["actions"][value];
    
}

function popUpConfirmWithSelectDialog(target_elem){
    var button = $(target_elem);
    var value = button.val();
    var action = SunstoneCfg["actions"][value];
    var select_var = eval(button.attr("select_id"));
    var tip = button.attr(tip);
    $('select#confirm_select').html(select_var);
    $('div#confirm_with_select_tip').text(tip);
    
    $('button#confirm_with_select_proceed').val(val);
    $('div#confirm_with_select_dialog').dialog("open");
   
   
}

//Replaces all class"tip" divs with an information icon that
//displays the tip information on mouseover.
function setupTips(){
		$('div.tip').each(function(){
				tip = $(this).html();
				$(this).html('<span class="ui-icon ui-icon-info info_icon"></span>');
                $(this).append('<span class="tipspan"></span>');

                $(this).append('<span class="ui-icon ui-icon-alert man_icon" />');


				$('span.tipspan',this).html(tip);
                $(this).parent().append('<div class="clear"></div>');
				$('span.tipspan',this).hide();
				$('span.info_icon',this).hover(function(e){
                    var top, left;
                    top = e.pageY - 15;// - $(this).parents('#create_vm_dialog').offset().top - 15;
                    left = e.pageX + 15;// - $(this).parents('#create_vm_dialog').offset().left;
                    $(this).next().css(
                        {"top":top+"px",
                        "left":left+"px"});
					$(this).next().fadeIn();
				},function(){
					$(this).next().fadeOut();
				});
		});
}
