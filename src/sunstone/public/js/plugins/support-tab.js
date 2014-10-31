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

var support_interval_function;
var $upload_support_file;
var create_support_request_wizard_html =
 '<form data-abide="ajax" id="create_support_request_form_wizard" class="custom creation">' +
    '<div class="row">' +
      '<div class="large-6 columns">' +
        '<label for="subject">Subject</label>' +
        '<input id="subject" type="text" required></input>' +
      '</div>' +
      '<div class="large-6 columns">' +
        '<label for="opennebula_version">OpenNebula Version</label>' +
        '<input id="opennebula_version" type="text" required></input>' +
      '</div>' +
    '</div>' +
    '<div class="row">' +
      '<div class="large-12 columns">' +
        '<label for="description">Description</label>' +
        '<textarea id="description" rows="5" placeholder="Please enter the details of your request. A member of our support staff will respond as soon as possible." required></textarea>' +
      '</div>' +
    '</div>' +
    '<div class="row">' +
      '<div class="large-12 columns">' +
        '<label for="severity">Subject</label>' +
        '<select id="severity" name="severity">'+
            '<option value="severity_1">Severity 1. Product Error: Catastrophic problem in running production systems</option>'+
            '<option value="severity_2">Severity 2. Product Error: High-impact problem in running production systems</option>'+
            '<option value="severity_3">Severity 3. Product Error: Low impact problem on a running production system </option>'+
            '<option value="severity_4" selected>Severity 4. Usage, Design, Configuration, or Integration Question</option>'+
        '</select>'+
      '</div>' +
    '</div>' +
  '</form>';

function show_support_connect() {
  $(".support_info").hide();
  $("#dataTable_support_wrapper").hide();
  $(".support_connect").show();
  $(".actions_row", "#support-tab").hide();
}

function show_support_list() {
  $(".support_info").show();
  $(".support_connect").hide();
  $(".actions_row", "#support-tab").show();
  $("#dataTable_support_wrapper").show();
}

var support_actions = {
    "Support.list" : {
        type: "list",
        call: OpenNebula.Support.list,
        callback: function(req, list, res){
            show_support_list();
            $(".support_open_value").text(res.open_requests);
            $(".support_pending_value").text(res.pending_requests);
            updateView(list, dataTable_support);
        },
        error: function(request, error_json) {
            if (error_json.error.http_status=="401") {
              clearInterval(support_interval_function);
            }

            show_support_connect();
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
        },
        error: function(request, error_json) {
            show_support_connect();
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
        error: function(request, error_json) {
            show_support_connect();
        }
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
          show_support_connect();
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
          show_support_connect();
        }
    },

    "Support.signout" : {
      type: "single",
      call: function() {
        $.ajax({
          url: 'support/credentials',
          type: "DELETE",
          dataType: "json",
          success: function(){
            show_support_connect();
            $("#support-tabrefresh_buttons > a").trigger("click");
          },
          error: function(response){
            if (response.status=="401") {
              notifyError("Support credentials are incorrect")
            } else {
              notifyError(response.responseText)
            }
          }
        });
      }
    },
    "Support.upload" : {
      type: "single",
      call: function() {
        $upload_support_file.foundation("reveal", "open");
      }
    }
}

var support_buttons = {
    "Support.refresh" : {
        type: "action",
        layout: "refresh",
        text: '<i class="fa fa-refresh fa fa-lg">',
        alwaysActive: true
    },
    "Support.upload" : {
        type: "action",
        layout: "main",
        text: '<i class="fa fa-cloud-upload" style="color: rgb(111, 111, 111)"/> '+tr("Upload a file"),
        custom_classes: "only-right-info"
    },
    "Support.signout" : {
        type: "action",
        layout: "main",
        text: '<i class="fa fa-sign-out fa fa-lg">',
        tip: "Sign out of Commercial Support",
        alwaysActive: true
    },
    "Support.create_dialog" : {
        type: "create_dialog",
        layout: "create",
        text: "Submit a Request"
    }
};

