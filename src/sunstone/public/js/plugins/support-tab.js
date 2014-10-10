// ------------------------------------------------------------------------ //
// Copyright 2010-2014, C12G Labs S.L.                                      //
//                                                                          //
// Licensed under the Apache License, Version 2.0 (the "License"); you may  //
// not use this file except in compliance with the License. You may obtain  //
// a copy of the License at                                                 //
//                                                                          //
// http://www.apache.org/licenses/LICENSE-2.0                               //
//                                                                          //
// Unless required by applicable law or agreed to in writing, software      //
// distributed under the License is distributed on an "AS IS" BASIS,        //
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. //
// See the License for the specific language governing permissions and      //
// limitations under the License.                                           //
//------------------------------------------------------------------------- //

var create_support_request_wizard_html =
 '<form data-abide="ajax" id="create_support_request_form_wizard" class="custom creation">' +
    '<div class="row">' +
      '<div class="large-6 columns">' +
        '<label for="subject">' + tr("Subject") + '</label>' +
        '<input id="subject" type="text" required></input>' +
      '</div>' +
      '<div class="large-6 columns">' +
        '<label for="opennebula_version">' + tr("OpenNebula Version") + '</label>' +
        '<input id="opennebula_version" type="text" required></input>' +
      '</div>' +
    '</div>' +
    '<div class="row">' +
      '<div class="large-12 columns">' +
        '<label for="description">' + tr("Description") + '</label>' +
        '<textarea id="description" rows="5" placeholder="'+tr("Please enter the details of your request. A member of our support staff will respond as soon as possible.") + '" required></textarea>' +
      '</div>' +
    '</div>' +
    '<div class="row">' +
      '<div class="large-12 columns">' +
        '<label for="severity">' + tr("Subject") + '</label>' +
        '<select id="severity" name="severity">'+
            '<option value="severity_1">'+tr("Severity 1. Product Error: Catastrophic problem in running production systems")+'</option>'+
            '<option value="severity_2">'+tr("Severity 2. Product Error: High-impact problem in running production systems")+'</option>'+
            '<option value="severity_3">'+tr("Severity 3. Product Error: Low impact problem on a running production system ")+'</option>'+
            '<option value="severity_4" selected>'+tr("Severity 4. Usage, Design, Configuration, or Integration Question")+'</option>'+
        '</select>'+
      '</div>' +
    '</div>' +
  '</form>';

var support_actions = {
    "Support.list" : {
        type: "list",
        call: OpenNebula.Support.list,
        callback: function(req, list, res){
            console.log(list)
            $(".support_info").show();
            $(".support_connect").hide();
            $(".actions_row", "#support-tab").show();
            $("#dataTable_support_wrapper").show();
            $(".support_open_value").text(res.open_requests);
            $(".support_pending_value").text(res.pending_requests);
            updateView(list, dataTable_support);
        },
        error: function(request, error_json) {
            $(".support_info").hide();
            $("#dataTable_support_wrapper").hide();
            $(".support_connect").show();
            $(".actions_row", "#support-tab").hide();
        }
    },
    "Support.refresh" : {
        type: "custom",
        call: function () {
          var tab = dataTable_support.parents(".tab");
          if (Sunstone.rightInfoVisible(tab)) {
            Sunstone.runAction("Support.show", Sunstone.rightInfoResourceId(tab))
          } else {
            waitingNodes(dataTable_support);
            Sunstone.runAction("Support.list");
          }
        }
    },
    "Support.show" : {
        type: "single",
        call: OpenNebula.Support.show,
        callback: function(request, response) {
//            updateMarketElement(request, response);
            if (Sunstone.rightInfoVisible($("#support-tab"))) {
                updateSupportInfo(request, response);
            }
        },
        error: onError
    },
    "Support.create" : {
        type: "create",
        call: OpenNebula.Support.create,
        callback: function(request, response){
          $("a[href=back]", $("#support-tab")).trigger("click");
          popFormDialog("create_support_request_form", $("#support-tab"));

          $("a.refresh", $("#support-tab")).trigger("click");
          //addTemplateElement(request, response);
          //notifyCustom(tr("Request created"), " ID: " + response.VMTEMPLATE.ID, false)
        },
        error: function(request, response){
          popFormDialog("create_support_request_form", $("#support-tab"));
          $("a[href=back]", $("#support-tab")).trigger("click");
          $(".support_info").hide();
          $(".support_connect").show();

          onError(request, response);
        }

    },

    "Support.create_dialog" : {
        type: "custom",
        call: function(){
          Sunstone.popUpFormPanel(
            "create_support_request_form", 
            "support-tab", 
            "create", 
            false, 
            function(context){});
        }
    },

    "Support.update" : {
        type: "single",
        call: OpenNebula.Support.update,
        callback: function(request, response){
          $("a.refresh", $("#support-tab")).trigger("click");
          notifyMessage(tr("Comment added correctly"));
        },
        error: function(request, response){
          popFormDialog("create_template_form", $("#templates-tab"));

          onError(request, response);
        }
    },
}

