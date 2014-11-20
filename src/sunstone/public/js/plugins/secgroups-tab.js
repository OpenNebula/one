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

/* ---------------- SecurityGroup tab plugin ---------------- */


//Prepares the dialog to create
function initialize_create_security_group_dialog(dialog){
    setupTips(dialog);

    dialog.on("change", '.security_group_rule_protocol', function(){
        switch ($(this).val()) {
        case "TCP":
        case "UDP":
            $('.range_row', dialog).show();
            $('.icmp_type_wrapper', dialog).hide();
            break;
        case "ICMP":
            $('.range_row', dialog).hide();
            $('.icmp_type_wrapper', dialog).show();
            break;
        case "IPSEC":
            $('.range_row', dialog).hide();
            $('.icmp_type_wrapper', dialog).hide();
            break;
        }
    });

    dialog.on("change", '.security_group_rule_network_sel', function(){
        switch ($(this).val()) {
        case "ANY":
            $('.security_group_rule_network',dialog).hide();
            $('.vnet_select',dialog).hide();
            break;
        case "NETWORK":
            $('.security_group_rule_network',dialog).show();
            $('.vnet_select',dialog).hide();
            break;
        case "VNET":
            $('.security_group_rule_network',dialog).hide();
            $('.vnet_select',dialog).show();

            refreshVNetTableSelect(dialog, "new_sg_rule");

            break;
        };
    });

    dialog.on("change", '.security_group_rule_range_sel', function(){
        switch ($(this).val()) {
        case "ALL":
            $('.security_group_rule_range', dialog).hide();
            break;
        case "RANGE":
            $('.security_group_rule_range', dialog).show();
            break;
        };
    });

    $(".add_security_group_rule", dialog).on("click", function(){
        var rule = {};

        rule["PROTOCOL"] = $(".security_group_rule_protocol", dialog).val();
        rule["RULE_TYPE"] = $(".security_group_rule_type", dialog).val();

        switch ($('.security_group_rule_range_sel', dialog).val()) {
        case "ALL":
            // TODO
            break;
        case "RANGE":
            rule["RANGE"] = $(".security_group_rule_range input", dialog).val();
            break;
        }

        switch ($('.security_group_rule_network_sel', dialog).val()) {
        case "ANY":
            // TODO
            break;
        case "NETWORK":
            rule["IP"] = $('#security_group_rule_first_ip', dialog).val();
            rule["SIZE"] = $('#security_group_rule_size', dialog).val();
            break;
        case "VNET":
            rule["NETWORK_ID"] = retrieveVNetTableSelect(dialog, "new_sg_rule");
            break;
        }

        if (rule["PROTOCOL"] == "ICMP" ){
            var icmp_type_val = $(".security_group_rule_icmp_type", dialog).val();

            if (icmp_type_val != ""){
                rule["ICMP_TYPE"] = icmp_type_val;
            }
        }

        var text = sg_rule_to_st(rule);

        $(".security_group_rules tbody", dialog).append(
            '<tr>\
              <td>'+text.PROTOCOL+'</td>\
              <td>'+text.RULE_TYPE+'</td>\
              <td>'+text.RANGE+'</td>\
              <td>'+text.NETWORK+'</td>\
              <td>'+text.ICMP_TYPE+'</td>\
              <td>\
                  <a href="#"><i class="fa fa-times-circle remove-tab"></i></a>\
              </td>\
            </tr>');

        // Add data to tr element
        $(".security_group_rules tbody", dialog).children("tr").last().data("rule", rule);

        // Reset new rule fields
        $('#new_rule_wizard select option', dialog).prop('selected', function() {
            return this.defaultSelected;
        });

        $('#new_rule_wizard select', dialog).trigger("change");

        $('#new_rule_wizard input', dialog).val("");

        resetResourceTableSelect(dialog, "new_sg_rule");
    });

    dialog.on("click", ".security_group_rules i.remove-tab", function(){
        var tr = $(this).closest('tr');
        tr.remove();
    });

    setupVNetTableSelect(dialog, "new_sg_rule");

    dialog.foundation();

    $('#new_rule_wizard select', dialog).trigger("change");

    $('#create_security_group_form_wizard',dialog).on('invalid', function () {
        notifyError(tr("One or more required fields are missing or malformed."));
        popFormDialog("create_security_group_form", $("#secgroups-tab"));
    }).on('valid', function() {

        security_group_json = generate_json_security_group_from_form(this);

        if ($('#create_security_group_form_wizard',dialog).attr("action") == "create") {

            var security_group_json = {
                "security_group" : security_group_json
            };

            Sunstone.runAction("SecurityGroup.create",security_group_json);
            return false;
        } else if ($('#create_security_group_form_wizard',dialog).attr("action") == "update") {
            delete security_group_json["NAME"];

            Sunstone.runAction(
                "SecurityGroup.update",
                sg_to_update_id,
                convert_template_to_string(security_group_json));

            return false;
        }
    });

    $('#create_security_group_form_advanced',dialog).on('invalid.fndtn.abide', function () {
        notifyError(tr("One or more required fields are missing or malformed."));
        popFormDialog("create_security_group_form", $("#secgroups-tab"));
    }).on('valid.fndtn.abide', function() {
        if ($('#create_security_group_form_advanced',dialog).attr("action") == "create") {

            var template = $('textarea#template',dialog).val();
            var security_group_json = {security_group: {security_group_raw: template}};
            Sunstone.runAction("SecurityGroup.create",security_group_json);
            return false;

        } else if ($('#create_security_group_form_advanced',dialog).attr("action") == "update") {
            var template_raw = $('textarea#template',dialog).val();

            Sunstone.runAction("SecurityGroup.update",sg_to_update_id,template_raw);
            return false;
        }
    });
}

