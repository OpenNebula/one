/* Copyright 2002-2019, OpenNebula Project, OpenNebula Systems                */
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

const { Map } = require('immutable');
const { getConfig } = require('../utils/yml-connect');
const moment = require('moment');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');

const {
  httpMethod,
  defaultNamespace,
  defaultMethodLogin,
  defaultMethodUserInfo,
  defaultMethodUserUpdate,
  default2FAIssuer,
  default2FAOpennebulaVar,
  default2FAOpennebulaTmpVar
} = require('./defaults');
const {
  ok,
  unauthorized,
  internalServerError
} = require('../config/http-codes');
const { from: fromData } = require('../config/defaults');
const { createToken } = require('../utils/jwt-functions');
const {
  responseOpennebula,
  checkOpennebulaCommand,
  paramsDefaultByCommandOpennebula,
  generateNewTemplate
} = require('../utils/opennebula-functions');

// user config
const appConfig = getConfig();

const limitToken = appConfig.LIMIT_TOKEN;
const namespace = appConfig.NAMESPACE || defaultNamespace;
const twoFactorAuthIssuer =
  appConfig.TWO_FACTOR_AUTH_ISSUER || default2FAIssuer;

const { POST, GET, DELETE } = httpMethod;

const getUserInfoAuthenticated = (connect, userId, callback, next) => {
  if (
    connect &&
    !!userId &&
    callback &&
    next &&
    typeof connect === 'function' &&
    typeof callback === 'function' &&
    typeof next === 'function' &&
    defaultMethodUserInfo
  ) {
    const connectOpennebula = connect();
    const dataUser = {};
    // empty positions for validate...
    dataUser[fromData.resource] = {};
    dataUser[fromData.query] = {};
    dataUser[fromData.postBody] = {};
    dataUser[fromData.resource].id = userId;
    const getOpennebulaMethod = checkOpennebulaCommand(
      defaultMethodUserInfo,
      GET
    );
    connectOpennebula(
      defaultMethodUserInfo,
      getOpennebulaMethod(dataUser),
      (err, value) => {
        responseOpennebula(
          () => undefined,
          err,
          value,
          info => {
            if (info !== undefined && info !== null) {
              callback(info);
            } else {
              next();
            }
          },
          next
        );
      }
    );
  }
};

