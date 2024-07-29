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

define(function(require) {
  require("../bower_components/jquery/dist/jquery.min");
  var OpenNebulaAuth = require("opennebula/auth");
  var WebAuthnJSON = require("../bower_components/webauthn-json/dist/index");

  var showErrorAuth = false;
  var uid;

  var textOpenNebulaNotRunning = "OpenNebula is not running or there was a server exception. Please check the server logs.";
  var textInvalidUserorPassword = "Invalid username or password";
  var textNoAnswerFromServer = "No answer from server. Is it running?";
  var textTwoFactorTokenInvalid = "Invalid second factor authentication";
  var idElementTwoFactor = "#two_factor_auth_token";

  function auth_success(req, response) {
    if (response && response.code && response.code === "two_factor_auth") {
      $("#login_form").hide();
      $("#login_spinner").hide();
      $("#two_factor_auth").fadeIn("slow");
      $("#two_factor_auth_token").focus();
      $("#login_btn")[0].type = "button";
      $("#two_factor_auth_login_btn")[0].type = "submit";
      if(!showErrorAuth){
        showErrorAuth = true;
      } else {
        $("#error_message").text(textTwoFactorTokenInvalid);
        $("#error_box").fadeIn("slow");
        $("#login_spinner").hide();
      }
      uid = response.uid;
      prepareWebAuthn(uid);
    } else {
      showErrorAuth = false;
      window.location.href = ".";
    }
  }

  function prepareWebAuthn(uid) {
    $("#webauthn_login_btn").unbind();
    $.ajax({
      url: "webauthn_options_for_get?uid=" + uid,
      type: "GET",
      dataType: "json",
      success: function (response) {
        if (!response) {
          return;
        }
        if (!navigator.credentials) {
          $("#webauthn_login_div").hide();
          console.warn("WebAuthn functionality unavailable. Ask your cloud administrator to enable TLS.");
        }
        $("#webauthn_login_btn").click(function () {
          WebAuthnJSON.get({ "publicKey": response }).then(authenticate)
          .catch(function(e) {
            $("#error_message").text(e.message);
            $("#error_box").fadeIn("slow");
            $("#login_spinner").hide();
          });
        });
      },
      error: function (response) {
        if (response.status == 501) {
          $("#webauthn_login_div").hide();
          console.warn("WebAuthn functionality unavailable. Ask your cloud administrator to upgrade the Ruby version.");
        }
      }
    });
  }

  function auth_error(req, error) {

    var status = error.error.http_status;

    switch (status){
    case 401:
      if (showErrorAuth) {
        $("#error_message").text(textTwoFactorTokenInvalid);
      } else {
        $("#error_message").text(textInvalidUserorPassword);
      }
      break;
    case 500:
      $("#error_message").text(textOpenNebulaNotRunning);
      break;
    case 0:
      $("#error_message").text(textNoAnswerFromServer);
      break;
    default:
      $("#error_message").text("Unexpected error. Status " + status + ". Check the server logs.");
    };
    $("#error_box").fadeIn("slow");
    $("#login_spinner").hide();
  }

  function authenticate(publicKeyCredential) {
    var username = $.trim($("#username").val());
    var password = $.trim($("#password").val());
    var remember = $("#check_remember").is(":checked");
    var two_factor_auth_token;
    var error_callback;
    if (publicKeyCredential == undefined) {
      two_factor_auth_token = $("#two_factor_auth_token").val();
      error_callback = auth_error;
    } else {
      two_factor_auth_token = JSON.stringify(publicKeyCredential);
      error_callback = function(req, error) {
        auth_error(req, error);
        prepareWebAuthn(uid);
      };
    }

    $("#error_box").fadeOut("slow");
    $("#login_spinner").show();

    OpenNebulaAuth.login({
      data: {
        username: username,
        password: password
      },
      remember: remember,
      success: auth_success,
      two_factor_auth_token: two_factor_auth_token,
      error: error_callback
    });
  }

  function getInternetExplorerVersion() {
    // Returns the version of Internet Explorer or a -1
    // (indicating the use of another browser).
    var rv = -1; // Return value assumes failure.
    if (navigator.appName == "Microsoft Internet Explorer") {
      var ua = navigator.userAgent;
      var re  = new RegExp("MSIE ([0-9]{1,}[.0-9]{0,})");
      if (re.exec(ua) != null)
          rv = parseFloat(RegExp.$1);
    }
    return rv;
  }

  function checkVersion() {
    var ver = getInternetExplorerVersion();

    if (ver > -1) {
      msg = ver <= 7.0 ? "You are using an old version of IE. \
  Please upgrade or use Firefox or Chrome for full compatibility." :
      "OpenNebula Sunstone is best seen with Chrome or Firefox";
      $("#error_box").text(msg);
      $("#error_box").fadeIn("slow");
    }
  }

  function limitToken(){
    $(idElementTwoFactor).off("input").on("input", function() {
      var element = $(this);
      if(element.attr("maxlength") && element.attr("maxlength") > 0){
        var value = element.val().replace(/[^0-9.]/g, "");
        if (value.length > element.attr("maxlength")){
          element.val(value.substr(0,15));
        }else{
          element.val(value);
        }
      }
    });
  }

  $(document).ready(function() {
    $("#login_form").submit(function () {
      limitToken();
      authenticate();
      return false;
    });

    $("#two_factor_auth_login_btn").click(function() {
      if($(idElementTwoFactor) && $(idElementTwoFactor).val().length){
        authenticate();
      }
      return false;
    });

    //compact login elements according to screen height
    if (screen.height <= 600) {
      $("div#logo_sunstone").css("top", "15px");
      $("div#login").css("top", "10px");
      $(".error_message").css("top", "10px");
    };

    $("input#username.box").focus();
    $("#login_spinner").hide();

    checkVersion();
  });
});