function generate_json_security_group_from_form(dialog) {
    var name = $('#security_group_name', dialog).val();
    var description = $('#security_group_description', dialog).val();

    var rules =  [];

    $(".security_group_rules tbody tr").each(function(){
        rules.push($(this).data("rule"));
    });

    var security_group_json = {
        "NAME" : name,
        "DESCRIPTION": description,
        "RULE" : rules
    };

    return security_group_json;
}

function fillSecurityGroupUpdateFormPanel(sg, dialog){

    // Populates the Avanced mode Tab
    $('#template',dialog).val(convert_template_to_string(sg.TEMPLATE).replace(/^[\r\n]+$/g, ""));

    $('#security_group_name',dialog).val(
        escapeDoubleQuotes(htmlDecode( sg.NAME ))).
        prop("disabled", true);

    $('#security_group_description', dialog).val(
        escapeDoubleQuotes(htmlDecode( sg.TEMPLATE.DESCRIPTION ))
    );

    var rules = sg.TEMPLATE.RULE;

    if (!rules) //empty
    {
        rules = [];
    }
    else if (rules.constructor != Array) //>1 rule
    {
        rules = [rules];
    }

    $.each(rules, function(){
        var text = sg_rule_to_st(this);

        $(".security_group_rules tbody", dialog).append(
            '<tr>\
              <td>'+text.PROTOCOL+'</td>\
              <td>'+text.RULE_TYPE+'</td>\
              <td>'+text.RANGE+'</td>\
              <td>'+text.NETWORK+'</td>\
              <td>'+text.ICMP_TYPE+'</td>\
              <td>\
                  <a href="#"><i class="fa fa-times-circle remove-tab"></i></a>\
              </td>\
            </tr>');

        $(".security_group_rules tbody", dialog).children("tr").last().data("rule", this);
    });
}