var support_tab = {
    //title: '<i class="fa fa-lg fa-fw fa-support"></i>&emsp;Support"),
    title:
    '<span class="support_title"><i class="fa fa-lg fa-fw fa-support"></i> Support</span>' +
    '<br>'+
    '<div class="support_info" style="display: none;">'+
      '<span class="support_open">Open</span><span class="label secondary right support_open_value">-</span>'+
      '<br>'+
      '<span class="support_pending">Pending</span><span class="label right support_pending_value">-</span>'+
      '<br>'+
      '<button class="button tiny success radius support_button">Submit a Request</button>'+
    '</div>'+
    '<div class="support_connect" style="display: none;">'+
      '<span class="">Not connected</span>'+
      '<br>'+
      '<button class="button tiny success radius support_connect_button">Sign in</button>'+
    '</div>',
    table: '<table id="dataTable_support" class="datatable twelve support_info">\
        <thead>\
          <tr>\
            <th class="check"></th>\
            <th>ID</th>\
            <th>Subject</th>\
            <th>Requested</th>\
            <th>Status</th>\
          </tr>\
        </thead>\
        <tbody id="tbodysupport">\
        </tbody>\
      </table>',
    buttons: support_buttons,
    search_input: '<input id="support_search" type="text" placeholder="Search" />',
    list_header: '<i class="fa fa-fw fa-support"></i> Commercial Support Requests',
    info_header: '<i class="fa fa-fw fa-support"></i> Commercial Support Request',
    subheader: '<div class="row text-left support_connect">'+
        '<div class="large-6 columns" style="font-">'+
          '<p>The Support Subscription provides expert integration and production support on supported platforms and include:</p>'+
          '<ul class="fa-ul" style="font-size: 14px;">'+
            '<li><i class="fa-li fa fa-check"></i>Problem diagnosis, resolution and bug fixing</li>'+
            '<li><i class="fa-li fa fa-check"></i>Solving unexpected problems when using, installing or configuring the software</li>'+
            '<li><i class="fa-li fa fa-check"></i>Guidance about tuning for optimal and scalable performance in your environment</li>'+
            '<li><i class="fa-li fa fa-check"></i>Answering “how to” questions related to standard and intended product usage</li>'+
            '<li><i class="fa-li fa fa-check"></i>Offering hints about how to go around missing features</li>'+
            '<li><i class="fa-li fa fa-check"></i>Answering questions about product adaptation and integration</li>'+
          '</ul>'+
          '<p>For more info on support subcriptions, <a href="http://opennebula.systems/support/" target="_blank">click here</a></p>' +
        '</div>'+
        '<div class="large-6 columns" style="padding: 0px 50px;">'+
          '<fieldset>'+
          '<legend>Commercial Support</legend>'+
          '<form id="support_credentials_form">'+
            '<div class="large-12 columns">'+
                '<label for="support_email">Email</label>' +
                '<input id="support_email" type="text"></input>' +
            '</div>'+
            '<div class="large-12 columns">'+
                '<label for="support_password">Password</label>' +
                '<input id="support_password" type="password"></input>' +
            '</div>'+
            '<div class="large-12 columns">'+
                '<button class="button right radius success submit_support_credentials_button" type="submit">Sign in</button>' +
            '</div>'+
            '<div class="large-12 columns text-center">'+
                '<p>or</p>' +
            '</div>'+
            '<div class="large-12 columns">'+
                '<a  href="http://opennebula.systems/buy/" target="_blank" class="button large-12 radius" style="color: #fff !important">Get an account</a>' +
            '</div>'+
          '</form>'+
          '</fieldset>'+
        '</div>'+
      '</div>'+
      '<div class="row">'+
        '<div class="large-12 columns text-left">'+
          '<h3 class="subheader"><i class="fa fa-fw fa-info-circle"></i> Additional Help Resources</h3>'+
        '</div>'+
      '</div>'+
      '<br>'+
      '<div class="row">'+
        '<div class="large-6 columns">'+
          '<a href="http://docs.opennebula.org/4.10/" target="_blank">'+
            '<span class="fa-stack fa-2x" style="color: #cfcfcf;">'+
               '<i class="fa fa-circle fa-stack-2x"></i>'+
               '<i class="fa fa-book fa-stack-1x fa-inverse"></i>'+
            '</span>'+
            '<br>'+
            "Documentation"+
          '</a>'+
        '</div>'+
        '<div class="large-6 columns">'+
          '<a href="http://opennebula.org/support/community/" target="_blank">'+
            '<span class="fa-stack fa-2x" style="color: #cfcfcf;">'+
               '<i class="fa fa-circle fa-stack-2x"></i>'+
               '<i class="fa fa-comments fa-stack-1x fa-inverse"></i>'+
            '</span>'+
            '<br>'+
            "Community"+
          '</a>'+
        '</div>'+
      '</div>'+
      '<br>'+
      '<p class="text-center" style="font-size: 14px; color: #999;">This tab can be disabled in the sunstone views configuration files</p>',
    forms: {
      "create_support_request_form": {
        actions: {
          create: {
            title: "Submit a Request",
            submit_text: "Submit"
          }
        },
        wizard_html: create_support_request_wizard_html,
        setup: initialize_create_support_request_dialog
      }
    }
}