const privateRoutes = {
  '2fqr': {
    httpMethod: POST,
    action: (req, res, next, connect, userId) => {
      const secret = speakeasy.generateSecret({
        length: 10,
        name: twoFactorAuthIssuer
      });
      if (secret && secret.otpauth_url && secret.base32) {
        const { otpauth_url: otpURL, base32 } = secret;
        qrcode.toDataURL(otpURL, (err, dataURL) => {
          if (err) {
            res.locals.httpCode = Map(internalServerError).toObject();
            next();
          } else {
            const connectOpennebula = connect();
            getUserInfoAuthenticated(
              connect,
              userId,
              info => {
                if (info && info.USER && info.USER.TEMPLATE && req) {
                  const dataUser = Map(req).toObject();
                  const emptyTemplate = {};
                  emptyTemplate[default2FAOpennebulaTmpVar] = base32;

                  dataUser[fromData.resource].id = userId;
                  dataUser[fromData.postBody].template = generateNewTemplate(
                    info.USER.TEMPLATE.SUNSTONE || {},
                    emptyTemplate,
                    [default2FAOpennebulaVar]
                  );
                  const getOpennebulaMethod = checkOpennebulaCommand(
                    defaultMethodUserUpdate,
                    POST
                  );
                  connectOpennebula(
                    defaultMethodUserUpdate,
                    getOpennebulaMethod(dataUser),
                    (error, value) => {
                      responseOpennebula(
                        () => undefined,
                        error,
                        value,
                        pass => {
                          if (pass !== undefined && pass !== null) {
                            const codeOK = Map(ok).toObject();
                            codeOK.data = {
                              img: dataURL
                            };
                            res.locals.httpCode = codeOK;
                            next();
                          } else {
                            next();
                          }
                        },
                        next
                      );
                    }
                  );
                } else {
                  next();
                }
              },
              next
            );
          }
        });
      } else {
        next();
      }
    }
  },
  '2fsetup': {
    httpMethod: POST,
    action: (req, res, next, connect, userId) => {
      const connectOpennebula = connect();
      getUserInfoAuthenticated(
        connect,
        userId,
        info => {
          if (
            info &&
            info.USER &&
            info.USER.TEMPLATE &&
            info.USER.TEMPLATE.SUNSTONE &&
            info.USER.TEMPLATE.SUNSTONE[default2FAOpennebulaTmpVar] &&
            fromData &&
            fromData.postBody &&
            req &&
            req[fromData.postBody] &&
            req[fromData.postBody].token
          ) {
            const sunstone = info.USER.TEMPLATE.SUNSTONE;
            const token = req[fromData.postBody].token;
            const secret = sunstone[default2FAOpennebulaTmpVar];
            const verified = speakeasy.totp.verify({
              secret,
              encoding: 'base32',
              token
            });
            if (verified) {
              const emptyTemplate = {};
              emptyTemplate[default2FAOpennebulaVar] = secret;

              const dataUser = Map(req).toObject();
              dataUser[fromData.resource].id = userId;
              dataUser[fromData.postBody].template = generateNewTemplate(
                sunstone || {},
                emptyTemplate,
                [default2FAOpennebulaTmpVar]
              );
              const getOpennebulaMethodUpdate = checkOpennebulaCommand(
                defaultMethodUserUpdate,
                POST
              );
              connectOpennebula(
                defaultMethodUserUpdate,
                getOpennebulaMethodUpdate(dataUser),
                (err, value) => {
                  responseOpennebula(
                    () => undefined,
                    err,
                    value,
                    pass => {
                      if (pass !== undefined && pass !== null) {
                        const codeOK = Map(ok).toObject();
                        res.locals.httpCode = codeOK;
                      }
                      next();
                    },
                    next
                  );
                }
              );
            } else {
              res.locals.httpCode = Map(unauthorized).toObject();
              next();
            }
          } else {
            next();
          }
        },
        next
      );
    }
  },
  '2fdelete': {
    httpMethod: DELETE,
    action: (req, res, next, connect, userId) => {
      const connectOpennebula = connect();
      getUserInfoAuthenticated(
        connect,
        userId,
        info => {
          if (
            info &&
            info.USER &&
            info.USER.TEMPLATE &&
            info.USER.TEMPLATE.SUNSTONE
          ) {
            const emptyTemplate = {};
            const dataUser = Map(req).toObject();
            dataUser[fromData.resource].id = userId;
            dataUser[fromData.postBody].template = generateNewTemplate(
              info.USER.TEMPLATE.SUNSTONE || {},
              emptyTemplate,
              [default2FAOpennebulaTmpVar, default2FAOpennebulaVar]
            );
            const getOpennebulaMethodUpdate = checkOpennebulaCommand(
              defaultMethodUserUpdate,
              POST
            );
            connectOpennebula(
              defaultMethodUserUpdate,
              getOpennebulaMethodUpdate(dataUser),
              (err, value) => {
                responseOpennebula(
                  () => undefined,
                  err,
                  value,
                  pass => {
                    if (pass !== undefined && pass !== null) {
                      const codeOK = Map(ok).toObject();
                      res.locals.httpCode = codeOK;
                    }
                    next();
                  },
                  next
                );
              }
            );
          } else {
            next();
          }
        },
        next
      );
    }
  }
};

