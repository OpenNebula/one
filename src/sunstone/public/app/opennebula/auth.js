define(function(require) {
  var OpenNebulaHelper = require('./helper');

  var RESOURCE = "AUTH";

  var Auth = {
    "login": function(params) {
      var callback = params.success;
      var callbackError = params.error;
      var username = params.data.username;
      var password = params.data.password;
      var remember = params.remember;

      var request = OpenNebulaHelper.request(RESOURCE, "login");

      $.ajax({
        url: "login",
        type: "POST",
        data: {remember: remember},
        beforeSend : function(req) {
          var token = username + ':' + password;
          var authString = 'Basic ';
          if (typeof(btoa) === 'function')
              authString += btoa(unescape(encodeURIComponent(token)))
          else {
            token = CryptoJS.enc.Utf8.parse(token);
            authString += CryptoJS.enc.Base64.stringify(token)
          }

          req.setRequestHeader("Authorization", authString);
        },
        success: function(response) {
          return callback ? callback(request, response) : null;
        },
        error: function(response) {
          return callbackError ?
              callbackError(request, OpenNebula.Error(response)) : null;
        }
      });
    },

    "logout": function(params) {
      var callback = params.success;
      var callbackError = params.error;

      var request = OpenNebulaHelper.request(RESOURCE, "logout");

      $.ajax({
        url: "logout",
        type: "POST",
        success: function(response) {
          // TODO $.cookie("one-user", null);
          return callback ? callback(request, response) : null;
        },
        error: function(response) {
          return callbackError ?
              callbackError(request, OpenNebula.Error(response)) : null;
        }
      });
    }
  }

  return Auth;
})