function setup_upload_support_file_dialog() {
  dialogs_context.append('<div id="upload_support_file"></div>');
  $upload_support_file = $('#upload_support_file',dialogs_context);
  var dialog = $upload_support_file;

  dialog.html('\
    <div class="row">\
      <div class="large-12 columns">\
        <h3 class="subheader">'+tr("Upload File")+'</h3>\
      </div>\
    </div>\
    <form id="upload_support_file_form">\
      <div class="row">\
        <div id="support_file-uploader" class="large-12 columns text-center">\
          <input id="support_file-uploader-input" type="file"/>\
        </div>\
      </div>\
      <div class="row">\
        <div class="large-12 columns">\
          <button class="button right radius success upload_support_file_form_button" type="submit" disabled>Upload</button>\
        </div>\
      </div>\
    </form>\
    <a class="close-reveal-modal">&#215;</a>\
  ');

  dialog.addClass("reveal-modal").attr("data-reveal", "");
  $vnc_dialog.foundation();

  if (getInternetExplorerVersion() > -1) {
    $(".upload_support_file_form_button").text("Uploading files through IE is not supported");
    $(".upload_support_file_form_button").attr("disabled", "disabled");
  } else {
    var uploader = new Resumable({
        target: '/upload_chunk',
        chunkSize: 10*1024*1024,
        maxFiles: 1,
        testChunks: false,
        query: {
            csrftoken: csrftoken
        }
    });

    uploader.assignBrowse($('#support_file-uploader-input'));

    var fileName = '';
    var file_input = false;

    uploader.on('fileAdded', function(file){
        $(".upload_support_file_form_button").removeAttr("disabled");
        fileName = file.fileName;
        file_input = fileName;
    });

    uploader.on('uploadStart', function() {
        $(".upload_support_file_form_button").attr("disabled", "disabled");
        $('.support_upload_progress_bars').append('<div id="'+fileName+'progressBar" class="row" style="margin-bottom:10px">\
          <div id="'+fileName+'-info" class="large-2 columns dataTables_info">\
            '+tr("Uploading...")+'\
          </div>\
          <div class="large-10 columns">\
            <div id="upload_progress_container" class="progress nine radius" style="height:25px !important">\
              <span class="meter" style="width:0%"></span>\
            </div>\
            <div class="progress-text" style="margin-left:15px">'+fileName+'</div>\
          </div>\
        </div>');
    });

    uploader.on('progress', function() {
        $('span.meter', $('div[id="'+fileName+'progressBar"]')).css('width', uploader.progress()*100.0+'%')
    });

    uploader.on('fileSuccess', function(file) {
        $('div[id="'+fileName+'-info"]').text(tr('Registering in OpenNebula'));
        $.ajax({
            url: '/support/request/' + $("#submit_support_comment").data("request_id") + '/upload',
            type: "POST",
            data: {
                csrftoken: csrftoken,
                file: fileName,
                tempfile: file.uniqueIdentifier
            },
            success: function(){
                notifyMessage("File uploaded correctly");
                $('div[id="'+fileName+'progressBar"]').remove();
                Sunstone.runAction("Support.refresh");
                $upload_support_file.foundation('reveal', 'close');
            },
            error: function(response){
                onError({}, OpenNebula.Error(response));
                $('div[id="'+fileName+'progressBar"]').remove();
            }
        });
    });

    $("#upload_support_file_form").on("submit", function(){
      uploader.upload();
      $upload_support_file.foundation("reveal", "close")
      return false;
    })
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
//    window.open("http://docs.opennebula.org/4.10/");
//    return false;
//})
//
//$(document).on("click", "#li_community-tab a", function(){
//    window.open("http://opennebula.org/support/community/");
//    return false;
//})
//
//$(document).on("click", "#li_enterprise-tab a", function(){
//    window.open("http://opennebula.systems/support/");
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
              <tr><th colspan="2">Information</th></tr>\
            </thead>\
            <tbody>\
              <tr>\
                <td class="key_td">Requested</td>\
                <td class="value_td">'+response["REQUEST"]['created_at']+'</td>\
              </tr>\
              <tr>\
                <td class="key_td">Status</td>\
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
            html += generateAdvancedSection({
                title: '<span style="width: 100%;">' + (comment["author_id"] == 21231023 ? "OpenNebula Support Team" : 'Me') + ' <span style="color: #999;"> - '+ comment["created_at"] + '</span></span>',
                html_id: 'advanced_comment_' + response["REQUEST"]["id"] + index,
                content: '<div class="row">\
                    <div class="large-12 columns comment" style="font-size: 14px !important;">'+$("<div/>").html(comment["html_body"]).text()+'</div>\
                  </div>'
              });
        })
    }

    html += '<div class="row">\
        <div class="large-12 columns support_upload_progress_bars">\
        </div>\
      </div>';

    html += '<form id="submit_support_comment">\
      <div class="row">\
        <div class="large-12 columns">\
            <textarea class="comment" placeholder="Add a comment to this request" rows="4"></textarea>\
        </div>\
      </div>\
      <div class="row">\
        <div class="large-12 columns">\
            <input id="solved" type="checkbox"><label for="solved">Please consider this request resolved</label>\
            <button class="button right radius success" type="submit">Submit</button>\
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
            },
            "solved" : $("#solved:checked", this).length > 0 ? true : false
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
      setup_upload_support_file_dialog();

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

      show_support_connect();
      Sunstone.runAction('Support.list');

      support_interval_function = setInterval(function(){
        Sunstone.runAction('Support.list');
      }, top_interval);

      $(".support_button").on("click", function(){
        $("#li_support-tab > a").trigger("click");
        $(".create_dialog_button", "#support-tab").trigger("click");
        return false;
      })

      $("#support_credentials_form").on("submit", function(){
        $(".submit_support_credentials_button").attr("disabled", "disabled");
        $(".submit_support_credentials_button").html('<i class="fa fa-spinner fa-spin"></i>');

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
            $(".submit_support_credentials_button").removeAttr("disabled");
            $(".submit_support_credentials_button").html('Sign in');

            $("#support-tabrefresh_buttons > a").trigger("click");

            support_interval_function = setInterval(function(){
              Sunstone.runAction('Support.list');
            }, top_interval);

            show_support_list();
          },
          error: function(response){
            if (response.status=="401") {
              notifyError("Support credentials are incorrect")
            } else {
              notifyError(response.responseText)
            }

            $(".submit_support_credentials_button").removeAttr("disabled");
            $(".submit_support_credentials_button").html('Sign in');
          }
        });

        return false;
      })
    }
});