// Security Group clone dialog
function setupSecurityGroupCloneDialog(){
    //Append to DOM
    dialogs_context.append('<div id="security_group_clone_dialog""></div>');
    var dialog = $('#security_group_clone_dialog',dialogs_context);

    //Put HTML in place

    var html = '<div class="row">\
        <h3 class="subheader">'+tr("Clone Security Group")+'</h3>\
      </div>\
      <form>\
      <div class="row">\
        <div class="large-12 columns">\
          <div class="clone_one"></div>\
          <div class="clone_several">'+tr("Several security groups are selected, please choose a prefix to name the new copies")+'<br></div>\
        </div>\
      </div>\
      <div class="row">\
        <div class="large-12 columns">\
          <label class="clone_one">'+tr("Name")+'</label>\
          <label class="clone_several">'+tr("Prefix")+'</label>\
          <input type="text" name="name"></input>\
        </div>\
      </div>\
      <div class="form_buttons row">\
        <button class="button radius right" id="security_group_clone_button" value="SecurityGroup.clone">\
      '+tr("Clone")+'\
        </button>\
              </div>\
      <a class="close-reveal-modal">&#215;</a>\
      </form>\
      ';


    dialog.html(html);
    dialog.addClass("reveal-modal").attr("data-reveal", "");

    $('form',dialog).submit(function(){
        var name = $('input', this).val();
        var sel_elems = securityGroupElements();
        if (!name || !sel_elems.length)
            notifyError('A name or prefix is needed!');
        if (sel_elems.length > 1){
            for (var i=0; i< sel_elems.length; i++)
                //use name as prefix if several items selected
                Sunstone.runAction('SecurityGroup.clone',
                                   sel_elems[i],
                                   name+getSecurityGroupName(sel_elems[i]));
        } else {
            Sunstone.runAction('SecurityGroup.clone',sel_elems[0],name)
        };
        $(this).parents('#security_group_clone_dialog').foundation('reveal', 'close')
        setTimeout(function(){
            Sunstone.runAction('SecurityGroup.refresh');
        }, 1500);
        return false;
    });
}

function popUpSecurityGroupCloneDialog(){
    var dialog = $('#security_group_clone_dialog');
    var sel_elems = securityGroupElements();
    //show different text depending on how many elements are selected
    if (sel_elems.length > 1){
        $('.clone_one',dialog).hide();
        $('.clone_several',dialog).show();
        $('input',dialog).val('Copy of ');
    }
    else {
        $('.clone_one',dialog).show();
        $('.clone_several',dialog).hide();
        $('input',dialog).val('Copy of '+getSecurityGroupName(sel_elems[0]));
    };

    $(dialog).foundation().foundation('reveal', 'open');
    $("input[name='name']",dialog).focus();
}


