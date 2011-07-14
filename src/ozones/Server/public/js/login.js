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

function auth_success(req, response){
    window.location.href = ".";
}

function auth_error(req, error){

    var status = error.error.http_status;

    switch (status){
        case 401:
            $("#one_error").hide();
            $("#auth_error").show();
            break;
        case 500:
            $("#auth_error").hide();
            $("#one_error").show();
            break;
    }
}

function authenticate(){
    var username = $("#username").val();
    var password = $("#password").val();
    var remember = $("#check_remember").is(":checked");

    oZones.Auth.login({ data: {username: username
                                    , password: password}
                            , remember: remember
                            , success: auth_success
                            , error: auth_error
                        });
}

function logout(){
    oZones.Auth.logout();
}


$(document).ready(function(){
    $("#login_btn").click(function () {
        authenticate();
    });

    $("input").keydown(function (e){
        if (e.keyCode == 13) {
            authenticate();
        }
    });

    $("#logout_btn").click(function () {
        logout();
    });

    $("input#username.box").get(0).focus();
});
