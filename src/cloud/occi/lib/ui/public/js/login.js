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
    window.location.href = "./ui";
}

function auth_error(req, error){

    var status = error.error.http_status;

    switch (status){
    case 401:
        $("#error_box").text("Invalid username or password");
        break;
    case 500:
        $("#error_box").text("OpenNebula is not running or there was a server exception. Please check the server logs.");
        break;
    case 0:
        $("#error_box").text("No answer from server. Is it running?");
        break;
    default:
        $("#error_box").text("Unexpected error. Status "+status+". Check the server logs.");

    };
    $("#error_box").fadeIn("slow");
    $("#login_spinner").hide();
}

function authenticate(){
    var username = $("#username").val();
    var password = $("#password").val();
    password = Crypto.SHA1(password);
    var remember = $("#check_remember").is(":checked");

    $("#error_box").fadeOut("slow");
    $("#login_spinner").show();

    var obj = { data: {username: username,
                       password: password},
                remember: remember,
                success: auth_success,
                error: auth_error
              };

    if (('localStorage' in window) && (window['localStorage'] !== null) && (localStorage['lang'])){
        obj['lang'] = localStorage['lang'];
    };

    OCCI.Auth.login(obj);
}

$(document).ready(function(){
    $('div#logo_selfservice').css("background","url("+logo_big+") no-repeat center");

    $("#login_form").submit(function (){
        authenticate();
        return false;
    });

    //compact login elements according to screen height
    if (screen.height <= 600){
        $('div#logo_selfservice').css("top","15px");
        $('div#login').css("top","10px");
        $('.error_message').css("top","10px");
    };

    $("input#username.box").focus();
    $("#login_spinner").hide();
});
