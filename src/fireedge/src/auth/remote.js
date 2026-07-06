const { auth } = require('./base');
const { generateToken } = require('../token');

module.exports = {
  init: function(app) {
    app.use(async (req, res, next) => {
      const username = req.headers['x-auth-username'];
      if (username) {
        try {
          const token = await generateToken(username);
          res.cookie('FireedgeToken', token, { httpOnly: true, secure: false });
          req.session = { user: username, token: token };
          next();
        } catch (err) {
          next(err);
        }
      } else {
        next();
      }
    });
  }
};