var create_security_group_wizard_html =
'<form data-abide="ajax" id="create_security_group_form_wizard" action="">\
  <div class="row">\
    <div class="medium-4 columns">\
      <label for="security_group_name">'+tr("Security Group Name")+':</label>\
      <input required type="text" name="security_group_name" id="security_group_name"/>\
    </div>\
    <div class="medium-8 columns">\
      <label for="security_group_description">'+tr("Description")+'\
        <span class="tip">'+tr("Description for the Security Group")+'</span>\
      </label>\
      <textarea type="text" id="security_group_description" name="security_group_description" style="height: 70px;"/>\
    </div>\
  </div>\
  <hr/>\
  <div class="row collapse" id="new_rule_wizard">\
    <div class="row">\
      <div class="medium-4 columns">\
        <label>'+tr("Type")+'\
          <span class="tip">'+tr("TODO")+'</span>\
        </label>\
        <select class="security_group_rule_type">\
          <option value="inbound" selected="selected">'+tr("Inbound")+'</option>\
          <option value="outbound">'+tr("Outbound")+'</option>\
        </select>\
      </div>\
      <div class="medium-4 columns">\
        <label>'+tr("Protocol")+'\
          <span class="tip">'+tr("TODO")+'</span>\
        </label>\
        <select class="security_group_rule_protocol">\
          <option value="TCP" selected="selected">'+tr("TCP")+'</option>\
          <option value="UDP">'+tr("UDP")+'</option>\
          <option value="ICMP">'+tr("ICMP")+'</option>\
          <option value="IPSEC">'+tr("IPsec")+'</option>\
        </select>\
      </div>\
      <div class="medium-4 columns icmp_type_wrapper">\
        <label>'+tr("ICMP Type")+'\
          <span class="tip">'+tr("TODO")+'</span>\
        </label>\
        <select class="security_group_rule_icmp_type">\
          <option value="" selected="selected">'+tr("All")+'</option>\
          <option value = "0">'+"0: Echo Reply"+'</option>\
          <option value = "3">'+"3: Destination Unreachable"+'</option>\
          <option value = "4">'+"4: Source Quench"+'</option>\
          <option value = "5">'+"5: Redirect"+'</option>\
          <option value = "6">'+"6: Alternate Host Address"+'</option>\
          <option value = "8">'+"8: Echo"+'</option>\
          <option value = "9">'+"9: Router Advertisement"+'</option>\
          <option value = "10">'+"10: Router Solicitation"+'</option>\
          <option value = "11">'+"11: Time Exceeded"+'</option>\
          <option value = "12">'+"12: Parameter Problem"+'</option>\
          <option value = "13">'+"13: Timestamp"+'</option>\
          <option value = "14">'+"14: Timestamp Reply"+'</option>\
          <option value = "15">'+"15: Information Request"+'</option>\
          <option value = "16">'+"16: Information Reply"+'</option>\
          <option value = "17">'+"17: Address Mask Request"+'</option>\
          <option value = "18">'+"18: Address Mask Reply"+'</option>\
          <option value = "30">'+"30: Traceroute"+'</option>\
          <option value = "31">'+"31: Datagram Conversion Error"+'</option>\
          <option value = "32">'+"32: Mobile Host Redirect"+'</option>\
          <option value = "33">'+"33: IPv6 Where-Are-You"+'</option>\
          <option value = "34">'+"34: IPv6 I-Am-Here"+'</option>\
          <option value = "35">'+"35: Mobile Registration Request"+'</option>\
          <option value = "36">'+"36: Mobile Registration Reply"+'</option>\
          <option value = "37">'+"37: Domain Name Request"+'</option>\
          <option value = "38">'+"38: Domain Name Reply"+'</option>\
          <option value = "39">'+"39: SKIP"+'</option>\
          <option value = "40">'+"40: Photuris"+'</option>\
          <option value = "41">'+"41: ICMP messages utilized by experimental mobility protocols such as Seamoby"+'</option>\
          <option value = "253">'+"253: RFC3692-style Experiment 1"+'</option>\
          <option value = "254">'+"254: RFC3692-style Experiment 2"+'</option>\
        </select>\
      </div>\
    </div>\
    <div class="row range_row">\
      <div class="medium-4 columns">\
        <label>'+tr("Port range")+'\
          <span class="tip">'+tr("TODO")+'</span>\
        </label>\
        <select class="security_group_rule_range_sel">\
          <option value="ALL" selected="selected">'+tr("All")+'</option>\
          <option value="RANGE">'+tr("Port range")+'</option>\
        </select>\
      </div>\
      <div class="medium-4 columns end security_group_rule_range">\
        <label>'+tr("Iptables range")+'\
          <span class="tip">'+tr("TODO")+'</span>\
        </label>\
        <input type="text"/>\
      </div>\
    </div>\
    <div class="row">\
      <div class="medium-4 columns">\
        <label>'+tr("Network")+'\
          <span class="tip">'+tr("TODO")+'</span>\
        </label>\
        <select class="security_group_rule_network_sel">\
          <option value="ANY" selected="selected">'+tr("Any")+'</option>\
          <option value="NETWORK">'+tr("Network")+'</option>\
          <option value="VNET">'+tr("Virtual Network")+'</option>\
        </select>\
      </div>\
      <div class="medium-4 columns security_group_rule_network">\
        <label for="security_group_rule_first_ip">'+tr("IP Start")+':\
          <span class="tip">'+tr("First IP address")+'</span>\
        </label>\
        <input id="security_group_rule_first_ip" type="text"/>\
      </div>\
      <div class="medium-4 columns security_group_rule_network">\
        <label for="security_group_rule_size">'+tr("Size")+':\
          <span class="tip">'+tr("Number of addresses in the range")+'</span>\
        </label>\
        <input id="security_group_rule_size" type="text"/>\
      </div>\
    </div>\
    <div class="row">\
      <div class="small-12 columns vnet_select">\
        '+generateVNetTableSelect("new_sg_rule")+'\
        </br>\
      </div>\
    </div>\
  </div>\
  <div class="row">\
    <div class="medium-8 small-centered columns">\
      <a type="button" class="add_security_group_rule button small small-12 radius"><i class="fa fa-angle-double-down"></i> '+tr("Add Rule")+'</a>\
    </div>\
  </div>\
  <div class="row">\
    <div class="large-12 columns">\
      <table class="security_group_rules policies_table dataTable">\
        <thead>\
          <tr>\
            <th>'+tr("Protocol")+'</th>\
            <th>'+tr("Type")+'</th>\
            <th>'+tr("Port Range")+'</th>\
            <th>'+tr("Network")+'</th>\
            <th>'+tr("ICMP Type")+'</th>\
            <th style="width:3%"></th>\
          </tr>\
        </thead>\
        <tbody>\
        </tbody>\
      </table>\
    </div>\
  </div>\
</form>';