var support_buttons = {
    "Support.refresh" : {
        type: "action",
        layout: "refresh",
        text: '<i class="fa fa-refresh fa fa-lg">',
        alwaysActive: true
    },
    "Support.create_dialog" : {
        type: "create_dialog",
        layout: "create",
        text: tr('Submit a Request')
    }
};

var support_tab = {
    //title: '<i class="fa fa-lg fa-fw fa-support"></i>&emsp;'+tr("Support"),
    title: 
    '<span class="support_title"><i class="fa fa-lg fa-fw fa-support"></i> ' + tr("Support") + '</span>' +
    '<br>'+
    '<div class="support_info" style="display: none;">'+
      '<span class="support_open">Open</span><span class="label secondary right support_open_value">-</span>'+
      '<br>'+
      '<span class="support_pending">Pending</span><span class="label right support_pending_value">-</span>'+
      '<br>'+
      '<button class="button tiny success radius support_button">'+tr("Submit a Request")+'</button>'+
    '</div>'+
    '<div class="support_connect" style="display: none;">'+
      '<span class="">Not connected</span>'+
      '<br>'+
      '<button class="button tiny success radius support_connect_button">'+tr("Sign in")+'</button>'+
    '</div>',
    table: '<table id="dataTable_support" class="datatable twelve support_info">\
        <thead>\
          <tr>\
            <th class="check"></th>\
            <th>'+tr("ID")+'</th>\
            <th>'+tr("Subject")+'</th>\
            <th>'+tr("Requested")+'</th>\
            <th>'+tr("Status")+'</th>\
          </tr>\
        </thead>\
        <tbody id="tbodysupport">\
        </tbody>\
      </table>',
    buttons: support_buttons,
    search_input: '<input id="support_search" type="text" placeholder="'+tr("Search")+'" />',
    list_header: '<i class="fa fa-fw fa-support"></i> '+tr("Commercial Support Requests"),
    info_header: '<i class="fa fa-fw fa-support"></i> '+tr("Commercial Support Request"),
    subheader: '<div class="row text-left support_connect">'+
        '<div class="large-6 columns" style="font-">'+
          '<p>'+tr("The Support Subscription provides expert integration and production support on supported platforms and include:")+'</p>'+
          '<ul class="fa-ul" style="font-size: 14px;">'+
            '<li><i class="fa-li fa fa-check"></i>'+tr("Problem diagnosis, resolution and bug fixing")+'</li>'+
            '<li><i class="fa-li fa fa-check"></i>'+tr("Solving unexpected problems when using, installing or configuring the software")+'</li>'+
            '<li><i class="fa-li fa fa-check"></i>'+tr("Guidance about tuning for optimal and scalable performance in your environment")+'</li>'+
            '<li><i class="fa-li fa fa-check"></i>'+tr("Answering “how to” questions related to standard and intended product usage")+'</li>'+
            '<li><i class="fa-li fa fa-check"></i>'+tr("Offering hints about how to go around missing features")+'</li>'+
            '<li><i class="fa-li fa fa-check"></i>'+tr("Answering questions about product adaptation and integration")+'</li>'+
          '</ul>'+
          '<p>'+ tr("For more info on support subcriptions") + ', <a href="http://c12g.com/support/" target="_blank">'+tr("click here")+'</a></p>' +
        '</div>'+
        '<div class="large-6 columns" style="padding: 0px 50px;">'+
          '<fieldset>'+
          '<legend>'+tr("Commercial Support")+"</legend>"+
          '<form id="support_credentials_form">'+
            '<div class="large-12 columns">'+
                '<label for="support_email">' + tr("Email") + '</label>' +
                '<input id="support_email" type="text"></input>' +
            '</div>'+
            '<div class="large-12 columns">'+
                '<label for="support_password">' + tr("Password") + '</label>' +
                '<input id="support_password" type="password"></input>' +
            '</div>'+
            '<div class="large-12 columns">'+
                '<button class="button right radius success" type="submit">'+ tr("Sign in") + '</button>' +
            '</div>'+
            '<div class="large-12 columns text-center">'+
                '<p>' + tr("or") + '</p>' +
            '</div>'+
            '<div class="large-12 columns">'+
                '<a  href="http://c12g.com/buy/" target="_blank" class="button large-12 radius">'+ tr("Get an account") + '</a>' +
            '</div>'+
          '</form>'+
          '</fieldset>'+
        '</div>'+
      '</div>'+
      '<div class="row">'+
        '<div class="large-12 columns text-left">'+
          '<h3 class="subheader"><i class="fa fa-fw fa-info-circle"></i> '+tr("Additional Help Resources")+"</h3>"+
        '</div>'+
      '</div>'+
      '<br>'+
      '<div class="row">'+
        '<div class="large-6 columns">'+
          '<a href="http://docs.opennebula.org/4.8/" target="_blank">'+
            '<span class="fa-stack fa-2x" style="color: #cfcfcf;">'+
               '<i class="fa fa-circle fa-stack-2x"></i>'+
               '<i class="fa fa-book fa-stack-1x fa-inverse"></i>'+
            '</span>'+
            '<br>'+
            '<span>'+tr("Documentation")+'</span>'+
          '</a>'+
        '</div>'+
        '<div class="large-6 columns">'+
          '<a href="http://opennebula.org/support/community/" target="_blank">'+
            '<span class="fa-stack fa-2x" style="color: #cfcfcf;">'+
               '<i class="fa fa-circle fa-stack-2x"></i>'+
               '<i class="fa fa-comments fa-stack-1x fa-inverse"></i>'+
            '</span>'+
            '<br>'+
            '<span>'+tr("Community")+'</span>'+
          '</a>'+
        '</div>'+
      '</div>'+
      '<br>'+
      '<p class="text-center" style="font-size: 14px; color: #999;">'+ tr("This tab can be disabled in the sunstone views configuration files") + '</p>',
    forms: {
      "create_support_request_form": {
        actions: {
          create: {
            title: tr("Submit a Request"),
            submit_text: tr("Submit")
          }
        },
        wizard_html: create_support_request_wizard_html,
        setup: initialize_create_support_request_dialog
      }
    }
}

