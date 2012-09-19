//--------------------------------------------------------------------------//
// Copyright 2010-2012, C12G Labs S.L.                                      //
//                                                                          //
// Licensed under the C12G Commercial Open-source License (the              //
// "License"); you may not use this file except in compliance               //
// with the License. You may obtain a copy of the License as part           //
// of the software distribution.                                            //
//                                                                          //
// Unless agreed to in writing, software distributed under the              //
// License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES           //
// OR CONDITIONS OF ANY KIND, either express or implied. See the            //
// License for the specific language governing permissions and              //
// limitations under the License.                                           //
//--------------------------------------------------------------------------//

var appmarket_dashboard_tmpl = '\
<table class="dashboard_table" id="appmarket_dashboard">\
<tr>\
<td style="width:100%">\
<table id="table_right" style="width:100%">\
  <tr>\
    <td>\
      <div class="panel">\
<h3>' + tr("AppEnv - Image repository") + '</h3>\
        <div class="panel_info">\
\
        <p class="dashboard_p" style="margin-top: 10px"><img src="images/appmarket_icon.png" height="80px" style="float:right;margin:15px 15px;" alt="appflow logo"/>AppMarket builds a centralized catalog of cloud applications. With AppMarket you can build a private repository to share and distribute virtual appliances across OpenNebula instances.</p>\
            <p class="dashboard_p">&nbsp;</p>\
            <p class="dashboard_p">&nbsp;</p>\
            <p class="dashboard_p">&nbsp;</p>\
            <p class="dashboard_p">&nbsp;</p>\
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