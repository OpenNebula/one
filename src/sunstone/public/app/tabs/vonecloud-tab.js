// -------------------------------------------------------------------------- //
// Copyright 2015, OpenNebula Systems SL                                      //
//                                                                            //
// Licensed under the OpenNebula Systems Software License available in a      //
// text file “LICENSE” as part of the distribution                            //
//                                                                            //
// Unless required by applicable law or agreed to in writing, software        //
// distributed under the License is distributed on an "AS IS" BASIS,          //
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.   //
// See the License for the specific language governing permissions and        //
// limitations under the License.                                             //
//--------------------------------------------------------------------------- //

define(function(require) {
  var TAB_ID = 'vonecloud-tab';
  var VONECLOUD_LABEL = '<span style="color:#0098c3"><i class="fa fa-lg fa-fw fa-desktop"></i>&emsp;Control Panel</span>';

  var Tab = {
    tabId: TAB_ID,
    title: VONECLOUD_LABEL,
    no_content: true,
    setup: _setup
  };

  return Tab;

  function _setup() {
    $("#li_vonecloud-tab > a").on("click", function(e){
      vonecloud_control_center = document.URL.replace(/(https?:\/\/)([^:\/]+).*$/,"$1$2:8000");
      window.location = vonecloud_control_center;
    });

    $.ajax({
      url: 'vonecloud/check_version',
      type: "GET",
      dataType: "json",
      success: function(response) {
        if (response["new_version"]) {
          version_alert = VONECLOUD_LABEL + '&nbsp;<span style="color:#DC7D24"><i class="fa fa-lg fa-exclamation-circle"></i></span>';
          $("li[id$='vonecloud-tab'] > a > span").html(version_alert);
        }
      },
      error: function(response) {
        return null;
      }
    });
  }
});