function initialize_create_support_request_dialog() {
    $('#create_support_request_form_wizard').foundation();

    $('#create_support_request_form_wizard').on('invalid.fndtn.abide', function () {
        notifyError(tr("One or more required fields are missing or malformed."));
        popFormDialog("create_support_request_form", $("#support-tab"));
    }).on('valid.fndtn.abide', function() {
        var template = {
            "subject" : $('#subject', this).val(),
            "description" : $('#description', this).val(),
            "opennebula_version" : $('#opennebula_version', this).val(),
            "severity" : $('#severity', this).val(),
        }

        Sunstone.runAction("Support.create", template);
        return false;
    });
}

//var doc_tab = {
//    title: tr("Documentation"),
//    tabClass: 'subTab',
//    parentTab: 'support-tab',
//    no_content: true
//}
//
//var community_tab = {
//    title: tr("Community"),
//    tabClass: 'subTab',
//    parentTab: 'support-tab',
//    no_content: true
//}
//
//var enterprise_tab = {
//    title: tr("Enterprise"),
//    tabClass: 'subTab',
//    parentTab: 'support-tab',
//    no_content: true
//}

Sunstone.addActions(support_actions);
Sunstone.addMainTab('support-tab',support_tab);

var support_info_panel = {
    "support_info_tab" : {
        title: tr("Request Information"),
        content:""
    }
};

Sunstone.addInfoPanel("support_info_panel", support_info_panel);
//Sunstone.addMainTab('doc-tab',doc_tab);
//Sunstone.addMainTab('community-tab',community_tab);
//Sunstone.addMainTab('enterprise-tab',enterprise_tab);
//
//$(document).on("click", "#li_doc-tab a", function(){
//    window.open("http://docs.opennebula.org/4.8/");
//    return false;
//})
//
//$(document).on("click", "#li_community-tab a", function(){
//    window.open("http://opennebula.org/support/community/");
//    return false;
//})
//
//$(document).on("click", "#li_enterprise-tab a", function(){
//    window.open("http://c12g.com/support/");
//    return false;
//})


