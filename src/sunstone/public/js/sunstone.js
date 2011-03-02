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


var Sunstone = {
    
    
    "addAction" : function (name,action_obj) {
        SunstoneCfg.config.actions[name] = action_obj;
    },
    
    "updateAction" : function(action,new_action) {
        
    },
    
    "removeAction" : function(action) {
        
    },
    
    "addMainTab" : function(tab_id,title_arg,content_arg) {
        SunstoneCfg["tabs"][tab_id] = {title: title_arg,
                                        content: content_arg};
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
        
        
        //We ease the use of:
        // * Create call
        // * Confirm and confirm with select calls
        // * Calls on multiple elements
        // * Other calls
        switch (actions[action].type){
            
            case "create","single":
                call({data:data_arg, success: callback,error:err});
                break;
            case "confirm":
                tip = actions.tip;
                //popup confirm dialog (action,tip).
                break;
            case "confirm_with_select":
                tip = OpenNebula.Views.Actions[action].tip;
                select = OpenNebula.Views.Actions[action].select;
                //popup confirm dialog with select(action,tip,select)
                break;
            case "list":
                call({success: callback, error:err});
                break;
            case "multiple":
                //run on the list of nodes that come on the data
                $.each(data_arg,function(){
                    if (extra_param){
                        call(this,callback,error)
                    } else {
                        call(this,extra_param,callback,error)
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
            }
            runAction(action,data);
            
        } else {
            notifyError("Unknown datatable");
        };
    }//meter coma y seguir aquí
    
}

var SunstoneCfg = {
    "config" = {
        
         "actions" : {
            
            "VM.create" = {
                
            },
            
            "VM.deploy" = {
                
            },
            
            "VM.migrate" = {
                
            },
            
            "VM.livemigrate" = {
                
            },
            
            "VM.hold" = {
                
            },
            
            "VM.release" = {
                
            },
            
            "VM.suspend" = {
                
            },
            
            "VM.resume" = {
                
            },
            
            "VM.stop" = {
                
            },
            
            "VM.restart" = {
                
            },
            
            "VM.shutdown" = {
                
            },
            
            "VM.cancel" = {
                
            },
            
            "VM.delete" = {
                
            },
            
            "Network.publish" = {
                
            },
            
            "Network.unpublish" = {
                
            },
            
            "Network.delete" = {
                
            },
            
            "User.create" = {
                
            },
            
            "User.delete" = {
                
            },
            
            "Image.enable" = {
                
            },
            
            "Image.disable" = {
                
            },
            
            "Image.persistent" = {
                
            },
            
            "Image.nonpersistent" = {
                
            },
            
            "Image.publish" = {
                
            },
            
            "Image.unpublish" = {
                
            },
            
            "Image.delete" = {
                
            }
        },
        
        "tabs" = { 
            
        },
        
        "info_panels" = {
            
        }
        
    }
    
}

//plugins have done their jobs when we execute this
$(document).ready(){
    readCookie();
    setLogin();
    insertTabs();
    insertButtons();
    
    
    initListButtons();
    setupCreateDialogs(); //listener for create
    setupTips();
    
    //action button listener! -> plugins deal with that
    
    
    $('button').button();
	$('div#select_helpers').hide();
	emptyDashboard();
    
    	$(".ui-widget-overlay").live("click", function (){
		$("div:ui-dialog:visible").dialog("close");
    });

    //Dashboard link listener
    $("#dashboard_table h3 a").live("click", function (){
        var tab = $(this).attr('href');
        showTab(tab);
        return false;
    });

    //Close select lists...
    $('*:not(.action_list,.list_button)').click(function(){
       $('.action_list:visible').hide();
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
        tab_info = SunstoneCfg["tabs"].tab;
        $("div.inner_center").append('<div id="'+tab_info.tab_id+'" class="tab"></div>');
        $('div#'+tab_info.tab_id).html(tab_info.content);
        
        $('ul#navigation').append('<li><a href="'+tab_info.tab_id+'">'+tab+'</a></li>');
        
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
                if (!this.condition()) { return true };
                
                switch (this.type) {
                    case "action":
                        button_code = '<button class="action_button top_button" value="'+this.action+'">'+this.text+'</button>';
                        break;
                    case "create":
                        button_code = '<button class="create top_button" value="'+this.action+'">'+this.text+'</button>';
                        break;
                    case "select":
                        button_code = '<select class="multi_action_slct">';
                        $.each(this.action,function(){
                            if (this.condition()){
                                button_code += '<option value="'+this.value+'">'+this.text+'</option>';
                            };
                        });
                        button_code = '</select>';
                        break;
                    
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
	createHostDialog();
	createClusterDialog();
	createVMachineDialog();
	createVNetworkDialog();
	createUserDialog();
    createImageDialog();
    
    //Todo listener on "create" class to trigger the right dialog.
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
