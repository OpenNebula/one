// ------------------------------------------------------------------------ //
// Copyright 2010-2013, C12G Labs S.L.                                      //
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

function updateAppMarketDashboard(what, json_info){
    var db = $('#appmarket_dashboard_tab',main_tabs_context);
    switch (what){
    case "appliances":
        $('#appmarket_total_appliances',db).html(json_info.length);
        break;
    };
}

var appmarket_dashboard_tmpl = '\
<table class="dashboard_table" id="appmarket_dashboard">\
<tr>\
<td style="width:50%">\
<table id="system_information_table" style="width:100%">\
  <tr>\
    <td>\
      <div class="panel">\
<h3>' + tr("Summary of AppMarket resources") + '</h3>\
        <div class="panel_info">\
\
          <table class="info_table">\
            <tr>\
              <td class="key_td">Appliances</td>\
              <td class="value_td"><span id="appmarket_total_appliances"></span></td>\
            <tr>\
          </table>\
\
        </div>\
      </div>\
    </td>\
  </tr>\
</table>\
</td>\
<td style="width:50%">\
<table id="table_right" style="width:100%">\
  <tr>\
    <td>\
      <div class="panel">\
        <h3>' + tr("AppMarket") + '</h3>\
        <div class="panel_info">\
            <p>\
              <img src="images/appmarket_icon.png" height="80px" style="float:right;margin:0px 15px 15px 15px;" alt="appmarket logo"/>\
              AppMarket builds a centralized catalog of cloud applications. With AppMarket you can build a private repository to share and distribute virtual appliances across OpenNebula instances.\
            </p>\
            <p>'+tr("You can find further information on the following links:")+'</p>\
            <ul>\
               <li><a href="http://doc.opennebula.pro/doku.php?id=appmarket" target="_blank">AppMarket Documentation</a></li>\
            </ul>\
        </div>\
      </div>\
    </td>\
  </tr>\
</table>\
</td>\
</tr></table>';

var appmarket_dashboard_tab = {
    title: '<i class="icon-truck"></i>AppMarket',
    content: appmarket_dashboard_tmpl,
}


Sunstone.addMainTab('appmarket_dashboard_tab',appmarket_dashboard_tab);