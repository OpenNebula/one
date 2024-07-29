/* -------------------------------------------------------------------------- */
/* Copyright 2002-2024, OpenNebula Project, OpenNebula Systems                */
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
    var Notifier = require("utils/notifier");

    // user config
    const fireedge_endpoint = Config.publicFireedgeEndpoint;

    /**
     * Aux function to change the fireedge_token value.
     *
     * @param token [String] new key to be stored.
     *
     */
    var set_fireedge_token = function(token) {
        fireedge_token = token;
    };

    /**
     * Sets the fireedge_token variable to "".
     */
    var clear_fireedge_token = function() {
        fireedge_token = "";
    };

    /**
     * This function sets the fireedge_token variable if fireedge is running.
     * If the FireEdge Server is not running the value of fireedge_token will
     * be "".
     */
    var _validate_fireedge_token = function(success, error) {
        /*
         * sunstone_fireedge_active is a variable to control if we already did
         * validations. If that variable is true, that means that fireedge
         * endpoint was working last time we checked it.
         */
        if (sunstone_fireedge_active && fireedge_token == "" && fireedge_endpoint) {
            $.ajax({
                url: "/auth_fireedge",
                type: "GET",
                success: function(data) {
                    set_fireedge_token(data.token);
                    if (typeof success === "function") {
                        success(fireedge_token);
                    }
                },
                error: function(request) {
                    Notifier.onError(
                        request,
                        { error: { message: "FireEdge private endpoint is not working, please contact your cloud administrator" } }
                    );

                    sunstone_fireedge_active = false;
                    clear_fireedge_token();
                    if (typeof error === "function") {
                        error();
                    }
                }
            });
        }
        /**
         * is_fireedge_configured is a variable to control if fireedge
         * configurations are available on sunstone-server.conf.
         * If they are available then we must use fireedge for everything.
        */
        else if (sunstone_fireedge_active || is_fireedge_configured) {
            if (typeof success === "function") {
                success(fireedge_token);
            }
        }
        // If fireedge it is not available and not configured then we dont use it
        else {
            if (typeof error === "function") {
                error();
            }
        }
    };

    var error_function = function(error, request=null, notify=true) {
        if (notify) {
            Notifier.onError(
                request,
                { error: { message: "FireEdge public endpoint is not working, please contact your cloud administrator" } }
            );
        }

        sunstone_fireedge_active = false;

        if (typeof error === "function") error();
    };

    var _check_fireedge_public_url = function (success, aux, error) {
        var regex = /^(http(s)?:\/\/)(www\.)?[a-z,0-9]+([\-\.]{1}[a-z,0-9]+)*(:[0-9]{1,5})?(\/.*)?$/gm;
        var valid_endpoint = Boolean(fireedge_endpoint.match(regex));

        if (fireedge_endpoint && valid_endpoint) {
            $.ajax({
                url: fireedge_endpoint,
                type: "GET",
                success: function() {
                    sunstone_fireedge_active = true;
                    if (typeof success === "function" && typeof aux === "function") {
                        success(aux);
                    }
                },
                error: function(request) {
                    error_function(error, request);
                }
            });
        }
        else{
            error_function(error, null, is_fireedge_configured && !valid_endpoint);
        }
    };

    var fireedge_validator = {
      "validateFireedgeToken": _validate_fireedge_token,
      "checkFireedgePublicURL": _check_fireedge_public_url
    };

    return fireedge_validator;
  });