var create_security_group_advanced_html =
 '<form data-abide="ajax" id="create_security_group_form_advanced" class="custom creation">' +
    '<div class="row">' +
      '<div class="large-12 columns">' +
        '<p>'+tr("Write the Security Group template here")+'</p>' +
      '</div>' +
    '</div>' +
    '<div class="row">' +
      '<div class="large-12 columns">' +
        '<textarea id="template" rows="15" required></textarea>' +
      '</div>' +
    '</div>' +
  '</form>';


var dataTable_security_groups;
var $create_security_group_dialog;

//Setup actions
var security_group_actions = {

    "SecurityGroup.create" : {
        type: "create",
        call: OpenNebula.SecurityGroup.create,
        callback: function(request, response){
            $("a[href=back]", $("#secgroups-tab")).trigger("click");
            popFormDialog("create_security_group_form", $("#secgroups-tab"));

            addSecurityGroupElement(request, response);
            notifyCustom(tr("Security Group created"), " ID: " + response.SECURITY_GROUP.ID, false);
        },
        error: function(request, response){
            popFormDialog("create_security_group_form", $("#secgroups-tab"));
            onError(request, response);
        }
    },

    "SecurityGroup.create_dialog" : {
        type: "custom",
        call: function(){
          Sunstone.popUpFormPanel("create_security_group_form", "secgroups-tab", "create", true);
        }
    },

    "SecurityGroup.list" : {
        type: "list",
        call: OpenNebula.SecurityGroup.list,
        callback: updateSecurityGroupsView,
        error: onError
    },

    "SecurityGroup.show" : {
        type: "single",
        call: OpenNebula.SecurityGroup.show,
        callback: function(request, response){
            var tab = dataTable_security_groups.parents(".tab");

            if (Sunstone.rightInfoVisible(tab)) {
                // individual view
                updateSecurityGroupInfo(request, response);
            }

            // datatable row
            updateSecurityGroupElement(request, response);
        },
        error: onError
    },

    "SecurityGroup.refresh" : {
        type: "custom",
        call: function(){
          var tab = dataTable_security_groups.parents(".tab");
          if (Sunstone.rightInfoVisible(tab)) {
            Sunstone.runAction("SecurityGroup.show", Sunstone.rightInfoResourceId(tab))
          } else {
            waitingNodes(dataTable_security_groups);
            Sunstone.runAction("SecurityGroup.list", {force: true});
          }
        },
        error: onError
    },

    "SecurityGroup.delete" : {
        type: "multiple",
        call : OpenNebula.SecurityGroup.del,
        callback : deleteSecurityGroupElement,
        elements: securityGroupElements,
        error : onError,
        notify:true
    },

    "SecurityGroup.update_dialog" : {
        type: "custom",
        call: function(){
            var selected_nodes = securityGroupElements();
            if ( selected_nodes.length != 1 ) {
                notifyMessage("Please select one (and just one) Security Group to update.");
                return false;
            }

            var resource_id = ""+selected_nodes[0];
            Sunstone.runAction("SecurityGroup.show_to_update", resource_id);
        }
    },

    "SecurityGroup.show_to_update" : {
        type: "single",
        call: OpenNebula.SecurityGroup.show,
        callback: function(request, response) {
            // TODO: global var, better use jquery .data
            sg_to_update_id = response.SECURITY_GROUP.ID;

            Sunstone.popUpFormPanel("create_security_group_form", "secgroups-tab", "create", true);

            Sunstone.popUpFormPanel("create_security_group_form", "secgroups-tab", "update", true, function(context){
                fillSecurityGroupUpdateFormPanel(response.SECURITY_GROUP, context);
            });
        },
        error: onError
    },

    "SecurityGroup.update" : {
        type: "single",
        call: OpenNebula.SecurityGroup.update,
        callback: function(request, response){
            $("a[href=back]", $("#secgroups-tab")).trigger("click");
            popFormDialog("create_security_group_form", $("#secgroups-tab"));

            notifyMessage(tr("Security Group updated correctly"));
        },
        error: function(request, response){
            popFormDialog("create_security_group_form", $("#secgroups-tab"));

            onError(request, response);
        }
    },

    "SecurityGroup.update_template" : {  // Update template
        type: "single",
        call: OpenNebula.SecurityGroup.update,
        callback: function(request,response){
           Sunstone.runAction('SecurityGroup.show',request.request.data[0][0]);
        },
        error: onError
    },

    "SecurityGroup.chown" : {
        type: "multiple",
        call: OpenNebula.SecurityGroup.chown,
        callback: function(req) {
          Sunstone.runAction("SecurityGroup.show",req.request.data[0]);
        },
        elements: securityGroupElements,
        error:onError
    },

    "SecurityGroup.chgrp" : {
        type: "multiple",
        call: OpenNebula.SecurityGroup.chgrp,
        callback: function(req) {
          Sunstone.runAction("SecurityGroup.show",req.request.data[0]);
        },
        elements: securityGroupElements,
        error:onError
    },

    "SecurityGroup.chmod" : {
        type: "single",
        call: OpenNebula.SecurityGroup.chmod,
        callback: function(req) {
          Sunstone.runAction("SecurityGroup.show",req.request.data[0][0]);
        },
        error: onError
    },

    "SecurityGroup.clone_dialog" : {
        type: "custom",
        call: popUpSecurityGroupCloneDialog
    },

    "SecurityGroup.clone" : {
        type: "single",
        call: OpenNebula.SecurityGroup.clone,
        error: onError,
        notify: true
    },

    "SecurityGroup.rename" : {
        type: "single",
        call: OpenNebula.SecurityGroup.rename,
        callback: function(request) {
            notifyMessage(tr("Security Group renamed correctly"));
            Sunstone.runAction('SecurityGroup.show',request.request.data[0][0]);
        },
        error: onError,
        notify: true
    }
};

