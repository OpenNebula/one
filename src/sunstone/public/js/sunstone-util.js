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


/* Some useful functions for Sunstone default plugins */
var INTERVAL=60000;

function someTime(){
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
    var month = pad(d.getMonth(),2);
    var year = d.getFullYear();

    return hour + ":" + mins +":" + secs + "&nbsp;" + month + "/" + day + "/" + year;
}

//returns a human readable size in Kilo, Mega, Giga or Tera bytes
function humanize_size(value) {
    if (typeof(value) === "undefined") {
        value = 0;
    }
    var binarySufix = ["K", "M", "G", "T" ];
    var i=0;
    while (value > 1024 && i < 3){
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
function addElement(element,data_table){
	data_table.fnAddData(element);
}

//deletes an element with id 'tag' from a dataTable
function deleteElement(data_table,tag){
	var tr = $(tag).parents('tr')[0];
	data_table.fnDeleteRow(tr);
    $('input',data_table).trigger("change");
}

//Listens to the checkboxes of the datatable. This function is used
//by standard sunstone plugins to enable/disable certain action buttons
//according to the number of elements checked in the dataTables.
//It also checks the "check-all" box when all elements are checked
function tableCheckboxesListener(dataTable){

    //Initialization - disable all buttons
    var context = dataTable.parents('form');
    var last_action_b = $('.last_action_button',context);
    $('.top_button, .list_button',context).button("disable");
    if (last_action_b.length && last_action_b.val().length){
        last_action_b.button("disable");
    };
    $('.create_dialog_button',context).button("enable");

    //listen to changes
    $('input',dataTable).live("change",function(){
        var dataTable = $(this).parents('table').dataTable();
        var context = dataTable.parents('form');
        var last_action_b = $('.last_action_button',context);
        var nodes = dataTable.fnGetNodes();
        var total_length = nodes.length;
        var checked_length = $('input:checked',nodes).length;
        
        //if all elements are checked we check the check-all box
        if (total_length == checked_length && total_length != 0){
            $('.check_all',dataTable).attr("checked","checked");
        } else {
            $('.check_all',dataTable).removeAttr("checked");
        }

        //if some element is checked, we enable buttons, otherwise
        //we disable them.
        if (checked_length){
            $('.top_button, .list_button',context).button("enable");
            //check if the last_action_button should be enabled
            if (last_action_b.length && last_action_b.val().length){
                last_action_b.button("enable");
            };
        } else {
            $('.top_button, .list_button',context).button("disable");
            last_action_b.button("disable");
        }
        
        //any case the create dialog buttons should always be enabled.
        $('.create_dialog_button',context).button("enable");
    });

}

// Updates a data_table, with a 2D array containing the new values
// Does a partial redraw, so the filter and pagination are kept
function updateView(item_list,data_table){
	if (data_table!=null) {
		data_table.fnClearTable();
		data_table.fnAddData(item_list);
		data_table.fnDraw(false);
	};
}

//replaces an element with id 'tag' in a dataTable with a new one
function updateSingleElement(element,data_table,tag){
	var tr = $(tag).parents('tr')[0];
	var position = data_table.fnGetPosition(tr);
	data_table.fnUpdate(element,position,0);
    $('input',data_table).trigger("change");

}

// Returns an string in the form key=value key=value ...
// Does not explore objects in depth.
function stringJSON(json){
	var str = ""
	for (field in json) {
		str+= field + '=' + json[field] + ' ';
	}
	return str;
}

//Notifications
//Notification of submission of action
function notifySubmit(action, args, extra_param){
    var action_text = action.replace(/OpenNebula\./,'').replace(/\./,' ');

    var msg = "<h1>Submitted</h1>";
    msg += action_text + ": " + args;
    if (extra_param != null)
        msg += " >> " + extra_param;

    $.jGrowl(msg, {theme: "jGrowl-notify-submit"});
}

//Notification on error
function notifyError(msg){
    msg = "<h1>Error</h1>" + msg;

    $.jGrowl(msg, {theme: "jGrowl-notify-error", sticky: true });
}

// Returns an HTML string with the json keys and values in the form
// key: value<br />
// It recursively explores objects, and flattens their contents in
// the result.
function prettyPrintJSON(template_json){
	var str = ""
	for (field in template_json) {
		if (typeof template_json[field] == 'object'){
			str += prettyPrintJSON(template_json[field]) + '<tr><td></td><td></td></tr>';
		} else {
			str += '<tr><td class="key_td">'+field+'</td><td class="value_td">'+template_json[field]+'</td></tr>';
		};
	};
	return str;
}

//Add a listener to the check-all box of a datatable, enabling it to
//check and uncheck all the checkboxes of its elements.
function initCheckAllBoxes(datatable){
	//not showing nice in that position
	//$('.check_all').button({ icons: {primary : "ui-icon-check" },
	//							text : true});
    
    //small css hack
	$('.check_all',datatable).css({"border":"2px"});
	$('.check_all',datatable).click(function(){
		if ($(this).attr("checked")) {
			$('tbody input:checkbox',
				$(this).parents("table")).each(function(){
					$(this).attr("checked","checked");
			});

		} else {
			$('tbody input:checkbox',
				$(this).parents("table")).each(function(){
					$(this).removeAttr("checked");
			});			}
	});
}

//standard handling for the server errors on ajax requests.
//Pops up a message with the information.
function onError(request,error_json) {
    var method;
    var action;
    var object;
    var id;
    var reason;
    var m;
    var message = error_json.error.message;

    //redirect to login if unauthenticated
    if (error_json.error.http_status=="401") {
      window.location.href = "/login";
    };

    //Parse known errors:
    var action_error = /^\[(\w+)\] Error trying to (\w+) (\w+) \[(\w+)\].*Reason: (.*)\.$/;
    var action_error_noid = /^\[(\w+)\] Error trying to (\w+) (\w+) (.*)\.$/;
    var get_error = /^\[(\w+)\] Error getting (\w+) \[(\w+)\]\.$/;
    var auth_error = /^\[(\w+)\] User \[.\] not authorized to perform (\w+) on (\w+) \[?(\w+)\]?\.?$/;

    if (m = message.match(action_error)) {
        method  = m[1];
        action  = m[2];
        object  = m[3];
        id      = m[4];
        reason  = m[5];
    } else if (m = message.match(action_error_noid)) {
        method  = m[1];
        action  = m[2];
        object  = m[3];
        reason  = m[4];
    } else if (m = message.match(get_error)) {
        method  = m[1];
        action  = "SHOW";
        object  = m[2];
        id      = m[3];
    } else if (m = message.match(auth_error)) {
        method = m[1];
        action = m[2];
        object = m[3];
        id     = m[4];
    }

    if (m) {
        var rows;
        var i;
        var value;
        rows = ["method","action","object","id","reason"];
        message = "";
        for (i in rows){
            key = rows[i];
            value = eval(key);
            if (value)
                message += "<tr><td class=\"key_error\">"+key+"</td><td>"+value+"</td></tr>";
        }
        message = "<table>" + message + "</table>";
    }

    notifyError(message);
    return true;
}

//Replaces the checkboxes of a datatable with a ajax-loading spinner.
//Used when refreshing elements of a datatable.
function waitingNodes(dataTable){
    var nodes = dataTable.fnGetData();
    for (var i=0;i<nodes.length;i++){
       dataTable.fnUpdate(spinner,i,0);
    }
};


//given a user ID, returns an string with the user name.
//To do this it finds the user name in the user dataTable. If it is
//not defined then it returns "uid UID".
//TODO not very nice to hardcode a dataTable here...
function getUserName(uid){
    var user = "uid "+uid;
    if (typeof(dataTable_users) == "undefined") {
        return user;
        } 
    var nodes = dataTable_users.fnGetData();
    
    $.each(nodes,function(){
       if (uid == this[1]) {
           user = this[2];
           return false;
       }
    });
    return user;

}


//Replaces all class"tip" divs with an information icon that
//displays the tip information on mouseover.
function setupTips(context){
    
        //For each tip in this context
		$('div.tip',context).each(function(){
                //store the text
				var tip = $(this).html();
                //replace the text with an icon and spans
				$(this).html('<span class="ui-icon ui-icon-info info_icon"></span>');
                $(this).append('<span class="tipspan"></span>');

                $(this).append('<span class="ui-icon ui-icon-alert man_icon" />');

                //add the text to .tipspan
				$('span.tipspan',this).html(tip);
                //make sure it is not floating in the wrong place
                $(this).parent().append('<div class="clear"></div>');
                //hide the text
				$('span.tipspan',this).hide();
                
                //When the mouse is hovering on the icon we fadein/out
                //the tip text
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

//functions that used as true and false conditions for testing mainly
function True(){
    return true;
}
function False(){
    return false;
}    
