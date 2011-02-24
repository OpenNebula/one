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


/*######################################################################
 * GLOBAL VARIABLES
 * ###################################################################*/

var dataTable_hosts=null;
//~ var dataTable_clusters=null;
var dataTable_vMachines=null;
var dataTable_vNetworks=null;
var dataTable_users=null;
var dataTable_images=null;
var host_list_json = {};
var cluster_list_json = {};
var vmachine_list_json = {};
var network_list_json = {};
var user_list_json = {};
var image_list_json = {};
var hosts_select="";
var clusters_select="";
var vnetworks_select="";
var images_select="";
var cookie = {};
var username = '';
var uid = '';
var spinner = '<img src="/images/ajax-loader.gif" alt="retrieving" class="loading_img"/>';

/*######################################################################
 * DOCUMENT READY FUNCTIONS
 * ###################################################################*/

$(document).ready(function() {

    readCookie();
    setLogin();
	insertTemplates(); //put templates in place
	initDataTables();
	initCheckAllBoxes();
    initListButtons();
	setupCreateDialogs();
    setupTips();
    hideUnauthorizedDivs();
    refreshButtonListener(); //listen to manual refresh image clicks
	confirmButtonListener(); //listen to buttons that require confirmation
	confirmWithSelectListener(); //listen to buttons requiring a selector
    actionButtonListener(); //listens to all simple actions (not creates)
    
    hostInfoListener();
    vMachineInfoListener();
    vNetworkInfoListener();
    imageInfoListener();
    

	
    setupImageAttributesDialogs(); //setups the add/update/remove attr dialogs

	//Jquery-ui eye-candy
	$('button').button();
	$('div#select_helpers').hide();
	emptyDashboard();
	preloadTables();
	setupAutoRefresh();
    
    tableCheckboxesListener(dataTable_hosts);
    tableCheckboxesListener(dataTable_vMachines);
    tableCheckboxesListener(dataTable_vNetworks);
    tableCheckboxesListener(dataTable_users);
    tableCheckboxesListener(dataTable_images);

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

function hideUnauthorizedDivs(){
    // hide all the oneadmin divs if user is not oneadmin
    if (uid != 0) {
        $(".oneadmin").hide();
    }
}
//puts predifined templates into the document body
//templates can be found in one-ui_views.templates.js
function insertTemplates(){
	$('div#dashboard').html(dashboard_tmpl);
	$('div#hosts').html(hostlist_tmpl);
	//$('div#clusters').html(clusterlist_tmpl);
	$('div#virtualMachines').html(vmachinelist_tmpl);
	$('div#virtualNetworks').html(vnetworklist_tmpl);
	$('div#users').html(userlist_tmpl);
    $('div#images').html(imagelist_tmpl);
}


//initializes the dataTables and sets the options
function initDataTables(){

	dataTable_hosts = $("#datatable_hosts").dataTable({
      "bJQueryUI": true,
      "bSortClasses": false,
      "bAutoWidth":false,
      "sPaginationType": "full_numbers",
      "aoColumnDefs": [
                        { "bSortable": false, "aTargets": ["check"] },
                        { "sWidth": "60px", "aTargets": [0,4] },
                        { "sWidth": "35px", "aTargets": [1] },
                        { "sWidth": "120px", "aTargets": [5,6] }
                       ]
    });


    //~ dataTable_clusters = $("#datatable_clusters").dataTable({
      //~ "bJQueryUI": true,
      //~ "bSortClasses": false,
      //~ "sPaginationType": "full_numbers",
      //~ "aoColumnDefs": [
                        //~ { "bSortable": false, "aTargets": ["check"] }
                       //~ ]
    //~ });

    dataTable_vMachines = $("#datatable_vmachines").dataTable({
      "bJQueryUI": true,
      "bSortClasses": false,
      "sPaginationType": "full_numbers",
      "bAutoWidth":false,
      "aoColumnDefs": [
                        { "bSortable": false, "aTargets": ["check"] },
                        { "sWidth": "60px", "aTargets": [0] },
                        { "sWidth": "35px", "aTargets": [1] },
                        { "sWidth": "100px", "aTargets": [2] }
                       ]
    });

    dataTable_vNetworks = $("#datatable_vnetworks").dataTable({
      "bJQueryUI": true,
      "bSortClasses": false,
      "bAutoWidth":false,
      "sPaginationType": "full_numbers",
      "aoColumnDefs": [
                        { "bSortable": false, "aTargets": ["check"] },
                        { "sWidth": "60px", "aTargets": [0,4,5,6,7] },
                        { "sWidth": "35px", "aTargets": [1] },
                        { "sWidth": "100px", "aTargets": [2] }
                       ]
    });

    if (uid == 0) {
        dataTable_users = $("#datatable_users").dataTable({
          "bJQueryUI": true,
          "bSortClasses": false,
          "sPaginationType": "full_numbers",
          "bAutoWidth":false,
          "aoColumnDefs": [
                            { "bSortable": false, "aTargets": ["check"] },
                            { "sWidth": "60px", "aTargets": [0] },
                            { "sWidth": "35px", "aTargets": [1] }
                           ]
        });
    }

    dataTable_images = $("#datatable_images").dataTable({
        "bJQueryUI": true,
        "bSortClasses": false,
        "bAutoWidth":false,
        "sPaginationType": "full_numbers",
        "aoColumnDefs": [
                        { "bSortable": false, "aTargets": ["check"] },
                        { "sWidth": "60px", "aTargets": [0,3] },
                        { "sWidth": "35px", "aTargets": [1] },
                        { "sWidth": "100px", "aTargets": [2,3] }
                       ]
    });

}

//Adds a listener to checks all the elements of a table
function initCheckAllBoxes(){
	//not showing nice in that position
	//$('.check_all').button({ icons: {primary : "ui-icon-check" },
	//							text : true});
	$('.check_all').css({"border":"2px"});
	$('.check_all').click(function(){
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
}

function refreshButtonListener(){
    $('.refresh_image').click(function(){
        action = $(this).attr('alt');
        callback = null;

        waiting_nodes = function(dataTable){
            nodes = dataTable.fnGetData();
            for (var i=0;i<nodes.length;i++){
                    dataTable.fnUpdate(spinner,i,0);
            }
        };

		switch (action){
			case "OpenNebula.Host.list":
				callback = updateHostsView;
                waiting_nodes(dataTable_hosts);
				OpenNebula.Host.list({success: callback, error: onError});
                callback = updateClustersView;
				OpenNebula.Cluster.list({success: callback, error: onError});
				break;
			case "OpenNebula.Cluster.list":
				//we have no cluster button for this
				break;
			case "OpenNebula.VM.list":
				callback = updateVMachinesView;
                waiting_nodes(dataTable_vMachines);
				OpenNebula.VM.list({success: callback, error: onError});
				break;
			case "OpenNebula.Network.list":
				callback = updateVNetworksView;
                waiting_nodes(dataTable_vNetworks);
				OpenNebula.Network.list({success: callback, error: onError});
				break;
			case "OpenNebula.User.list":
				callback = updateUsersView;
                waiting_nodes(dataTable_users);
				OpenNebula.User.list({success: callback, error: onError});
				break;
            case "OpenNebula.Image.list":
                callback = updateImagesView;
                waiting_nodes(dataTable_images);
                OpenNebula.Image.list({success: callback, error: onError});
		}
		//(eval(action)(callback, onError)); not working
		//this.resource is undefined when calling methods this way.
		return false;
    });
}

//Listens to ".confirm_button" elements. Shows a dialog allowing to
//confirm or cancel an action, with a tip.
function confirmButtonListener(){
	//add this dialog to the dialogs if it does not exist
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

	$('.confirm_button').live("click",function(){
		val=$(this).val();
		tip="";
		//supported cases
		switch (val) {
			case "OpenNebula.VM.deploy":
				tip="This will deploy the selected VMs on the selected host.";
				break;
			case "OpenNebula.VM.migrate":
				tip="This will migrate the selected VMs to the selected host. ";
				tip+="This is a \"cold\" migration, as the VMs will be stopped ";
				tip+="prior to that migration";
				break;
			case "OpenNebula.VM.livemigrate":
				tip="This will live-migrate the selected VMs to the selected host.";
				break;
			case "OpenNebula.VM.hold":
				tip="This will pause the selected VMs.";
				break;
			case "OpenNebula.VM.release":
				tip="This will release the selected VMs";
				break;
			case "OpenNebula.VM.suspend":
				tip="This will suspend the selected VMs. You can resume them later.";
				break;
			case "OpenNebula.VM.resume":
				tip="This will resume the selected VMs from their suspend state";
				break;
			case "OpenNebula.VM.stop":
				tip="This will shutdown the selected VMs.";
				break;
			case "OpenNebula.VM.restart":
				tip="This will reboot the selected VMs.";
				break;
			case "OpenNebula.VM.shutdown":
				tip="This will try to properly shutdown the selected VMs.";
				break;
			case "OpenNebula.VM.cancel":
				tip="This will destroy the selected VMs";
				break;
            case "OpenNebula.VM.delete":
                tip="This will delete the selected VMs";
                break;
			default: return false;

		}
		$('div#confirm_tip').text(tip);
		$('div#confirm_dialog button#proceed').val(val);
		$('div#confirm_dialog').dialog("open");

		return false;
	});

	$('div#confirm_dialog #cancel').click(function(){
		$('div#confirm_dialog').dialog("close");
		return false;
	});

}

//Listens to ".confirm_with_select_button" elements. Shows a dialog
//allowing to confirm or cancel an action, with a tip and a
//select input field. Depending on the action, the select can
//contain different values. If wanting to proceed, the action is
//executed for each of the checked elements of the table, with the
//selected item of the box as extra parameter.
function confirmWithSelectListener(){
		//add this dialog to the dialogs.
    if (!($('div#confirm_with_select_dialog').length)){
        $('div#dialogs').append('<div id="confirm_with_select_dialog" title="Confirmation of action"></div>');
    };

	$('div#confirm_with_select_dialog').html(
			'<form action="javascript:alert(\'js error!\');">\
			<div id="confirm_with_select_tip"></div>\
			<select style="margin: 10px 0;" id="confirm_select">\
			</select>\
			<div class="form_buttons">\
			  <button id="confirm_with_select_proceed" value="">OK</button>\
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
	
	$( '.confirm_with_select_button').live("click",function(){
		val=$(this).val();
		tip="";
		dataTable=null;
		select_helper=null;
		callback=null;
		//supported cases
		switch (val) {
			case "OpenNebula.Cluster.addhost":
				tip="This will add the selected Hosts the the following cluster:";
				dataTable="dataTable_hosts";
				callback = function(req){
					OpenNebula.Host.show({data:{id:req.request.data}, success: updateHostElement, error: onError});
					};
				select_var = clusters_select;
				break;
            case "OpenNebula.Cluster.delete":
                tip="Select the cluster you want to delete";
                dataTable="null";
                select_var = clusters_select;
                callback = function (){
                    OpenNebula.Cluster.list({success: updateClustersView,error: onError});
                }
                break;
			case "OpenNebula.VM.deploy":
				tip="This will deploy the selected VMs. Please select a host for the deployment:";
				dataTable = "dataTable_vMachines";
				callback = function(req){
					OpenNebula.VM.show({data:{id:req.request.data},success: updateVMachineElement,error: onError})};
				select_var = hosts_select;
				break;
			case "OpenNebula.VM.migrate":
				tip="This will migrate the selected VMs. Please select a host as destination for the migration:";
				dataTable = "dataTable_vMachines";
				callback = function(req){
					OpenNebula.VM.show({data:{id:req.request.data},success: updateVMachineElement, error: onError})};
				select_var = hosts_select;
				break;
			case "OpenNebula.VM.livemigrate":
				tip="This will live-migrate the selected VMs. Please select a host as destination for the migration:";
				dataTable = "dataTable_vMachines";
				callback = function(req){
					OpenNebula.VM.show({data:{id:req.request.data},success: updateVMachineElement,error: onError})};
				select_var = hosts_select;
				break;
			default: return false;

		}

		//insert options
		$('select#confirm_select').html(select_var);

		$('div#confirm_with_select_tip').text(tip);

		$('button#confirm_with_select_proceed').val(val);
		$('button#confirm_with_select_proceed').attr("dataTable",dataTable);
		$('div#confirm_with_select_dialog').dialog("open");

		return false;
	});

	$('button#confirm_with_select_proceed').click(function(){
		action=$(this).val();

		selected_item_id = $('#confirm_select :selected').val();
		dataTable=eval($(this).attr("dataTable"));

        var data;
        switch (action) {
			case "OpenNebula.Cluster.addhost":
                data = {cluster_id: selected_item_id};
				break;
            case "OpenNebula.Cluster.delete":
                data = {cluster_id: selected_item_id};
                break;
			case "OpenNebula.VM.deploy":
                data = {host_id: selected_item_id};
				break;
			case "OpenNebula.VM.migrate":
                data = {host_id: selected_item_id};
				break;
			case "OpenNebula.VM.livemigrate":
                data = {host_id: selected_item_id};
				break;
			default: return false;
		}

		if (dataTable != null && selected_item_id.length){
			nodes = $('input:checked',dataTable.fnGetNodes());
            //prepare array for notification
            var nodes_id = new Array();
			$.each(nodes, function(){
                nodes_id.push($(this).val());
                data.id = $(this).val();
				(eval(action)({data: data, success: callback, error: onError }));
			});
            notifySubmit(action,nodes_id,selected_item_id);
		}
        else { //we execute the action only on the selected item
            (eval(action)({data:{id: selected_item_id},success: callback,error: onError}));
        }

		$('div#confirm_with_select_dialog').dialog("close");
		return false;
	});

	$('button#confirm_with_select_cancel').click(function(){
		$('div#confirm_with_select_dialog').dialog("close");
		return false;
	});

}

//Listens to click on ".action_button" elements. According to the value
//of the element, it sends actions to OpenNebula.js. This function
//handles all the simple actions of the UI: delete, enables, disables, etc...
function actionButtonListener(){

	//Listener
	$('.action_button').live("click",function(){
		dataTable=null; //Which dataTable should be updated afterwards?
		callback = null; //Which callback function should be used on success?

		//Actions have 1 fixed parametre (the element they primarly
		//affect, fectched from the checkboxes of the list.
		//Does our action need two params? (ex. add host to cluster)
		extra_param = null;


		action = $(this).val(); //Fetch the value of the action

		//Actions are grouped. For some of them no need to make a
		//difference
		switch (action){
			//Host list actions
			//case "OpenNebula.Cluster.addhost":
			case "OpenNebula.Cluster.removehost":
				extra_param="0";
			case "OpenNebula.Host.enable":
			case "OpenNebula.Host.disable":
				dataTable = dataTable_hosts;
				callback =  function(req){
								OpenNebula.Host.show({data:{id:req.request.data[0]},success: updateHostElement,error: onError});
							};
				break;

			case "OpenNebula.Host.delete":
				dataTable = dataTable_hosts;
				callback = deleteHostElement;
				break;

			//~ //Cluster list actions - now it is confirm with select
			//~ case "OpenNebula.Cluster.delete":
				//~ dataTable = dataTable_clusters;
				//~ callback = deleteClusterElement;
				//~ break;

			//VMachine list actions
			case "OpenNebula.VM.deploy":
			case "OpenNebula.VM.migrate":
			case "OpenNebula.VM.livemigrate":
				//Set an extra param if is a deploy, migrate or livemigrate
				host = $('#vm_host :selected').val();
				//Making sure we selected a host
				if (!host.length){
					break;
				};
				extra_param = host;

			case "OpenNebula.VM.hold":
			case "OpenNebula.VM.release":
			case "OpenNebula.VM.suspend":
			case "OpenNebula.VM.resume":
			case "OpenNebula.VM.stop":
			case "OpenNebula.VM.restart":
			case "OpenNebula.VM.shutdown":
			case "OpenNebula.VM.cancel":
				dataTable = dataTable_vMachines;
				callback = function(req){
					OpenNebula.VM.show({data:{id:req.request.data},success: updateVMachineElement,error: onError})};
				break;
			case "OpenNebula.VM.delete":
				dataTable = dataTable_vMachines;
				callback = deleteVMachineElement;
				break;

			//VNET list actions
			case "OpenNebula.Network.publish":
			case "OpenNebula.Network.unpublish":
				dataTable = dataTable_vNetworks;
				callback =  function(req){
					OpenNebula.Network.show({data:{id:req.request.data},success: updateVNetworkElement, error: onError})};
				break;
				break;
			case "OpenNebula.Network.delete":
				dataTable = dataTable_vNetworks;
				callback =  deleteVNetworkElement;
				break;
			case "OpenNebula.User.delete":
				dataTable = dataTable_users;
				callback = deleteUserElement;
				break;

            //Images
            case "OpenNebula.Image.delete":
                dataTable = dataTable_images;
                callback = deleteImageElement;
                break;
            case "OpenNebula.Image.enable":
            case "OpenNebula.Image.disable":
            case "OpenNebula.Image.persistent":
            case "OpenNebula.Image.nonpersistent":
            case "OpenNebula.Image.publish":
            case "OpenNebula.Image.unpublish":
                dataTable = dataTable_images;
                callback =  function(req){
								OpenNebula.Image.show({data:{id:req.request.data[0]},success: updateImageElement, error: onError});
							};
                break;
		}

		$('div#confirm_dialog').dialog("close"); //in case we required it

		//If there is not a datatable set to fetch the elements affected,
		//we assume the action was not recognised.
		if (dataTable != null){

			//Which rows of the datatable are checked?
			nodes = $('input:checked',dataTable.fnGetNodes());

			//For each we execute the action
            var nodes_id = new Array();
			$.each(nodes, function(){
                //prepare array for notification
                nodes_id.push($(this).val());
				//Calling action(id,callback,error_callback)
				if (extra_param!=null){ //action with two parameters
                    var data_arg = {cluster_id: extra_param, id: $(this).val()};
					(eval(action)({data: data_arg, success: callback, error: onError}));
				} else { //action with one parameter
					(eval(action)({data:{id:$(this).val()},success: callback,error: onError}));
				};
			});
            //Notify
            if (extra_param!=null) {
                notifySubmit(action,nodes_id,extra_param);
            } else {
                notifySubmit(action,nodes_id);
            }
		}
		return false;
	});
}

function preloadTables(){
    dataTable_hosts.fnClearTable();
    addElement([
        spinner,
        '','','','','','',''],dataTable_hosts);
	OpenNebula.Host.list({success: updateHostsView,error: onError});

    //~ dataTable_clusters.fnClearTable();
    //~ addElement([
        //~ spinner,
        //~ '',''],dataTable_clusters);
	OpenNebula.Cluster.list({success: updateClustersView,error: onError});

    dataTable_vNetworks.fnClearTable();
    addElement([
        spinner,
        '','','','','','',''],dataTable_vNetworks);
	OpenNebula.Network.list({success: updateVNetworksView, error: onError});

    dataTable_vMachines.fnClearTable();
    addElement([
        spinner,
        '','','','','','','',''],dataTable_vMachines);
	OpenNebula.VM.list({success: updateVMachinesView, error: onError});

    if (uid == 0){
        dataTable_users.fnClearTable();
        addElement([
            spinner,
            '',''],dataTable_users);
        OpenNebula.User.list({success: updateUsersView,error: onError});
    }

    dataTable_images.fnClearTable();
    addElement([
        spinner,
        '','','','','','','','',''],dataTable_images);
    OpenNebula.Image.list({success: updateImagesView, error: onError});
}



function setupImageAttributesDialogs(){
    $('div#dialogs').append('<div id="image_attributes_dialog" title="Image attributes"></div>');

    $('#image_attributes_dialog').html(
        '<form action="javascript:alert(\'js error!\');">\
            <fieldset>\
            <div id="img_attr_action_desc">\
            </div>\
            <div>\
               <input type="hidden" id="img_attr_action" />\
                <label for="img_attr_name">Name:</label>\
                <input type="text" id="img_attr_name" name="img_attr_name" value="" />\
            </div>\
            <div>\
                <label for="img_attr_value">Value:</label>\
               <input type="text" id="img_attr_value" name="img_attr_value" value="" />\
            </div>\
			<div>\
			  <button id="img_attr_proceed" value="">OK</button>\
			  <button id="img_attr_cancel" value="">Cancel</button>\
			</div>\
            </fieldset>\
        </form>');

    $('#image_attributes_dialog').dialog({
        autoOpen:false,
        width:400,
        modal:true,
        height:200,
        resizable:false,
    });

    $('.image_attribute_button').click(function(){
        action = $(this).val();
        desc = "";
        switch (action){
            case "OpenNebula.Image.addattr":
            case "OpenNebula.Image.update":
                $('#img_attr_value').show();
                $('#img_attr_value').prev().show();
                desc = "Please write the name and value of the attribute. It will be added or updated in all selected images:";
                $('#img_attr_action').val("OpenNebula.Image.addattr");
                break;
            case "OpenNebula.Image.rmattr":
                $('#img_attr_value').hide();
                $('#img_attr_value').prev().hide();
                desc = "Please type the attribute you want to remove:";
                $('#img_attr_action').val("OpenNebula.Image.rmattr");
                break;
        }

        $('#img_attr_action_desc').html(desc);
        $('#image_attributes_dialog').dialog('open');
        return false;
    });

    $('#img_attr_name').keyup(function(){
       $(this).val($(this).val().toUpperCase());
    });

    $('#image_attributes_dialog #img_attr_proceed').click(function(){
       action = $('#img_attr_action').val();
       nodes = $('input:checked',dataTable_images.fnGetNodes());
       name = $('#img_attr_name').val();
       value = $('#img_attr_value').val();
       switch (action) {
           case "OpenNebula.Image.addattr":
           case "OpenNebula.Image.update":
                $.each(nodes,function(){
                   OpenNebula.Image.addattr({data: {
                                                    id: $(this).val()
                                                    , name: name
                                                    , value: value
                                                    }
                                            , success: 0
                                            , error: onError
                                            });
                });
                break;
           case "OpenNebula.Image.rmattr":
                $.each(nodes,function(){
                    OpenNebula.Image.rmattr({data: {
                                                    id: $(this).val()
                                                    , name: name
                                                    , value: value
                                                    }
                                            , success: 0
                                            , error: onError
                                            });
                });
                break;
        }
        $('#image_attributes_dialog').dialog('close');
        return false;
    });

    $('#image_attributes_dialog #img_attr_cancel').click(function(){
        $('#image_attributes_dialog').dialog('close');
        return false;
    });

}

//Sets refresh intevals for the tables.
function setupAutoRefresh(){
	interval=120000; //2 minutes
	//hosts
	setInterval(function(){
		nodes = $('input:checked',dataTable_hosts.fnGetNodes());
        filter = $("#datatable_hosts_filter input").attr("value");
		if (!nodes.length && !filter.length){
			OpenNebula.Host.list({timeout: true, success: updateHostsView,error: onError});
		}
	},interval);


	//clusters
	//~ setInterval(function(){
		//~ nodes = $('input:checked',dataTable_clusters.fnGetNodes());
		//~ if (!nodes.length){
			//~ OpenNebula.Cluster.list(updateClustersView,onError);
		//~ }
	//~ },interval+4000); //so that not all refreshing is done at the same time

    //clusters
	setInterval(function(){
        OpenNebula.Cluster.list({timeout: true, success: updateClustersView,error: onError});
	},interval+4000); //so that not all refreshing is done at the same time


	//Networks
	setInterval(function(){
		nodes = $('input:checked',dataTable_vNetworks.fnGetNodes());
        filter = $("#datatable_vnetworks_filter input").attr("value");
		if (!nodes.length && !filter.length){
			OpenNebula.Network.list({timeout: true, success: updateVNetworksView, error: onError});
		}
	},interval+8000); //so that not all refreshing is done at the same time

	//VMs
	setInterval(function(){
		nodes = $('input:checked',dataTable_vMachines.fnGetNodes());
        filter = $("#datatable_vmachines_filter input").attr("value");
		if (!nodes.length && !filter.length){
			OpenNebula.VM.list({timeout: true, success: updateVMachinesView,error: onError});
		}
	},interval+12000); //so that not all refreshing is done at the same time


	//Users
    //do not update if user is not oneadmin
    if (uid == 0) {
        setInterval(function(){
		nodes = $('input:checked',dataTable_users.fnGetNodes());
        filter = $("#datatable_users_filter input").attr("value");
		if (!nodes.length && !filter.length){
			OpenNebula.User.list({timeout: true, success: updateUsersView, error: onError});
		}
        },interval+14000); //so that not all refreshing is done at the same time
    }

    //Images
	setInterval(function(){
		nodes = $('input:checked',dataTable_images.fnGetNodes());
        filter = $("#datatable_images_filter input").attr("value");
		if (!nodes.length && !filter.length){
			OpenNebula.Image.list({timeout: true, success: updateImagesView, error: onError});
		}
	},interval+16000);
}

/*######################################################################
 * CREATE DIALOGS
 * ###################################################################*/

 /*## HOSTS ## */

function createHostDialog(){

	//We put the template in place
	$('#create_host_dialog').html(create_host_tmpl);

	//Enable the jquery dialog but we keep it hidden
	$create_host_dialog = $('#create_host_dialog').dialog({
		autoOpen: false,
		modal: true,
		width: 500
	});

	//$('#create_host_dialog div.radioset').buttonset();
	//not working properly: sometimes selected option comes as undefined
	//$('#create_host_button').button();

	//Listen to the + New Host button and open dialog when clicked
	$('.create_host_button').click(function(){
		$create_host_dialog.dialog('open');
		return false;
	});

	//Handle the form submission
	$('#create_host_form').submit(function(){
        if (!($('#name',this).val().length)){
            notifyError("Host name missing!");
            return false;
        }
		host_json = { "host": { "name": $('#name',this).val(),
							"tm_mad": $('#tm_mad :selected',this).val(),
							"vm_mad": $('#vmm_mad :selected',this).val(),
							"im_mad": $('#im_mad :selected',this).val()}}

		//Create the OpenNebula.Host.
		//If it's successfull we refresh the list.
		OpenNebula.Host.create({data: host_json, success: addHostElement, error: onError});
		$create_host_dialog.dialog('close');
		return false;
	});
}

 /*## CLUSTERS ## */

function createClusterDialog(){
	//Insert HTML in place
	$('#create_cluster_dialog').html(create_cluster_tmpl);

	//Prepare the JQUERY dialog. Set style options here.
	$create_cluster_dialog = $('#create_cluster_dialog').dialog({
		autoOpen: false,
		modal: true,
		width: 400
	});

	//$('#create_cluster_button').button();

	//Listen to a click on the + New Cluster button
	$('.create_cluster_button').click(function(){
		$create_cluster_dialog.dialog('open');
		return false;
	});

	//Handle the submission of the form
	$('#create_cluster_form').submit(function(){
		name=$('#name',this).val();
		cluster_json = { "cluster" : { "name" : name }};
		//Create the Cluster.
		//If it's successfull we refresh the list.
		OpenNebula.Cluster.create({ data:cluster_json,
                                    success: function(){
                                        OpenNebula.Cluster.list({success:updateClustersView,error:onError})},
                                    error: onError});
		$create_cluster_dialog.dialog('close');
		return false;
	});
}

 /*## VNETS ## */

function createVNetworkDialog(){

	//Insert dialog HTML in place
	 $('#create_vn_dialog').html(create_vn_tmpl);

	//Prepare the jquery-ui dialog. Set style options here.
	$create_vn_dialog = $('#create_vn_dialog').dialog({
		autoOpen: false,
		modal: true,
		width: 475,
        height: 500
	});

	//Make the tabs look nice for the creation mode
	$('#vn_tabs').tabs();
    $('div#ranged').hide();
    $('#fixed_check').click(function(){
       $('div#fixed').show();
       $('div#ranged').hide();
    });
    $('#ranged_check').click(function(){
        $('div#fixed').hide();
        $('div#ranged').show();
    });
	//$('#create_vn_button').button();

	//We listen to the + New Vnet button and open the dialog when clicked
	$('.create_vn_button').click(function(){
		$create_vn_dialog.dialog('open');
		return false;
	});

	//When we hit the add lease button...
	$('#add_lease').click(function(){
		create_form = $('#create_vn_form_easy'); //this is our scope

		//Fetch the interesting values
		lease_ip = $('#leaseip',create_form).val();
		lease_mac = $('#leasemac',create_form).val();

		//We don't add anything to the list if there is nothing to add
		if (lease_ip == null) {
			notifyError("Please provide a lease IP");
			return false;
		};


		lease = ""; //contains the HTML to be included in the select box
		if (lease_mac == "") {
			lease='<option value="' + lease_ip + '">' + lease_ip + '</option>';
		} else {
			lease='<option value="' +
			lease_ip + ',' +
			lease_mac + '">' +
			lease_ip + ',' + lease_mac +
			'</option>';
		};

		//We append the HTML into the select box.
		$('select#leases').append(lease);
		return false;
	});

	$('#remove_lease').click(function(){
		$('select#leases :selected').remove();
		return false;
	});

	//Handle submission of the easy mode
	$('#create_vn_form_easy').submit(function(){
		//Fetch values
		name = $('#name',this).val();
        if (!name.length){
            notifyError("Virtual Network name missing!");
            return false;
        }
		bridge = $('#bridge',this).val();
		type = $('input:checked',this).val();

		//TBD: Name and bridge provided?!

		network_json = null;
		if (type == "fixed") {
			leases = $('#leases option', this);
			leases_obj=[];

			//for each specified lease we prepare the JSON object
			$.each(leases,function(){
				leases_obj.push({"ip": $(this).val() });
			});

			//and construct the final data for the request
			network_json = {
				"vnet" : {
					"type" : "FIXED",
					"leases" : leases_obj,
					"bridge" : bridge,
					"name" : name }};
			}
		else { //type ranged

			network_addr = $('#net_address',this).val();
			network_size = $('#net_size',this).val();
			if (!network_addr.length){
				notifyError("Please provide a network address");
				return false;
			};

			//we form the object for the request
			network_json = {
				"vnet" : {
					"type" : "RANGED",
					"bridge" : bridge,
					"network_size" : network_size,
					"network_address" : network_addr,
					"name" : name }
				};
		};

		//Create the VNetwork.
		//If it's successfull we refresh the list.
		OpenNebula.Network.create({
				data: network_json,
				success: addVNetworkElement,
				error: onError});
		$create_vn_dialog.dialog('close');
		return false;
	});

	$('#create_vn_form_manual').submit(function(){
		template=$('#template',this).val();
        vnet_json = {vnet: {vnet_raw: template}};
		OpenNebula.Network.create({data: vnet_json, success: addVNetworkElement,error: onError});
		$create_vn_dialog.dialog('close');
		return false;
	});

}

 /*## VMACHINES ## */

function createVMachineDialog(){

	/* #### createVMachineDialog() helper functions #### */

    vmTabChange = function(event,ui){
	// ui.tab     // anchor element of the selected (clicked) tab
	// ui.panel   // element, that contains the selected/clicked tab contents
	// ui.index   // zero-based index of the selected (clicked) tab
        switch(ui.index){
            case 0:
                enable_kvm();
                break;
            case 1:
                enable_xen();
                break;
            case 2:
                break;
            case 3:
                break;
        }
    }

	update_dynamic_css = function(){
        //This function used to be useful to add specific
        //css to elements that changed.
        //Now its not needed anymore apparently
        /*
		if (templ_type=="kvm"){
			$(xen_man_items).css({"font-weight":"normal"});
			$(kvm_man_items).css({"background":"green","font-weight":"bold"});
			$(kvm_opt_items).css({"background":"yellow"});
		} else if (templ_type=="xen"){
			$(kvm_man_items).css({"font-weight":"normal"});
			$(xen_man_items).css({"background":"green","font-weight":"bold"});
			$(xen_opt_items).css({"background":"yellow"});
		};*/
	};

	enable_kvm = function(){
		man_class="kvm";
		opt_class="kvm_opt";
		$(xen_items).attr("disabled","disabled");
		$(xen_items).css("background","");
		$(kvm_items).removeAttr("disabled");
		//$(items+':disabled').hide();


		//particularities
		$('div#disks select#TYPE option:selected').removeAttr("selected");
		$('div#disks select#TYPE').prepend(
		'<option id="no_type" value="">None</option>');
		$('div#disks select#TYPE option#no_type').attr("selected","selected");

        $('select#boot_method option').removeAttr("selected");
		$('select#boot_method option#no_boot').html("Driver default");
		$('select#boot_method option').removeAttr("selected");
        $('.kernel, .bootloader', $('div#os_boot_opts')).hide();

		$('input#TYPE', section_raw).val("kvm");

		$(section_inputs).show();

        update_dynamic_css();
	};

	enable_xen = function(){
		man_class="xen";
		opt_class="xen_opt";
		$(kvm_items).attr("disabled","disabled");
		$(kvm_items).css("background","");
		$(xen_items).removeAttr("disabled");
		//$(items+':disabled').hide();


		//particularities
		$('div#disks select#TYPE option#no_type').remove();

		$('select#boot_method option:selected').removeAttr("selected");
        $('select#boot_method option#no_boot').html("Please choose");
		$('.kernel, .bootloader', $('div#os_boot_opts')).hide();


		$('input#TYPE', section_raw).val("kvm");
		$(section_inputs).hide(); //not present for xen
		update_dynamic_css();
	};

	mandatory_filter = function(context){
			man_items = "";
			if (templ_type == "kvm")
			{ man_items = ".kvm"; }
			else if (templ_type == "xen")
			{ man_items = ".xen"; }
			else {return false;};

			//find enabled mandatory items in this context
			man_items = $(man_items+' input:visible',context);
			r = true;
			$.each(man_items,function(){
				if ($(this).parents(".vm_param").attr("disabled") ||
					!($(this).val().length)) {
					r = false;
					return false;
				};
			});
			return r;

		};

	box_add_element = function(context,box_tag,filter){
			value="";
			params= $('.vm_param',context);
			inputs= $('input:enabled',params);
			selects = $('select:enabled',params);
			fields = $.merge(inputs,selects);

			//are fields correctly set?
			result = filter();
			if (!result) {
				notifyError("There are mandatory parameters missing in this section");
				return false;
			}

			value={};
			$.each(fields,function(){
				if (!($(this).parents(".vm_param").attr("disabled")) &&
					$(this).val().length){
					id = $(this).attr('id').length ? $(this).attr('id') :  $(this).parent().attr('id');
					value[id] = $(this).val();
				}
			});
			string = JSON.stringify(value);
			option= '<option value=\''+string+'\'>'+
					stringJSON(value)+
					'</option>';
			$('select'+box_tag,context).append(option);
			return false;
	};

	box_remove_element = function(section_tag,box_tag){
			context = $(section_tag);
			$('select'+box_tag+' :selected',context).remove();
			return false;
	};

	addSectionJSON = function(template_json,context){
			params= $('.vm_param',context);
			inputs= $('input:enabled',params);
			selects = $('select:enabled',params);
			fields = $.merge(inputs,selects);

			fields.each(function(){
				if (!($(this).parents(".vm_param").attr("disabled"))){ //if ! disabled
					if ($(this).val().length){ //if has a length
						template_json[$(this).attr('id')]=$(this).val();
					}
				}
			});
	}

	addBoxJSON = function(array,context,box_tag){
		$('select'+box_tag+' option',context).each(function(){
				array.push( JSON.parse($(this).val()) );
		});
	}

    removeEmptyObjects = function(obj){
        for (elem in obj){
            remove = false;
            value = obj[elem];
            if (value instanceof Array)
            {
                if (value.length == 0)
                    remove = true;
            }
            else if (value instanceof Object)
            {
                var obj_length = 0;
                for (e in value)
                    obj_length += 1;
                if (obj_length == 0)
                    remove = true;
            }
            else
            {
                value = String(value);
                if (value.length == 0)
                    remove = true;
            }
            if (remove)
                delete obj[elem];
        }
        return obj;
    }

	iconToggle = function(){
		$('.icon_right').toggle(
			function(e){
				$('span',e.currentTarget).removeClass("ui-icon-plusthick");
				$('span',e.currentTarget).addClass("ui-icon-minusthick");
			},function(e){
				$('span',e.currentTarget).removeClass("ui-icon-minusthick");
				$('span',e.currentTarget).addClass("ui-icon-plusthick");
			});
	}

	capacity_setup = function(){

		//$('fieldset',section_capacity).hide();

		//~ $('#add_capacity',section_capacity).click(function(){
				//~ $('fieldset',section_capacity).toggle();
				//~ return false;
		//~ });

	}

	os_boot_setup = function(){
		$('fieldset',section_os_boot).hide();
		$('.bootloader, .kernel',section_os_boot).hide();

		$('#add_os_boot_opts',section_os_boot).click(function(){
			$('fieldset',section_os_boot).toggle();
            return false;
		});


        //Chrome workaround
        $('#boot_method').change(function(){
            $(this).trigger("click");
        });

        $('#boot_method',section_os_boot).click(function(){
			select = $(this).val();
			switch (select)
			{
				case "kernel":
					$('.bootloader',section_os_boot).hide();
					$('.bootloader',section_os_boot).attr("disabled","disabled");
					$('.kernel',section_os_boot).show();
					$('.kernel',section_os_boot).removeAttr("disabled");
					break;
				case "bootloader":
					$('.kernel',section_os_boot).hide();
					$('.kernel',section_os_boot).attr("disabled","disabled");
					$('.bootloader',section_os_boot).show();
					$('.bootloader',section_os_boot).removeAttr("disabled");
					break;
				default:
					$('.kernel, .bootloader',section_os_boot).hide();
					$('.kernel, .bootloader',section_os_boot).attr("disabled","disabled");
					$('.kernel input, .bootloader input',section_os_boot).val("");
			};
		});
	};

	disks_setup = function(){

		$('fieldset',section_disks).hide();
		$('.vm_param', section_disks).hide();
		//$('#image_vs_disk',section_disks).show();

		$('#add_disks', section_disks).click(function(){
			$('fieldset',section_disks).toggle();
            return false;
		});

		$('#image_vs_disk input',section_disks).click(function(){
			//$('fieldset',section_disks).show();
            $('.vm_param', section_disks).show();
			select = $('#image_vs_disk :checked',section_disks).val();
			switch (select)
			{
				case "disk":
					$('.add_image',section_disks).hide();
					$('.add_image',section_disks).attr("disabled","disabled");
					$('.add_disk',section_disks).show();
					$('.add_disk',section_disks).removeAttr("disabled");
					$('#TARGET',section_disks).parent().removeClass(opt_class);
					$('#TARGET',section_disks).parent().addClass(man_class);
					break;
				case "image":
					$('.add_disk',section_disks).hide();
					$('.add_disk',section_disks).attr("disabled","disabled");
					$('.add_image',section_disks).show();
					$('.add_image',section_disks).removeAttr("disabled");
					$('#TARGET',section_disks).parent().removeClass(man_class);
					$('#TARGET',section_disks).parent().addClass(opt_class);
					break;
			}
			$('#SIZE',section_disks).parent().hide();
			$('#SIZE',section_disks).parent().attr("disabled","disabled");
			$('#FORMAT',section_disks).parent().hide();
			$('#SIZE',section_disks).parent().attr("disabled","disabled");
			$('#TYPE :selected',section_disks).removeAttr("selected");

			update_dynamic_css();
		});



		//activate correct mandatory attributes when
		//selecting disk type

        //Chrome workaround
        $('select#TYPE',section_disks).change(function(){
           $(this).trigger('click');
        });

		$('select#TYPE',section_disks).click(function(){
			select = $(this).val();
			switch (select) {
				//size,format,target
				case "swap":
					//size mandatory
					$('#SIZE',section_disks).parent().show();
					$('#SIZE',section_disks).parent().removeAttr("disabled");
					$('#SIZE',section_disks).parent().removeClass(opt_class);
					$('#SIZE',section_disks).parent().addClass(man_class);

					//target optional
					$('#TARGET',section_disks).parent().removeClass(man_class);
					$('#TARGET',section_disks).parent().addClass(opt_class);

					//format hidden
					$('#FORMAT',section_disks).parent().hide();
					$('#FORMAT',section_disks).parent().attr("disabled","disabled");
					break;
				case "fs":
					//size mandatory
					$('#SIZE',section_disks).parent().show();
					$('#SIZE',section_disks).parent().removeAttr("disabled");
					$('#SIZE',section_disks).parent().removeClass(opt_class);
					$('#SIZE',section_disks).parent().addClass(man_class);

					//target mandatory
					$('#TARGET',section_disks).parent().removeClass(opt_class);
					$('#TARGET',section_disks).parent().addClass(man_class);

					//format mandatory
					$('#FORMAT',section_disks).parent().show();
					$('#FORMAT',section_disks).parent().removeAttr("disabled");
					$('#FORMAT',section_disks).parent().removeClass(opt_class);
					$('#FORMAT',section_disks).parent().addClass(man_class);

					break;
				case "block":
					//size shown and optional
					$('#SIZE',section_disks).parent().show();
					$('#SIZE',section_disks).parent().removeAttr("disabled");
					$('#SIZE',section_disks).parent().removeClass(man_class);
					$('#SIZE',section_disks).parent().addClass(opt_class);

					//target mandatory
					$('#TARGET',section_disks).parent().removeClass(opt_class);
					$('#TARGET',section_disks).parent().addClass(man_class);

					//format hidden
					$('#FORMAT',section_disks).parent().hide();
					$('#FORMAT',section_disks).parent().attr("disabled","disabled");
					break;
				case "floppy":
				case "disk":
				case "cdrom":
					//size hidden
					$('#SIZE',section_disks).parent().hide();
					$('#SIZE',section_disks).parent().attr("disabled","disabled");

					//target mandatory
					$('#TARGET',section_disks).parent().removeClass(opt_class);
					$('#TARGET',section_disks).parent().addClass(man_class);

					//format optional
				    $('#FORMAT',section_disks).parent().hide();
				    $('#FORMAT',section_disks).parent().attr("disabled","disabled");

			}
			update_dynamic_css();
		});

		diskFilter = function(){
			return mandatory_filter(section_disks);
		};

		$('#add_disk_button',section_disks).click(function(){
			box_add_element(section_disks,'#disks_box',diskFilter);
			return false;
			});
		$('#remove_disk_button',section_disks).click(function(){
			box_remove_element(section_disks,'#disks_box');
			return false;
			});
	};

	networks_setup = function(){

		$('.vm_param',section_networks).hide();
		$('fieldset',section_networks).hide();

		$('#add_networks',section_networks).click(function(){
			$('fieldset',section_networks).toggle();
            return false;
		});

		$('#network_vs_niccfg input',section_networks).click(function(){

			select = $('#network_vs_niccfg :checked',section_networks).val();
			switch (select) {
				case "network":
					$('.niccfg',section_networks).hide();
					$('.niccfg',section_networks).attr("disabled","disabled");
					$('.network',section_networks).show();
					$('.network',section_networks).removeAttr("disabled");
					break;
				case "niccfg":
					$('.network',section_networks).hide();
					$('.network',section_networks).attr("disabled","disabled");
					$('.niccfg',section_networks).show();
					$('.niccfg',section_networks).removeAttr("disabled");
					break;
			}
		});

	nicFilter = function(){
			network = $('select#network :selected',section_networks).attr('id');
			ip = $('#IP',section_networks).val();
			mac = $('#MAC',section_networks).val();

			return (network != "no_network" || ip.length || mac.length);
		};

		$('#add_nic_button',section_networks).click(function(){
			box_add_element(section_networks,'#nics_box',nicFilter);
			return false;
			});
		$('#remove_nic_button',section_networks).click(function(){
			box_remove_element(section_networks,'#nics_box');
			return false;
			});

	};

	inputs_setup = function() {
		$('fieldset',section_inputs).hide();

		$('#add_inputs',section_inputs).click(function(){
				$('fieldset',section_inputs).toggle();
                return false;
		});

		$('#add_input_button',section_inputs).click(function(){
			//no filter
			box_add_element(section_inputs,'#inputs_box',function(){return true;});
			return false;
			});
		$('#remove_input_button',section_inputs).click(function(){
			box_remove_element(section_inputs,'#inputs_box');
			return false;
			});
	};

	graphics_setup = function(){
		$('fieldset',section_graphics).hide();
        $('.vm_param',section_graphics).hide();
        $('select#TYPE',section_graphics).parent().show();

		$('#add_graphics',section_graphics).click(function(){
			$('fieldset',section_graphics).toggle();
            return false;
		});

        //Chrome workaround
        $('select#TYPE',section_graphics).change(function(){
            $(this).trigger("click");
        });
		$('select#TYPE',section_graphics).click(function(){
			g_type = $(this).val();
			switch (g_type) {
				case "vnc":
                    $('#LISTEN',section_graphics).parent().show();
					$('#PORT',section_graphics).parent().show();
					$('#PASSWD',section_graphics).parent().show();
					$('#KEYMAP',section_graphics).parent().show();
					$('#PORT',section_graphics).parent().removeAttr("disabled");
					$('#PASSWD',section_graphics).parent().removeAttr("disabled");
					$('#KEYMAP',section_graphics).parent().removeAttr("disabled");
					break;
				case "sdl":
                    $('#LISTEN',section_graphics).parent().show();
					$('#PORT',section_graphics).parent().hide();
					$('#PASSWD',section_graphics).parent().hide();
					$('#KEYMAP',section_graphics).parent().hide();
					$('#PORT',section_graphics).parent().attr("disabled","disabled");
					$('#PASSWD',section_graphics).parent().attr("disabled","disabled");
					$('#KEYMAP',section_graphics).parent().attr("disabled","disabled");
					break;
                default:
                    $('#LISTEN',section_graphics).parent().hide();
					$('#PORT',section_graphics).parent().hide();
					$('#PASSWD',section_graphics).parent().hide();
					$('#KEYMAP',section_graphics).parent().hide();

			}
		});

	}

	context_setup = function(){
		$('fieldset',section_context).hide();

		$('#add_context',section_context).click(function(){
				$('fieldset',section_context).toggle();
                return false;
		});

	};

	placement_setup = function(){
		$('fieldset',section_placement).hide();

		$('#add_placement',section_placement).click(function(){
				$('fieldset',section_placement).toggle();
                return false;
		});

	};

	raw_setup = function(){
		$('fieldset',section_raw).hide();

		$('#add_raw',section_raw).click(function(){
				$('fieldset',section_raw).toggle();
                return false;
		});
	};

	/* #### createVMachineDialog() main body #### */

	//Insert HTML in place
	$('#create_vm_dialog').html(create_vm_tmpl);
	$('#vm_create_tabs').tabs({
        select:vmTabChange
        });

	//Prepare jquery dialog
    var height = Math.floor($(window).height()*0.8); //set height to a percentage of the window
	$create_vm_dialog = $('#create_vm_dialog').dialog({
		autoOpen: false,
		modal: true,
		width: 700,
        height: height
	});

	//Listen to the + New VM button and open dialog
	$('.create_vm_button').click(function(){
		$create_vm_dialog.dialog('open');
		return false;
	});

	iconToggle(); //toogle +/- buttons

	//Sections, used to stay within their scope
	section_capacity = $('#capacity');
	section_os_boot = $('#os_boot_opts');
	section_disks = $('#disks');
	section_networks = $('#networks');
	section_inputs = $('#inputs');
	section_graphics = $('#graphics');
	section_context = $('#context');
	section_placement = $('#placement');
	section_raw = $('#raw');

	//Different selector for items of kvm and xen (mandatory and optional)
	items = '.vm_section input,.vm_section select';
	kvm_man_items = '.kvm input,.kvm select';
	kvm_opt_items = '.kvm_opt input, .kvm_opt select';
	kvm_items = kvm_man_items +','+kvm_opt_items;
	xen_man_items = '.xen input,.xen select';
	xen_opt_items = '.xen_opt input, .xen_opt select';
	xen_items = xen_man_items +','+ xen_opt_items;

	//Starting template type, optional items class and mandatory items class
	templ_type = "kvm";
	opt_class=".kvm_opt";
	man_class=".kvm";

	$('#template_type #kvm').attr("checked","checked"); //check KVM
	enable_kvm(); //enable all kvm options

	//handle change between templates.
	$("#template_type input").click(function(){
		templ_type = $("#template_type :checked").val();
		switch (templ_type)
		{
			case "kvm":
				enable_kvm();
				break;
			case "xen":
				enable_xen();
				break;
		}
	});

    $('#fold_unfold_vm_params').toggle(
        function(){
            $('.vm_section fieldset').show();
            return false;
        },
        function(){
            $('.vm_section fieldset').hide();
            $('.vm_section fieldset').first().show();
            return false;
        });

	capacity_setup();
	os_boot_setup();
	disks_setup();
	networks_setup();
	inputs_setup();
	graphics_setup();
	context_setup();
	placement_setup();
	raw_setup();

	$('button#create_vm_form_easy').click(function(){
		//validate form

		vm_json = {};

		//process capacity options
		scope = section_capacity;

		if (!mandatory_filter(scope)){
			notifyError("There are mandatory fields missing in the capacity section");
			return false;
		};
		addSectionJSON(vm_json,scope);

		//process os_boot_opts
		scope= section_os_boot;
		switch (templ_type){
			case "xen":
                boot_method = $('#boot_method option:selected',scope).val();
				if (!boot_method.length){
					notifyError("Xen templates must specify a boot method");
					return false;}
		};

		if (!mandatory_filter(scope)){
			notifyError("There are mandatory fields missing in the OS Boot options section");
			return false;
		};
		addSectionJSON(vm_json,scope);

		//process disks
		scope = section_disks;
		vm_json["DISK"] = [];
		addBoxJSON(vm_json["DISK"],scope,'#disks_box');

		//process nics -> fetch from box
		scope = section_networks;
		vm_json["NIC"] = [];
		addBoxJSON(vm_json["NIC"],scope,'#nics_box');

		//process inputs -> fetch from box
		scope = section_inputs;
		vm_json["INPUT"] = [];
		addBoxJSON(vm_json["INPUT"],scope,'#inputs_box');

		//process graphics -> fetch fields with value
		scope = section_graphics;
		vm_json["GRAPHICS"] = {};
		addSectionJSON(vm_json["GRAPHICS"],scope);

		//context -> include
		scope = section_context;
        var context = $('#CONTEXT',scope).val();
        if (context)
            vm_json["CONTEXT"] = context;

		//placement -> fetch with value
		scope = section_placement;
		addSectionJSON(vm_json,scope);

		//raw -> if value set type to driver and fetch
		scope = section_raw;
		vm_json["RAW"] = {};
		addSectionJSON(vm_json["RAW"],scope);

        // remove empty elements
        vm_json = removeEmptyObjects(vm_json);

        //wrap it in the "vm" object
        vm_json = {vm: vm_json}
		OpenNebula.VM.create({data: vm_json,
				success: addVMachineElement,
				error: onError});

		$create_vm_dialog.dialog('close');
		return false;
	});

	$('button#create_vm_form_manual').click(function(){
		template = $('#vm_template').val();

        //wrap it in the "vm" object
        template = {vm: {vm_raw: template}};

		OpenNebula.VM.create({data: template,
					success: addVMachineElement,
					error: onError});
		$create_vm_dialog.dialog('close');
		return false;
	});

	$('button#reset').click(function(){
		$('select#disks_box option',section_disks).remove();
		$('select#nics_box option',section_networks).remove();
		$('select#inputs_box option',section_inputs).remove();
		return true;
	});

 }

 /*## USERS ## */

function createUserDialog(){

	//Insert HTML in place
	$('#create_user_dialog').html(create_user_tmpl);

	//Prepare jquery dialog
	$create_user_dialog = $('#create_user_dialog').dialog({
		autoOpen: false,
		modal:true,
		width: 400
	});

	//$('#create_user_button').button();

	//Listen to the + New User button and open dialog
	$('.create_user_button').click(function(){
		$create_user_dialog.dialog('open');
		return false;
	});

	//Handle form submission
	$('#create_user_form').submit(function(){
		user_name=$('#username',this).val();
		user_password=$('#pass',this).val();
		user_json = { "user" :
						{ "name" : user_name,
						  "password" : user_password }
					  };
		OpenNebula.User.create({data: user_json,
				success: addUserElement,
				error: onError});
		$create_user_dialog.dialog('close');
		return false;
	});
}

function createImageDialog(){
    //Insert HTML in place
    $('#create_image_dialog').html(create_image_tmpl);

    //Prepare jquery dialog
    $create_image_dialog = $('#create_image_dialog').dialog({
		autoOpen: false,
		modal:true,
		width: 520
	});

    //Listen to the Register image button and open dialog
	$('.create_image_button').click(function(){
		$create_image_dialog.dialog('open');
		return false;
	});

    //Effects
    $('#img_tabs').tabs();
    $('#img_type option').first().attr("selected","selected");
    $('#datablock_img').attr("disabled","disabled");

   //Chrome workaround
    $('select#img_type').change(function(){
        $(this).trigger("click");
    });

    $('select#img_type').click(function(){
        value = $(this).val();
        switch (value){
            case "DATABLOCK":
                $('#datablock_img').removeAttr("disabled");
                break;
            default:
                $('#datablock_img').attr("disabled","disabled");
                $('#path_img').attr("checked","checked");
                $('#img_source,#img_fstype,#img_size').parent().hide();
                $('#img_path').parent().show();
        }
    });

    $('#img_source,#img_fstype,#img_size').parent().hide();
    $('#path_img').attr("checked","checked");
    $('#img_path').parent().addClass("img_man");

    $('#img_public').click(function(){
       $('#img_persistent').removeAttr("checked");
    });

    $('#img_persistent').click(function(){
       $('#img_public').removeAttr("checked");
    });



    $('#src_path_select input').click(function(){
        value = $(this).val();
        switch (value){
            case "path":
                $('#img_source,#img_fstype,#img_size').parent().hide();
                $('#img_source,#img_fstype,#img_size').parent().removeClass("img_man");
                $('#img_path').parent().show();
                $('#img_path').parent().addClass("img_man");
                break;
            case "source":
                $('#img_path,#img_fstype,#img_size').parent().hide();
                $('#img_path,#img_fstype,#img_size').parent().removeClass("img_man");
                $('#img_source').parent().show();
                 $('#img_source').parent().addClass("img_man");
                break;
            case "datablock":
                $('#img_source,#img_path').parent().hide();
                $('#img_source,#img_path').parent().removeClass("img_man");
                $('#img_fstype,#img_size').parent().show();
                $('#img_fstype,#img_size').parent().addClass("img_man");
                break;
        }
    });


    $('#create_image_form_easy').submit(function(){
        exit = false;
        $('.img_man',this).each(function(){
           if (!$('input',this).val().length){
               notifyError("There are mandatory missing parameters");
               exit = true;
               return false;
           }
        });
        if (exit) { return false; }
        img_json = {};

        name = $('#img_name').val();
        img_json["NAME"] = name;

        desc = $('#img_desc').val();
        if (desc.length){
            img_json["DESCRIPTION"] = desc;
        }

        type = $('#img_type').val();
        img_json["TYPE"]= type;

        img_json["PUBLIC"] = $('#img_public:checked').length ? "YES" : "NO";

        img_json["PERSISTENT"] = $('#img_persistent:checked').length ? "YES" : "NO";

        dev_prefix = $('#img_dev_prefix').val();
        if (dev_prefix.length){
            img_json["DEV_PREFIX"] = dev_prefix;
        }

        bus = $('#img_bus').val();
        img_json["BUS"] = bus;

        switch ($('#src_path_select input:checked').val()){
            case "path":
                path = $('#img_path').val();
                img_json["PATH"] = path;
                break;
            case "source":
                source = $('#img_source').val();
                img_json["SOURCE"] = source;
                break;
            case "datablock":
                size = $('#img_size').val();
                fstype = $('#img_fstype').val();
                img_json["SIZE"] = size;
                img_json["FSTYPE"] = fstype;
                break;
        }
        obj = { "image" : img_json };
        OpenNebula.Image.register({data: obj,success: addImageElement,error: onError});

        $create_image_dialog.dialog('close');
       return false;
    });

    $('#create_image_form_manual').submit(function(){
		template=$('#template',this).val();
		OpenNebula.Image.create({data: template,success: addImageElement,error: onError});
		$create_image_dialog.dialog('close');
       return false;
    });


}

/*######################################################################
 * UTIL FUNCTIONS
 * ###################################################################*/

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

//Returns the username of a user providing the uid.
//Crawls the user dataTable for that. If such user is not found,
//we return the uid.
function getUserName(uid){
    nodes = dataTable_users.fnGetData();
    user = "uid "+uid;
    $.each(nodes,function(){
       if (uid == this[1]) {
           user = this[2];
           return false;
       }
    });
    return user;

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

function deleteElement(data_table,tag){
	tr = $(tag).parents('tr')[0];
	data_table.fnDeleteRow(tr);
    $('input',data_table).trigger("change");
}

function addElement(element,data_table){
	data_table.fnAddData(element);
}

function hostElementArray(host_json){
	host = host_json.HOST;
	acpu = parseInt(host.HOST_SHARE.MAX_CPU);
		if (!acpu) {acpu=100};
	acpu = acpu - parseInt(host.HOST_SHARE.CPU_USAGE);

    total_mem = parseInt(host.HOST_SHARE.MAX_MEM);
    free_mem = parseInt(host.HOST_SHARE.FREE_MEM);

    if (total_mem == 0) {
        ratio_mem = 0;
    } else {
        ratio_mem = Math.round(((total_mem - free_mem) / total_mem) * 100);
    }


    total_cpu = parseInt(host.HOST_SHARE.MAX_CPU);
    used_cpu = Math.max(total_cpu - parseInt(host.HOST_SHARE.USED_CPU),acpu);

    if (total_cpu == 0) {
        ratio_cpu = 0;
    } else {
        ratio_cpu = Math.round(((total_cpu - used_cpu) / total_cpu) * 100);
    }

     pb_mem =
'<div style="height:10px" class="ratiobar ui-progressbar ui-widget ui-widget-content ui-corner-all" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="'+ratio_mem+'">\
    <div class="ui-progressbar-value ui-widget-header ui-corner-left ui-corner-right" style="width: '+ratio_mem+'%;"/>\
    <span style="position:relative;left:45px;top:-4px;font-size:0.6em">'+ratio_mem+'%</span>\
    </div>\
</div>';

    pb_cpu =
'<div style="height:10px" class="ratiobar ui-progressbar ui-widget ui-widget-content ui-corner-all" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="'+ratio_cpu+'">\
    <div class="ui-progressbar-value ui-widget-header ui-corner-left ui-corner-right" style="width: '+ratio_cpu+'%;"/>\
    <span style="position:relative;left:45px;top:-4px;font-size:0.6em">'+ratio_cpu+'%</span>\
    </div>\
</div>';


    return [ '<input type="checkbox" id="host_'+host.ID+'" name="selected_items" value="'+host.ID+'"/>',
			host.ID,
			host.NAME,
			host.CLUSTER,
			host.HOST_SHARE.RUNNING_VMS, //rvm
            pb_cpu,
			pb_mem,
			OpenNebula.Helper.resource_state("host",host.STATE) ];


	//~ return [ '<input type="checkbox" id="host_'+host.ID+'" name="selected_items" value="'+host.ID+'"/>',
			//~ host.ID,
			//~ host.NAME,
			//~ host.CLUSTER,
			//~ host.HOST_SHARE.RUNNING_VMS, //rvm
			//~ host.HOST_SHARE.MAX_CPU, //tcpu
			//~ parseInt(host.HOST_SHARE.MAX_CPU) - parseInt(host.HOST_SHARE.USED_CPU), //fcpu
			//~ acpu,
			//~ humanize_size(host.HOST_SHARE.MAX_MEM),
			//~ humanize_size(host.HOST_SHARE.FREE_MEM),
			//~ OpenNebula.Helper.resource_state("host",host.STATE) ];
}

//Adds a listener to show the extended info when clicking on a row
function hostInfoListener(){
	$('#tbodyhosts tr').live("click",function(e){
        
		//do nothing if we are clicking a checkbox!
		if ($(e.target).is('input')) {return true;}

        popDialogLoading();
		aData = dataTable_hosts.fnGetData(this);
		id = $(aData[0]).val();
		OpenNebula.Host.show({data:{id:id},success: updateHostInfo,error: onError});
		return false;
	});
}

//~ function clusterElementArray(cluster_json){
	//~ cluster = cluster_json.CLUSTER;
	//~ return ['<input type="checkbox" id="cluster_'+cluster.ID+'" name="selected_items" value="'+cluster.ID+'"/>',
		//~ cluster.ID,
		//~ cluster.NAME
		//~ ]
//~ }

function vMachineElementArray(vm_json){
	vm = vm_json.VM;
	return [
			'<input type="checkbox" id="vm_'+vm.ID+'" name="selected_items" value="'+vm.ID+'"/>',
			vm.ID,
			vm.USERNAME ? vm.USERNAME : getUserName(vm.UID),
			vm.NAME,
			OpenNebula.Helper.resource_state("vm",vm.STATE),
			vm.CPU,
			humanize_size(vm.MEMORY),
			vm.HISTORY ? vm.HISTORY.HOSTNAME : "--",
			str_start_time(vm)
		]
}

//Adds a listener to show the extended info when clicking on a row
function vMachineInfoListener(){

	$('#tbodyvmachines tr').live("click", function(e){
		if ($(e.target).is('input')) {return true;}
		aData = dataTable_vMachines.fnGetData(this);
		id = $(aData[0]).val();
		OpenNebula.VM.show({data: {id:id},success: updateVMInfo,error: onError});
		return false;
	});
}

function vNetworkElementArray(vn_json){
	network = vn_json.VNET;
    if (network.TOTAL_LEASES){
        total_leases = network.TOTAL_LEASES;
    }else if (network.LEASES && network.LEASES.LEASE){
        total_leases = network.LEASES.LEASE.length ? network.LEASES.LEASE.length : "1";
    } else{
        total_leases = "0";
    }
	username = network.USERNAME? network.USERNAME : getUserName(network.UID)
	return ['<input type="checkbox" id="vnetwork_'+network.ID+'" name="selected_items" value="'+network.ID+'"/>',
		network.ID,
		username,
		network.NAME,
		parseInt(network.TYPE) ? "FIXED" : "RANGED",
		network.BRIDGE,
		parseInt(network.PUBLIC) ? "yes" : "no",
		total_leases ];
}
//Adds a listener to show the extended info when clicking on a row
function vNetworkInfoListener(){
 
	$('#tbodyvnetworks tr').live("click", function(e){
		if ($(e.target).is('input')) {return true;}
		aData = dataTable_vNetworks.fnGetData(this);
		id = $(aData[0]).val();
		OpenNebula.Network.show({data:{id: id},success: updateVNetworkInfo,error: onError});
		return false;
	});
}

function userElementArray(user_json){
	user = user_json.USER;
	return [
		'<input type="checkbox" id="user_'+user.ID+'" name="selected_items" value="'+user.ID+'"/>',
		user.ID,
		user.NAME
		]
}

function imageElementArray(image_json){
    image = image_json.IMAGE;
    return [
        '<input type="checkbox" id="image_'+image.ID+'" name="selected_items" value="'+image.ID+'"/>',
        image.ID,
        image.USERNAME ? image.USERNAME : getUserName(image.ID),
        image.NAME,
        OpenNebula.Helper.image_type(image.TYPE),
        pretty_time(image.REGTIME),
        parseInt(image.PUBLIC) ? "yes" : "no",
        parseInt(image.PERSISTENT) ? "yes" : "no",
        OpenNebula.Helper.resource_state("image",image.STATE),
        image.RUNNING_VMS
        ];
}

function imageInfoListener(target){
    
    $('#tbodyimages tr').live("click",function(e){
        if ($(e.target).is('input')) {return true;}
        aData = dataTable_images.fnGetData(this);
        id = $(aData[0]).val();
        OpenNebula.Image.show({data: {id: id},success: updateImageInfo,error: onError});
        return false;
    });
}

function updateHostSelect(host_list){

	//update select helper
	hosts_select="";
	hosts_select += "<option value=\"\">Select a Host</option>";
	$.each(host_list, function(){
		hosts_select += "<option value=\""+this.HOST.ID+"\">"+this.HOST.NAME+"</option>";
	});

	//update static selectors
	$('#vm_host').html(hosts_select);
}

function updateClusterSelect(cluster_list){

	//update select helper
	clusters_select= "";
	clusters_select+="<option value=\"\">Select a cluster</option>";
	$.each(cluster_list, function(){
		clusters_select += "<option value=\""+this.CLUSTER.ID+"\">"+this.CLUSTER.NAME+"</option>";
	});

	//update static selectors
	//$('#host_cluster').html(clusters_select);

}

function updateNetworkSelect(network_list){
	//update select helper
	vnetworks_select="";
	vnetworks_select += "<option value=\"\">Select a network</option>";
	$.each(network_list, function(){
		vnetworks_select += "<option value=\""+this.VNET.NAME+"\">"+this.VNET.NAME+"</option>";

	});

	//update static selectors
	$('div.vm_section#networks select#NETWORK').html(vnetworks_select);
}

function updateImageSelect(image_list){
    images_select="";
    images_select += "<option value=\"\">Select an image</option>";
    $.each(image_list, function(){
        if ((this.IMAGE.STATE < 3) && (this.IMAGE.STATE > 0)){
            images_select += '<option id="img_sel_'+this.IMAGE.ID+'" value="'+this.IMAGE.NAME+'">'+this.IMAGE.NAME+'</option>';
        }
    });

    //update static selectors
    $('div.vm_section#disks select#IMAGE').html(images_select);
}


// New layout
//~ function tabSelect(event,ui){
	//~ // ui.tab     // anchor element of the selected (clicked) tab
	//~ // ui.panel   // element, that contains the selected/clicked tab contents
	//~ // ui.index   // zero-based index of the selected (clicked) tab
	//~ switch(ui.index)
	//~ {
		//~ case 0:
			//~ emptyDashboard();
			//~ preloadTables();
			//~ break;
		//~ case 1: // Hosts
			//~ OpenNebula.Host.list(updateHostsView,onError);
			//~ break;
		//~ case 2: // Clusters
			//~ OpenNebula.Cluster.list(updateClustersView,onError);
			//~ break;
		//~ case 3: //VMs
			//~ OpenNebula.VM.list(updateVMachinesView,onError);
			//~ break;
		//~ case 4: //VNs
			//~ OpenNebula.Network.list(updateVNetworksView,onError);
			//~ break;
		//~ case 5: //Users
			//~ OpenNebula.User.list(updateUsersView,onError);
			//~ break;
	//~ }
//~ }

//puts the dashboard values into "retrieving"
function emptyDashboard(){
    $("#dashboard .value_td span").html(spinner);
}

function updateDashboard(what){
	db = $('#dashboard');
	switch (what){
		case "hosts":
			total_hosts=host_list_json.length;
			active_hosts=0;
			$.each(host_list_json,function(){
				if (parseInt(this.HOST.STATE) < 3){
					active_hosts++;}
			});
			$('#total_hosts',db).html(total_hosts);
			$('#active_hosts',db).html(active_hosts);
			break;
		case "clusters":
			total_clusters=cluster_list_json.length;
			$('#total_clusters',db).html(total_clusters);
			break;
		case "vms":
			total_vms=vmachine_list_json.length;
			running_vms=0;
            failed_vms=0;
			$.each(vmachine_list_json,function(){
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
			total_vnets=network_list_json.length;
			$.each(network_list_json,function(){
				if (parseInt(this.VNET.PUBLIC)){
					public_vnets++;}
			});
			$('#total_vnets',db).html(total_vnets);
			$('#public_vnets',db).html(public_vnets);
			break;
		case "users":
			total_users=user_list_json.length;
			$('#total_users',db).html(total_users);
			break;
        case "images":
            total_images=image_list_json.length;
            public_images=0;
            $.each(image_list_json,function(){
				if (parseInt(this.IMAGE.PUBLIC)){
					public_images++;}
			});
            $('#total_images',db).html(total_images);
			$('#public_images',db).html(public_images);
            break;
	}
}

/*######################################################################
  * UPDATE VIEWS - CALLBACKS
  * ##################################################################*/
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

/* All the following functions follow a similar function:
 * 'update*View' functions clear and fully repopulate the tables.
 * 'update*Element' functions find and update a single element with new
 * info.
 * 'delete*Element' functions find and remove an element from the list.
 * 'add*Element' functions add a new element to the list.
 *  */

function updateHostElement(request, host_json){
	id = host_json.HOST.ID;
	element = hostElementArray(host_json);
	updateSingleElement(element,dataTable_hosts,'#host_'+id);
}

function deleteHostElement(req){
	deleteElement(dataTable_hosts,'#host_'+req.request.data);
}

function addHostElement(request,host_json){
    id = host_json.HOST.ID;
	element = hostElementArray(host_json);
	addElement(element,dataTable_hosts);
}

function updateHostsView (request,host_list){
	host_list_json = host_list;
	host_list_array = []

	$.each(host_list,function(){
	//Grab table data from the host_list
		host_list_array.push(hostElementArray(this));
	});

	updateView(host_list_array,dataTable_hosts);
	updateHostSelect(host_list);
	updateDashboard("hosts");
}


//~ function updateClusterElement(request, cluster_json){
	//~ id = cluster_json.CLUSTER.ID;
	//~ element = clusterElementArray(cluster_json);
	//~ updateSingleElement(element,dataTable_clusters,'#cluster_'+id)
//~ }
//~
//~ function deleteClusterElement(req){
	//~ deleteElement(dataTable_clusters,'#cluster_'+req.request.data);
//~ }
//~
//~ function addClusterElement(request,cluster_json){
	//~ element = clusterElementArray(cluster_json);
	//~ addElement(element,dataTable_clusters);
//~ }

function updateClustersView(request, cluster_list){
	cluster_list_json = cluster_list;
	//~ cluster_list_array = [];

	//~ $.each(cluster_list, function(){
		//~ cluster_list_array.push(clusterElementArray(this));
	//~ });
	//~ updateView(cluster_list_array,dataTable_clusters);
	updateClusterSelect(cluster_list);
	updateDashboard("clusters");
}


function updateVMachineElement(request, vm_json){
	id = vm_json.VM.ID;
	element = vMachineElementArray(vm_json);
	updateSingleElement(element,dataTable_vMachines,'#vm_'+id)
}

function deleteVMachineElement(req){
	deleteElement(dataTable_vMachines,'#vm_'+req.request.data);
}

function addVMachineElement(request,vm_json){
    id = vm_json.VM.ID;
    notifySubmit('OpenNebula.VM.create',id);
	element = vMachineElementArray(vm_json);
	addElement(element,dataTable_vMachines);
    updateVMInfo(null,vm_json);
}

function updateVMachinesView(request, vmachine_list){
	vmachine_list_json = vmachine_list;
	vmachine_list_array = [];

	$.each(vmachine_list,function(){
		vmachine_list_array.push( vMachineElementArray(this));
	});

	updateView(vmachine_list_array,dataTable_vMachines);
	updateDashboard("vms");
}


function updateVNetworkElement(request, vn_json){
	id = vn_json.VNET.ID;
	element = vNetworkElementArray(vn_json);
	updateSingleElement(element,dataTable_vNetworks,'#vnetwork_'+id);
}

function deleteVNetworkElement(req){
	deleteElement(dataTable_vNetworks,'#vnetwork_'+req.request.data);
    //How to delete vNetwork select option here?
}

function addVNetworkElement(request,vn_json){
	element = vNetworkElementArray(vn_json);
	addElement(element,dataTable_vNetworks);
    vnetworks_select += "<option value=\""+vn_json.VNET.NAME+"\">"+vn_json.VNET.NAME+"</option>";
    $('div.vm_section#networks select#NETWORK').html(vnetworks_select);
	
}

function updateVNetworksView(request, network_list){
	network_list_json = network_list;
	network_list_array = [];

	$.each(network_list,function(){
		network_list_array.push(vNetworkElementArray(this));
	});

	updateView(network_list_array,dataTable_vNetworks);
	updateNetworkSelect(network_list);
	updateDashboard("vnets");

}

function updateUserElement(request, user_json){
	id = user_json.USER.ID;
	element = userElementArray(user_json);
	updateSingleElement(element,dataTable_users,'#user_'+id);
}

function deleteUserElement(req){
	deleteElement(dataTable_users,'#user_'+req.request.data);
}

function addUserElement(request,user_json){
	element = userElementArray(user_json);
	addElement(element,dataTable_users);
}

function updateUsersView(request,users_list){
	user_list_json = users_list;
	user_list_array = [];

	$.each(user_list_json,function(){
		user_list_array.push(userElementArray(this));
	});
	updateView(user_list_array,dataTable_users);
	updateDashboard("users");
}


function updateImageElement(request, image_json){
    id = image_json.IMAGE.ID;
    element = imageElementArray(image_json);
    updateSingleElement(element,dataTable_images,'#image_'+id);
    if ((image_json.IMAGE.STATE < 3) && 
        (image_json.IMAGE.STATE > 0) &&
        ($('#img_sel_'+id,images_select).length == 0)){
            images_select += '<option id="img_sel_'+id+'" value="'+image_json.IMAGE.NAME+'">'+image_json.IMAGE.NAME+'</option>';
        }   
    else {
        tag = 'option#img_sel_'+id;
        select = $('<select>'+images_select+'</select>');
        $(tag,select).remove();
        images_select = $(select).html();
    }
    $('div.vm_section#disks select#IMAGE').html(images_select);
}

function deleteImageElement(req){
    deleteElement(dataTable_images,'#image_'+req.request.data);
    tag = 'option#img_sel_'+req.request.data;
    select = $('<select>'+images_select+'</select>');
    $(tag,select).remove();
    images_select = $(select).html();
    $('div.vm_section#disks select#IMAGE').html(images_select);    
}

function addImageElement(request, image_json){
    element = imageElementArray(image_json);
    addElement(element,dataTable_images);
}

function updateImagesView(request, images_list){
    image_list_json = images_list;
    image_list_array = [];
    $.each(image_list_json,function(){
       image_list_array.push(imageElementArray(this));
    });

    updateView(image_list_array,dataTable_images);
    updateImageSelect(images_list);
    updateDashboard("images");


}


/*######################################################################
 * UPDATE INFO DIALOGS FUNCTIONS - CALLBACKS
 * ###################################################################*/
//All functions in this section are callbacks for the "show"
//action. They receive the element JSON, format it and add it to the
//shown dialog.


function updateHostInfo(request,host){
	host_info = host.HOST
	rendered_info =
'<div id="host_informations">\
	<ul>\
		<li><a href="#info_host">Host information</a></li>\
		<li><a href="#host_template">Host template</a></li>\
	</ul>\
	<div id="info_host">\
		<table id="info_host_table" class="info_table">\
			<thead>\
				<tr><th colspan="2">Host information - '+host_info.NAME+'</th></tr>\
			</thead>\
			<tr>\
				<td class="key_td">ID</td>\
				<td class="value_td">'+host_info.ID+'</td>\
			</tr>\
			<tr>\
				<td class="key_td">State</td>\
				<td class="value_td">'+OpenNebula.Helper.resource_state("host",host_info.STATE)+'</td>\
			</tr>\
			<tr>\
				<td class="key_td">Cluster</td>\
				<td class="value_td">'+host_info.CLUSTER+'</td>\
			</tr>\
			<tr>\
				<td class="key_td">IM MAD</td>\
				<td class="value_td">'+host_info.IM_MAD+'</td>\
			</tr>\
			<tr>\
				<td class="key_td">VM MAD</td>\
				<td class="value_td">'+host_info.VM_MAD+'</td>\
			</tr>\
			<tr>\
				<td class="key_td">TM MAD</td>\
				<td class="value_td">'+host_info.TM_MAD+'</td>\
			</tr>\
		</table>\
		<table id="host_shares_table" class="info_table">\
			<thead>\
				<tr><th colspan="2">Host shares</th></tr>\
			</thead>\
			<tr>\
				<td class="key_td">Max Mem</td>\
				<td class="value_td">'+humanize_size(host_info.HOST_SHARE.MAX_MEM)+'</td>\
			</tr>\
			<tr>\
				<td class="key_td">Used Mem (real)</td>\
				<td class="value_td">'+humanize_size(host_info.HOST_SHARE.USED_MEM)+'</td>\
			</tr>\
			<tr>\
				<td class="key_td">Used Mem (allocated)</td>\
				<td class="value_td">'+humanize_size(host_info.HOST_SHARE.MAX_USAGE)+'</td>\
			</tr>\
			<tr>\
				<td class="key_td">Used CPU (real)</td>\
				<td class="value_td">'+host_info.HOST_SHARE.USED_CPU+'</td>\
			</tr>\
			<tr>\
				<td class="key_td">Used CPU(allocated)</td>\
				<td class="value_td">'+host_info.HOST_SHARE.CPU_USAGE+'</td>\
			</tr>\
			<tr>\
				<td class="key_td">Running VMs</td>\
				<td class="value_td">'+host_info.HOST_SHARE.RUNNING_VMS+'</td>\
			</tr>\
		</table>\
	</div>\
	<div id="host_template">\
		<table id="host_template_table" class="info_table">\
		<thead><tr><th colspan="2">Host template</th></tr></thead>'+
		prettyPrintJSON(host_info.TEMPLATE)+
		'</table>\
	</div>\
</div>';
    popDialog(rendered_info);
    $('#host_informations').tabs();

    $('.host_info_action_button').button();
    //listen to buttons
    $('.host_info_action_button').click(function(){
		id = host_info.ID;
		action=$(this).val();

		switch (action){
			case "OpenNebula.Host.delete":
				$('#host_info_dialog').dialog("close");
				(eval(action)({data: {id: id},
					success: deleteHostElement,
					error: onError}));
				break;
			case "OpenNebula.Host.enable":
			case "OpenNebula.Host.disable":
				(eval(action)({  data:{id:id},
                                success: function(){
                                    updateBoth = function(req,res){
                                        updateHostElement(req,res);
                                        updateHostInfo(req,res);
                                    };
                                    OpenNebula.Host.show({data:{id: id},success: updateBoth, error: onError});

                                    },
                                error: onError}));
		}
		return false;
	});


}

// Used as an event method to the VM info tabs.
function fetch_log(event, ui) {
    if (ui.index == 2) //tab
    {
        var vm_id = $("#vm_log pre").attr('id').substr(10);
        OpenNebula.VM.log({ data: {id: vm_id},
                            success: function(req, res){
                                log_lines = res.split("\n");
                                var colored_log = '';
                                for (line in log_lines){
                                    line = log_lines[line];
                                    if (line.match(/\[E\]/)){
                                        line = '<span class="vm_log_error">'+line+'</span>'
                                    }
                                    colored_log += line + "\n";
                                }
                                $("#vm_log pre").html(colored_log);
                            },
                            error: function(request,error_json){
                                $("#vm_log pre").html('');
                                onError(request,error_json);
                            }
                        });
    }
}

function updateVMInfo(request,vm){
	vm_info = vm.VM;
	id = vm_info.ID;
	rendered_info =
'<div id="vm_informations">\
	<ul>\
		<li><a href="#info_vm">VM information</a></li>\
		<li><a href="#vm_template">VM template</a></li>\
        <li><a href="#vm_log">VM log</a></li>\
	</ul>\
	<div id="info_vm">\
		<table id="info_vm_table" class="info_table">\
			<thead>\
				<tr><th colspan="2">Virtual Machine information - '+vm_info.NAME+'</th></tr>\
			</thead>\
			<tr>\
				<td class="key_td">ID</td>\
				<td class="value_td">'+vm_info.ID+'</td>\
			</tr>\
			<tr>\
				<td class="key_td">Name</td>\
				<td class="value_td">'+vm_info.NAME+'</td>\
			</tr>\
			<tr>\
				<td class="key_td">State</td>\
				<td class="value_td">'+OpenNebula.Helper.resource_state("vm",vm_info.STATE)+'</td>\
			</tr>\
			<tr>\
				<td class="key_td">LCM State</td>\
				<td class="value_td">'+OpenNebula.Helper.resource_state("vm",vm_info.LCMSTATE)+'</td>\
			</tr>\
			<tr>\
				<td class="key_td">Start time</td>\
				<td class="value_td">'+pretty_time(vm_info.STIME)+'</td>\
			</tr>\
			<tr>\
				<td class="key_td">Deploy ID</td>\
				<td class="value_td">'+(typeof(vm_info.DEPLOY_ID) == "object" ? "-" : vm_info.DEPLOY_ID)+'</td>\
			</tr>\
		</table>\
		<table id="vm_monitoring_table" class="info_table">\
			<thead>\
				<tr><th colspan="2">Monitoring information</th></tr>\
			</thead>\
			<tr>\
				<td class="key_td">Net_TX</td>\
				<td class="value_td">'+vm_info.NET_TX+'</td>\
			</tr>\
			<tr>\
				<td class="key_td">Net_RX</td>\
				<td class="value_td">'+vm_info.NET_RX+'</td>\
			</tr>\
			<tr>\
				<td class="key_td">Used Memory</td>\
				<td class="value_td">'+humanize_size(vm_info.MEMORY)+'</td>\
			</tr>\
			<tr>\
				<td class="key_td">Used CPU</td>\
				<td class="value_td">'+vm_info.CPU+'</td>\
			</tr>\
		</table>\
	</div>\
	<div id="vm_template">\
		<table id="vm_template_table" class="info_table">\
		<thead><tr><th colspan="2">VM template</th></tr></thead>'+
		prettyPrintJSON(vm_info.TEMPLATE)+
		'</table>\
	</div>\
    <div id="vm_log"><h3>Virtual Machine Log - '+vm_info.NAME+'</h3>\
        <pre id="vm_log_id_'+vm_info.ID+'">'+spinner+'</pre>\
    </div>\
</div>';

    $('#vm_info_error',rendered_info).hide();
    popDialog(rendered_info);
    $('#vm_informations').tabs({select: fetch_log});

    /* Not used
	$('#vm_info_simple_action').button();


	$('#vm_info_simple_action').click(function(){
		action = $('#vm_info_opt_actions').val();
		if (!action.length) { return false; };
		(eval(action)(id,
			function(){OpenNebula.VM.show(id,updateVMInfo,onError)},
			function(request,error_json){
				$('#vm_info_error').html(
				'The request failed with the following error: '+
					error_json.error.message +
					'. Resource: '+ request.request.resource +
					'. Method: '+ request.request.method + '.');
				$('#vm_info_error').addClass("ui-state-error");
				$('#vm_info_error').show();

			}));
	});*/
}

function updateVNetworkInfo(request,vn){
	vn_info = vn.VNET;
	rendered_info =
'<div id="vn_informations">\
	<ul>\
		<li><a href="#info_vn">Virtual Network information</a></li>\
		<li><a href="#vn_template">Virtual Network template</a></li>\
	</ul>\
	<div id="info_vn">\
		<table id="info_vn_table" class="info_table">\
			<thead>\
				<tr><th colspan="2">Virtual Network '+vn_info.ID+' information</th></tr>\
			</thead>\
			<tr>\
				<td class="key_td">ID</td>\
				<td class="value_td">'+vn_info.ID+'</td>\
			</tr>\
			<tr>\
				<td class="key_td">UID</td>\
				<td class="value_td">'+vn_info.UID+'</td>\
			</tr>\
			<tr>\
				<td class="key_td">Public</td>\
				<td class="value_td">'+(parseInt(vn_info.PUBLIC) ? "yes" : "no" )+'</td>\
			</tr>\
		</table>';
    if (vn_info.TEMPLATE.TYPE == "FIXED"){
		rendered_info += '<table id="vn_leases_info_table" class="info_table">\
			<thead>\
				<tr><th colspan="2">Leases information</th></tr>\
			</thead>'+
			prettyPrintJSON(vn_info.LEASES)+
		'</table>';
    }
	rendered_info += '</div>\
	<div id="vn_template">\
		<table id="vn_template_table" class="info_table">\
		<thead><tr><th colspan="2">Virtual Network template</th></tr></thead>'+
		prettyPrintJSON(vn_info.TEMPLATE)+
		'</table>\
	</div>\
</div>';

    popDialog(rendered_info);
    $('#vn_informations').tabs();
}

function updateImageInfo(request,img){
    img_info = img.IMAGE;
    rendered_info =
'<div id="image_informations">\
    <ul>\
		<li><a href="#info_img">Image information</a></li>\
		<li><a href="#img_template">Image template</a></li>\
	</ul>\
    <div id="info_img">\
        <table id="info_img_table" class="info_table">\
			<thead>\
				<tr><th colspan="2">Image "'+img_info.NAME+'" information</th></tr>\
			</thead>\
			<tr>\
				<td class="key_td">ID</td>\
				<td class="value_td">'+img_info.ID+'</td>\
			</tr>\
			<tr>\
				<td class="key_td">Name</td>\
				<td class="value_td">'+img_info.NAME+'</td>\
			</tr>\
			<tr>\
				<td class="key_td">Type</td>\
				<td class="value_td">'+OpenNebula.Helper.image_type(img_info.TYPE)+'</td>\
			</tr>\
			<tr>\
				<td class="key_td">Register time</td>\
				<td class="value_td">'+pretty_time(img_info.REGTIME)+'</td>\
			</tr>\
			<tr>\
				<td class="key_td">Public</td>\
				<td class="value_td">'+(parseInt(img_info.PUBLIC) ? "yes" : "no")+'</td>\
			</tr>\
			<tr>\
				<td class="key_td">Persistent</td>\
				<td class="value_td">'+(parseInt(img_info.PERSISTENT) ? "yes" : "no")+'</td>\
			</tr>\
			<tr>\
				<td class="key_td">Source</td>\
				<td class="value_td">'+img_info.SOURCE+'</td>\
			</tr>\
			<tr>\
				<td class="key_td">State</td>\
				<td class="value_td">'+OpenNebula.Helper.resource_state("image",img_info.STATE)+'</td>\
			</tr>\
		</table>\
    </div>\
    <div id="img_template">\
		<table id="img_template_table" class="info_table">\
		<thead><tr><th colspan="2">Image template</th></tr></thead>'+
		prettyPrintJSON(img_info.TEMPLATE)+
		'</table>\
    </div>\
</div>';
    popDialog(rendered_info);
    $('#image_informations').tabs();
}

// Auxiliary functions
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