var security_group_buttons = {
    "SecurityGroup.refresh" : {
        type: "action",
        layout: "refresh",
        alwaysActive: true
    },
    "SecurityGroup.create_dialog" : {
        type: "create_dialog",
        layout: "create"
    },
    "SecurityGroup.update_dialog" : {
        type: "action",
        layout: "main",
        text: tr("Update")
    },
    "SecurityGroup.chown" : {
        type: "confirm_with_select",
        text: tr("Change owner"),
        layout: "user_select",
        select: "User",
        tip: tr("Select the new owner")+":",
        condition: mustBeAdmin
    },
    "SecurityGroup.chgrp" : {
        type: "confirm_with_select",
        text: tr("Change group"),
        layout: "user_select",
        select: "Group",
        tip: tr("Select the new group")+":",
        condition: mustBeAdmin
    },
    "SecurityGroup.clone_dialog" : {
        type: "action",
        layout: "main",
        text: tr("Clone")
    },
    "SecurityGroup.delete" : {
        type: "confirm",
        layout: "del",
        text: tr("Delete")
    }
};

var security_groups_tab = {
    title: tr("Security Groups"),
    resource: 'SecurityGroup',
    buttons: security_group_buttons,
    tabClass: "subTab",
    parentTab: "infra-tab",
    search_input: '<input id="security_group_search" type="text" placeholder="'+tr("Search")+'" />',
    list_header: '<i class="fa fa-fw fa-shield"></i>&emsp;'+tr("Security Groups"),
    info_header: '<i class="fa fa-fw fa-shield"></i>&emsp;'+tr("Security Group"),
    subheader: '<span/> <small></small>&emsp;',
    table: '<table id="datatable_security_groups" class="datatable twelve">\
      <thead>\
        <tr>\
          <th class="check"><input type="checkbox" class="check_all" value=""></input></th>\
          <th>' + tr("ID")   + '</th>\
          <th>' + tr("Owner")+ '</th>\
          <th>' + tr("Group")+ '</th>\
          <th>' + tr("Name") + '</th>\
        </tr>\
      </thead>\
      <tbody id="tbodysecurity_groups">\
      </tbody>\
    </table>',
    forms: {
      "create_security_group_form": {
        actions: {
            create: {
                title: tr("Create Security Group"),
                submit_text: tr("Create")
            },
            update: {
                title: tr("Update Security Group"),
                submit_text: tr("Update"),
                reset_button: false
            }
        },
        wizard_html: create_security_group_wizard_html,
        advanced_html: create_security_group_advanced_html,
        setup: initialize_create_security_group_dialog
      }
    }
};

