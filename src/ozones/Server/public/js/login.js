/* -------------------------------------------------------------------------- */
/* Copyright 2002-2012, OpenNebula Project Leads (OpenNebula.org)             */
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
            $("#auth_error").fadeIn("slow");
            break;
        case 500:
            $("#auth_error").hide();
            $("#one_error").fadeIn("slow");
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

$(document).ready(function(){
    $("#login_form").submit(function (){
        authenticate();
        return false;
    });

    //compact login elements according to screen height
    if (screen.height <= 600){
        $('div#logo_sunstone').css("top","15px");
        $('div#login').css("top","10px");
        $('.error_message').css("top","10px");
    };

    $("input#username.box").focus();
});
