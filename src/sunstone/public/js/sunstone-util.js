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

function emptyDashboard(){
    $("#dashboard .value_td span").html(spinner);
}

function updateDashboard(what,json_info){
	db = $('#dashboard');
	switch (what){
		case "hosts":
			total_hosts=json_info.length;
			active_hosts=0;
			$.each(json_info,function(){
				if (parseInt(this.HOST.STATE) < 3){
					active_hosts++;}
			});
			$('#total_hosts',db).html(total_hosts);
			$('#active_hosts',db).html(active_hosts);
			break;
		case "clusters":
			total_clusters=json_info.length;
			$('#total_clusters',db).html(total_clusters);
			break;
		case "vms":
			total_vms=json_info.length;
			running_vms=0;
            failed_vms=0;
			$.each(json_info,function(){
                vm_state = parseInt(this.VM.STATE);
				if (vm_state == 3){
					running_vms++;
                }
                else if (vm_state == 7) {
                    failed_vms++;
                }
			});
			$('#total_vms',db).html(total_vms);
			$('#running_vms',db).html(running_vms);
			$('#failed_vms',db).html(failed_vms);
			break;
		case "vnets":
			public_vnets=0;
			total_vnets=json_info.length;
			$.each(json_info,function(){
				if (parseInt(this.VNET.PUBLIC)){
					public_vnets++;}
			});
			$('#total_vnets',db).html(total_vnets);
			$('#public_vnets',db).html(public_vnets);
			break;
		case "users":
			total_users=json_info.length;
			$('#total_users',db).html(total_users);
			break;
        case "images":
            total_images=json_info.length;
            public_images=0;
            $.each(json_info,function(){
				if (parseInt(this.IMAGE.PUBLIC)){
					public_images++;}
			});
            $('#total_images',db).html(total_images);
			$('#public_images',db).html(public_images);
            break;
	}
}

function pad(number,length) {
    var str = '' + number;
    while (str.length < length)
        str = '0' + str;
    return str;
}

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

function addElement(element,data_table){
	data_table.fnAddData(element);
}


function deleteElement(data_table,tag){
	tr = $(tag).parents('tr')[0];
	data_table.fnDeleteRow(tr);
    $('input',data_table).trigger("change");
}

function tableCheckboxesListener(dataTable){

    context = dataTable.parents('form');
    last_action_b = $('.last_action_button',context);
    $('.top_button, .list_button',context).button("disable");
    if (last_action_b.length && last_action_b.val().length){
        last_action_b.button("disable");
    };
    $('.new_button',context).button("enable");

    //listen to changes
    $('input',dataTable).live("change",function(){
        dataTable = $(this).parents('table').dataTable();
        context = dataTable.parents('form');
        last_action_b = $('.last_action_button',context);
        nodes = dataTable.fnGetNodes();
        total_length = nodes.length;
        checked_length = $('input:checked',nodes).length;

        if (total_length == checked_length){
            $('.check_all',dataTable).attr("checked","checked");
        } else {
            $('.check_all',dataTable).removeAttr("checked");
        }

        if (checked_length){
            $('.top_button, .list_button',context).button("enable");
            if (last_action_b.length && last_action_b.val().length){
                last_action_b.button("enable");
            };
            $('.new_button',context).button("enable");
        } else {
            $('.top_button, .list_button',context).button("disable");
            last_action_b.button("disable");
            $('.new_button',context).button("enable");
        }
    });

}

// Updates a data_table, with a 2D array containing
// Does a partial redraw, so the filter and pagination are kept
function updateView(item_list,data_table){
	if (data_table!=null) {
		data_table.fnClearTable();
		data_table.fnAddData(item_list);
		data_table.fnDraw(false);
	};
}

function updateSingleElement(element,data_table,tag){
	tr = $(tag).parents('tr')[0];
	position = data_table.fnGetPosition(tr);
	data_table.fnUpdate(element,position,0);
    $('input',data_table).trigger("change");

}

// Returns an string in the form key=value key=value ...
// Does not explore objects in depth.
function stringJSON(json){
	str = ""
	for (field in json) {
		str+= field + '=' + json[field] + ' ';
	}
	return str;
}

// Returns the running time data
function str_start_time(vm){
    return pretty_time(vm.STIME);
}


//Notifications
function notifySubmit(action, args, extra_param){
    var action_text = action.replace(/OpenNebula\./,'').replace(/\./,' ');

    var msg = "<h1>Submitted</h1>";
    msg += action_text + ": " + args;
    if (extra_param != null)
        msg += " >> " + extra_param;

    $.jGrowl(msg, {theme: "jGrowl-notify-submit"});
}

function notifyError(msg){
    msg = "<h1>Error</h1>" + msg;

    $.jGrowl(msg, {theme: "jGrowl-notify-error", sticky: true });
}

// Returns an HTML string with the json keys and values in the form
// key: value<br />
// It recursively explores objects, and flattens their contents in
// the result.
function prettyPrintJSON(template_json){
	str = ""
	for (field in template_json) {
		if (typeof template_json[field] == 'object'){
			str += prettyPrintJSON(template_json[field]) + '<tr><td></td><td></td></tr>';
		} else {
			str += '<tr><td class="key_td">'+field+'</td><td class="value_td">'+template_json[field]+'</td></tr>';
		};
	};
	return str;
}

//Adds a listener to checks all the elements of a table
function initCheckAllBoxes(datatable){
	//not showing nice in that position
	//$('.check_all').button({ icons: {primary : "ui-icon-check" },
	//							text : true});
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


function True(){
    return true;
}
function False(){
    return false;
}    