var security_group_info_panel = {
    "security_group_info_tab" : {
        title: tr("Security Group information"),
        content:""
    }
};

Sunstone.addActions(security_group_actions);
Sunstone.addMainTab('secgroups-tab',security_groups_tab);
Sunstone.addInfoPanel("security_group_info_panel",security_group_info_panel);

//return lists of selected elements in security_group list
function securityGroupElements(){
    return getSelectedNodes(dataTable_security_groups);
}

function securityGroupElementArray(element_json){

    var element = element_json.SECURITY_GROUP;

    return [
        '<input class="check_item" type="checkbox" id="security_group_'+element.ID+'" name="selected_items" value="'+element.ID+'"/>',
        element.ID,
        element.UNAME,
        element.GNAME,
        element.NAME
    ];
}

//callback for an action affecting a security_group element
function updateSecurityGroupElement(request, element_json){
    var id = element_json.SECURITY_GROUP.ID;
    var element = securityGroupElementArray(element_json);
    updateSingleElement(element,dataTable_security_groups,'#security_group_'+id);
}

//callback for actions deleting a security_group element
function deleteSecurityGroupElement(req){
    deleteElement(dataTable_security_groups,'#security_group_'+req.request.data);
    $('div#security_group_tab_'+req.request.data,main_tabs_context).remove();
}

//call back for actions creating a security_group element
function addSecurityGroupElement(request,element_json){
    var id = element_json.SECURITY_GROUP.ID;
    var element = securityGroupElementArray(element_json);
    addElement(element,dataTable_security_groups);
}

//callback to update the list of security_groups.
function updateSecurityGroupsView (request,list){
    var list_array = [];

    $.each(list,function(){
        //Grab table data from the list
        list_array.push(securityGroupElementArray(this));
    });

    updateView(list_array,dataTable_security_groups);
};