function updateSupportInfo(request, response){
    var message;
    if (response["REQUEST"]["status"] == "open") {
        message = tr("This request is currently being processed by our staff")
    } else if (response["REQUEST"]["status"] == "pending") {
        message = tr("This request is awaiting your response")
    }

    var html = '<div class="row">\
        <div class="large-6 columns">\
                <h5>'+response["REQUEST"]['subject']+'</h5>\
                <p class="subheader" style="font-size: 14px;">'+$("<div/>").html(response["REQUEST"]["html_description"]).text()+'</p>\
        </div>\
        <div class="large-6 columns">\
        <table id="info_marketplace_table" class="dataTable">\
            <thead>\
              <tr><th colspan="2">'+tr("Information")+'</th></tr>\
            </thead>\
            <tbody>\
              <tr>\
                <td class="key_td">' + tr("Requested") + '</td>\
                <td class="value_td">'+response["REQUEST"]['created_at']+'</td>\
              </tr>\
              <tr>\
                <td class="key_td">' + tr("Status") + '</td>\
                <td class="value_td">'+response["REQUEST"]['status']+'</td>\
              </tr>\
              <tr>\
                <td colspan="2"><span class="large-12 label secondary radius">' + message + '</span></td>\
              </tr>\
            </tbody>\
        </table>\
        </div>\
      </div><br>'

    if (response["REQUEST"]["comments"]) {
        $.each(response["REQUEST"]["comments"], function(index, comment){
            console.log(comment)
            html += generateAdvancedSection({
                title: '<span style="width: 100%;">' + (comment["author_id"] == 21231023 ? "OpenNebula Support Team" : "Me") + '  <span style="color: #999;"> - '+ comment["created_at"] + '</span></span>',
                html_id: 'advanced_comment_' + response["REQUEST"]["id"] + index,
                content: '<div class="row">\
                    <div class="large-12 columns comment" style="font-size: 14px !important;">'+$("<div/>").html(comment["html_body"]).text()+'</div>\
                  </div>'
              });
        })
    }

    html += '<form id="submit_support_comment">\
      <div class="row">\
        <div class="large-12 columns">\
            <textarea class="comment" placeholder="'+tr("Add a comment to this request") + '" rows="4"></textarea>\
        </div>\
      </div>\
      <div class="row">\
        <div class="large-12 columns">\
            <button class="button right radius success" type="submit">'+ tr("Submit") + '</button>\
        </div>\
      </div>\
      </form>';

    var info_tab = {
        title : tr("Info"),
        icon: "fa-info-circle",
        content: html
    };

    Sunstone.updateInfoPanelTab("support_info_panel", "support_info_tab", info_tab);
    Sunstone.popUpInfoPanel("support_info_panel", "support-tab");

    $("#submit_support_comment").data("request_id", response["REQUEST"]["id"]);
    $("#submit_support_comment").on("submit", function(){
        var request_id = $(this).data("request_id");
        var request_json = {
            "comment" : {
                "value" : $(".comment", this).val()
            }
        }

        Sunstone.runAction("Support.update", request_id, request_json);
        return false;
    })

    $(".accordion_advanced > a", "#support_info_tab").trigger("click");
    $("dl.right-info-tabs", "#support_info_panel").hide();
};

 function infoListenerSupport(dataTable){
    $('tbody tr',dataTable).live("click",function(e){
      if ($(e.target).is('input') ||
          $(e.target).is('select') ||
          $(e.target).is('option')) return true;

      var aData = dataTable.fnGetData(this);
      var id =aData["REQUEST"]["id"];

      if (!id) return true;

      if (e.ctrlKey || e.metaKey || $(e.target).is('input')) {
          $('.check_item',this).trigger('click');
      } else {
          var context = $(this).parents(".tab");
          popDialogLoading($("#support-tab"));
          Sunstone.runAction("Support.show",id);
          $(".resource-id", context).html(id);
          $('.top_button, .list_button', context).attr('disabled', false);
      }

      return false;
    });
}

$(document).ready(function(){
    var tab_name = 'support-tab';

    if (Config.isTabEnabled(tab_name)) {
      dataTable_support = $("#dataTable_support", main_tabs_context).dataTable({
        "bSortClasses" : false,
        "bDeferRender": true,
          "aoColumns": [
              { "bSortable": false,
                "mData": function ( o, val, data ) {
                    //we render 1st column as a checkbox directly
                    return '<input class="check_item" type="checkbox" id="marketplace_'+
                        o['REQUEST']['id']+
                        '" name="selected_items" value="'+
                        o['REQUEST']['id']+'"/>'
                }
              },
              { "mDataProp": "REQUEST.id" },
              { "mDataProp": "REQUEST.subject" },
              { "mDataProp": "REQUEST.created_at" },
              { "mDataProp": "REQUEST.status"}
            ],
            "aoColumnDefs": [
              { "bVisible": true, "aTargets": Config.tabTableColumns(tab_name)},
              { "bVisible": false, "aTargets": ['_all']}
          ]
      });


      $('#support_search').keyup(function(){
        dataTable_support.fnFilter( $(this).val() );
      })


      tableCheckboxesListener(dataTable_support);
      onlyOneCheckboxListener(dataTable_support);
      infoListenerSupport(dataTable_support);

      Sunstone.runAction('Support.list');

      $(".support_button").on("click", function(){
        $("#li_support-tab > a").trigger("click");
        $(".create_dialog_button", "#support-tab").trigger("click");
        return false;
      })

      $("#support_credentials_form").on("submit", function(){
        var data = {
          email : $("#support_email", this).val(),
          password : $("#support_password", this).val()
        }

        $.ajax({
          url: 'support/credentials',
          type: "POST",
          dataType: "json",
          data: JSON.stringify(data),
          success: function(){
            console.log("success")
            $("#support-tabrefresh_buttons > a").trigger("click");
          },
          error: function(response){
            console.log("error")
            notifyError("Support credentials are incorrect")
          }
        });

        return false;
      })
    }
});