const publicRoutes = {
  auth: {
    httpMethod: POST,
    action: (req, res, next, connect) => {
      const updaterResponse = code => {
        if (
          'id' in code &&
          'message' in code &&
          res &&
          res.locals &&
          res.locals.httpCode
        ) {
          res.locals.httpCode = code;
        }
      };
      updaterResponse(Map(internalServerError).toObject());

      const getOpennebulaMethod = checkOpennebulaCommand(
        defaultMethodLogin,
        POST
      );

      if (req && getOpennebulaMethod) {
        const user =
          (req &&
            fromData.postBody &&
            req[fromData.postBody] &&
            req[fromData.postBody].user) ||
          '';

        const pass =
          (req &&
            fromData.postBody &&
            req[fromData.postBody] &&
            req[fromData.postBody].pass) ||
          '';

        const token =
          (req && req[fromData.postBody] && req[fromData.postBody].token) || '';

        const extended =
          (req && req[fromData.postBody] && req[fromData.postBody].extended) ||
          '';

        if (user && pass && connect && limitToken) {
          const { MIN, MAX } = limitToken;

          const now = moment();
          const nowUnix = now.unix();
          const nowWithDays = moment().add(extended ? MAX : MIN, 'days');
          const relativeTime = nowWithDays.diff(now, 'seconds');

          let opennebulaToken;
          const connectOpennebula = connect(
            user,
            pass
          );
          const dataSourceWithExpirateDate = Map(req).toObject();

          const userInfo = userData => {
            if (user && opennebulaToken && userData && userData.USER) {
              const informationUser = userData.USER;

              // remove opennebula user tokens
              if (
                informationUser.LOGIN_TOKEN &&
                Array.isArray(informationUser.LOGIN_TOKEN)
              ) {
                informationUser.LOGIN_TOKEN.map(loginToken => {
                  if (
                    loginToken &&
                    loginToken.TOKEN &&
                    loginToken.TOKEN !== opennebulaToken
                  ) {
                    dataSourceWithExpirateDate[fromData.postBody].expire = 0;
                    dataSourceWithExpirateDate[fromData.postBody].token =
                      loginToken.TOKEN;

                    connectOpennebula(
                      defaultMethodLogin,
                      getOpennebulaMethod(dataSourceWithExpirateDate),
                      (err, value) => {
                        responseOpennebula(
                          () => undefined,
                          err,
                          value,
                          () => undefined,
                          next
                        );
                      }
                    );
                  }
                });
              }

              // validate 2fa token
              if (
                informationUser.TEMPLATE &&
                informationUser.TEMPLATE.SUNSTONE &&
                informationUser.TEMPLATE.SUNSTONE[default2FAOpennebulaVar]
              ) {
                const secret =
                  informationUser.TEMPLATE.SUNSTONE[default2FAOpennebulaVar];
                const verified = speakeasy.totp.verify({
                  secret,
                  encoding: 'base32',
                  token
                });
                if (!verified) {
                  const codeUnauthorized = Map(unauthorized).toObject();
                  codeUnauthorized.data = { message: 'invalid 2fa token' };
                  updaterResponse(codeUnauthorized);
                  next();
                }
              }

              // generate jwt
              const { ID: id } = informationUser;
              const dataJWT = { id, user, token: opennebulaToken };
              const jwt = createToken(
                dataJWT,
                nowUnix,
                nowWithDays.format('X')
              );
              if (jwt) {
                const codeOK = Map(ok).toObject();
                codeOK.data = { token: jwt };
                updaterResponse(codeOK);
              }
              next();
            } else {
              next();
            }
          };

          const authenticated = val => {
            const findTextError = `[${namespace + defaultMethodLogin}]`;
            if (val) {
              if (val.indexOf(findTextError) >= 0) {
                const codeUnauthorized = Map(unauthorized).toObject();
                updaterResponse(codeUnauthorized);
                next();
              } else {
                opennebulaToken = val;
                connectOpennebula(
                  defaultMethodUserInfo,
                  paramsDefaultByCommandOpennebula(defaultMethodUserInfo, GET),
                  (err, value) => {
                    responseOpennebula(
                      updaterResponse,
                      err,
                      value,
                      userInfo,
                      next
                    );
                  }
                );
              }
            } else {
              next();
            }
          };

          // add expire time unix for opennebula creation token
          dataSourceWithExpirateDate[fromData.postBody].expire = relativeTime;

          connectOpennebula(
            defaultMethodLogin,
            getOpennebulaMethod(dataSourceWithExpirateDate),
            (err, value) => {
              responseOpennebula(
                updaterResponse,
                err,
                value,
                authenticated,
                next
              );
            }
          );
        } else {
          res.locals.httpCode = Map(unauthorized).toObject();
          next();
        }
      } else {
        next();
      }
    }
  },
  zendesk: {
    httpMethod: POST,
    action: (req, res, next) => {
      next();
      console.log('zendesk');
    }
  },
  latest: {
    httpMethod: POST,
    action: (req, res, next) => {
      next();
      console.log('latest version opennebula');
    }
  },
  support: {
    httpMethod: POST,
    action: (req, res, next) => {
      next();
      console.log('support token');
    }
  }
};

const functionRoutes = {
  private: privateRoutes,
  public: publicRoutes
};

module.exports = functionRoutes;
