/* -------------------------------------------------------------------------- */
/* Copyright 2002-2020, OpenNebula Project, OpenNebula Systems                */
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

define(function (require) {

    var Config = require("sunstone-config");  
  
    // user config
    const fireedge_endpoint = Config.publicFireedgeEndpoint;

    /**
     * Aux function to change the fireedge_token value.
     * 
     * @param token [String] new key to be stored.
     * 
     */
    var set_fireedge_token = function(token){
        fireedge_token = token;
    };

    /**
     * Sets the fireedge_token variable to "".
     */
    var clear_fireedge_token = function(){
        fireedge_token = "";
    };

    /**
     * This function sets the fireedge_token variable if fireedge is running.
     * If the Fireedge Server is not running the value of fireedge_token will
     * be "".
     */
    var _validate_fireedge_token = function(success, error) {
        $.ajax({
            url: "/fireedge",
            type: "GET",
            success: function(data) {
                set_fireedge_token(data.token);
                if (typeof success == "function"){
                    success(fireedge_token);
                }
            },
            error: function(request, response, data) {
                clear_fireedge_token();
                if (typeof error == "function"){
                    error();
                }
            }
        });
    }
  
    var fireedge_validator = {
      "validateFireedgeToken": _validate_fireedge_token,
      "fireedgeToken": fireedge_token
    };
  
    return fireedge_validator;
  });