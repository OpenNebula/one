define(function(require) {
  var Error = function(resp) {
    var error = {};
    if (resp.responseText) {
      try {
        error = JSON.parse(resp.responseText);
      }
      catch (e) {
        error.error = {message: "It appears there was a server exception. Please check server's log."};
      };
    } else {
      error.error = {};
    }
    error.error.http_status = resp.status;
    return error;
  }

  return Error;
})