// Updates the security_group info panel tab content and pops it up
function updateSecurityGroupInfo(request,security_group){
    security_group_info     = security_group.SECURITY_GROUP;
    security_group_template = security_group_info.TEMPLATE;

    stripped_security_group_template = $.extend({}, security_group_info.TEMPLATE);
    delete stripped_security_group_template["RULE"];

    var hidden_values = {RULE: security_group_info.TEMPLATE.RULE};

    //Information tab
    var info_tab = {
        title : tr("Info"),
        icon: "fa-info-circle",
        content :
        '<div class="row">\
        <div class="large-6 columns">\
        <table id="info_security_group_table" class="dataTable extended_table">\
            <thead>\
               <tr><th colspan="3">' + tr("Information") +'</th></tr>\
            </thead>\
            <tbody>\
            <tr>\
                <td class="key_td">' + tr("ID") + '</td>\
                <td class="value_td" colspan="2">'+security_group_info.ID+'</td>\
            </tr>'+
            insert_rename_tr(
                'secgroups-tab',
                "SecurityGroup",
                security_group_info.ID,
                security_group_info.NAME)+
            '</tbody>\
         </table>\
        </div>\
        <div class="large-6 columns">' +
            insert_permissions_table('secgroups-tab',
                                       "SecurityGroup",
                                       security_group_info.ID,
                                       security_group_info.UNAME,
                                       security_group_info.GNAME,
                                       security_group_info.UID,
                                       security_group_info.GID) +
        '</div>\
        </div>\
        <div class="row">\
          <div class="large-9 columns">\
            <table class="dataTable extended_table">\
              <thead>\
                <tr>\
                  <th>'+tr("Rules")+'</th>\
                </tr>\
              </thead>\
            </table>'
            + insert_sg_rules_table(security_group_info) +
         '</div>\
        <div class="row">\
          <div class="large-9 columns">'
                  + insert_extended_template_table(stripped_security_group_template,
                                           "SecurityGroup",
                                           security_group_info.ID,
                                           tr("Attributes"),
                                           hidden_values) +
         '</div>\
        </div>'
    }

    //Sunstone.updateInfoPanelTab(info_panel_name,tab_name, new tab object);
    Sunstone.updateInfoPanelTab("security_group_info_panel","security_group_info_tab",info_tab);

    Sunstone.popUpInfoPanel("security_group_info_panel", "secgroups-tab");

    setPermissionsTable(security_group_info,'');
}

function insert_sg_rules_table(sg){
    var html = 
      '<table class="policies_table dataTable">\
        <thead>\
          <tr>\
            <th>'+tr("Protocol")+'</th>\
            <th>'+tr("Type")+'</th>\
            <th>'+tr("Port Range")+'</th>\
            <th>'+tr("Network")+'</th>\
            <th>'+tr("ICMP Type")+'</th>\
          </tr>\
        </thead>\
        <tbody>';

    var rules = sg.TEMPLATE.RULE;

    if (!rules) //empty
    {
        rules = [];
    }
    else if (rules.constructor != Array) //>1 rule
    {
        rules = [rules];
    }

    $.each(rules, function(){
        var text = sg_rule_to_st(this);
        html +=
          '<tr>\
            <td>'+text.PROTOCOL+'</td>\
            <td>'+text.RULE_TYPE+'</td>\
            <td>'+text.RANGE+'</td>\
            <td>'+text.NETWORK+'</td>\
            <td>'+text.ICMP_TYPE+'</td>\
          </tr>'
    });


    html +=
        '</tbody>\
      </table>';

    return html;
}

//This is executed after the sunstone.js ready() is run.
//Here we can basicly init the security_group datatable, preload it
//and add specific listeners
$(document).ready(function(){
    var tab_name = "secgroups-tab"

    if (Config.isTabEnabled(tab_name)) {
      //prepare security_group datatable
      dataTable_security_groups = $("#datatable_security_groups",main_tabs_context).dataTable({
          "bSortClasses": false,
          "bDeferRender": true,
          "aoColumnDefs": [
              { "bSortable": false, "aTargets": ["check"] },
              { "sWidth": "35px", "aTargets": [0] },
              { "bVisible": true, "aTargets": Config.tabTableColumns(tab_name)},
              { "bVisible": false, "aTargets": ['_all']}
          ]
      });

      $('#security_group_search').keyup(function(){
        dataTable_security_groups.fnFilter( $(this).val() );
      })

      dataTable_security_groups.on('draw', function(){
        recountCheckboxes(dataTable_security_groups);
      })

      Sunstone.runAction("SecurityGroup.list");

      setupSecurityGroupCloneDialog();

      dialogs_context.append('<div id="create_security_group_dialog"></div>');

      initCheckAllBoxes(dataTable_security_groups);
      tableCheckboxesListener(dataTable_security_groups);
      infoListener(dataTable_security_groups, "SecurityGroup.show");
      dataTable_security_groups.fnSort( [ [1,config['user_config']['table_order']] ] );
    }
});
