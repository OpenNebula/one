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
const { DateTime } = require('luxon');
const { Map } = require('immutable');
const {
  httpMethod,
  defaultMethodLogin,
  defaultMethodZones,
  defaultMethodUserInfo,
  default2FAOpennebulaVar,
  defaultNamespace,
  from: fromData
} = require('server/utils/constants/defaults');
const { getConfig } = require('server/utils/yml');
const {
  ok,
  unauthorized,
  accepted
} = require('server/utils/constants/http-codes');
const { createToken } = require('server/utils/jwt');
const { httpResponse } = require('server/utils/server');
const {
  responseOpennebula,
  paramsDefaultByCommandOpennebula,
  checkOpennebulaCommand,
  check2Fa
} = require('server/utils/opennebula');

const appConfig = getConfig();

const namespace = appConfig.NAMESPACE || defaultNamespace;
const { GET, POST } = httpMethod;

const getOpennebulaMethod = checkOpennebulaCommand(defaultMethodLogin, POST);

let opennebulaToken = '';
let user = '';
let pass = '';
let tfatoken = '';
let extended = '';
let next = () => undefined;
let req = {};
let res = {};
let nodeConnect = () => undefined;
let now = '';
let nowUnix = '';
let nowWithDays = '';
let relativeTime = '';

const dataSourceWithExpirateDate = () => Map(req).toObject();

const getUser = () => user;
const getPass = () => pass;
const getRelativeTime = () => relativeTime;

const setUser = newUser => {
  user = newUser;
  return user;
};

const setPass = newPass => {
  pass = newPass;
  return pass;
};

const setTfaToken = newTfaToken => {
  tfatoken = newTfaToken;
  return tfatoken;
};

const setExtended = newExtended => {
  extended = newExtended;
  return extended;
};
const setNext = newNext => {
  next = newNext;
  return next;
};
const setReq = newReq => {
  req = newReq;
  return req;
};
const setNodeConnect = newConnect => {
  nodeConnect = newConnect;
  return nodeConnect;
};

const setRes = newRes => {
  res = newRes;
  return res;
};

const setDates = () => {
  const limitToken = appConfig.LIMIT_TOKEN;
  const { MIN, MAX } = limitToken;
  now = DateTime.local();
  nowUnix = now.toSeconds();
  nowWithDays = now.plus({ days: extended ? MAX : MIN });
  const diff = nowWithDays.diff(now, 'seconds');
  relativeTime = diff.seconds;
};

const connectOpennebula = () => nodeConnect(user, pass);

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

const validate2faAuthentication = informationUser => {
  if (
    informationUser.TEMPLATE &&
    informationUser.TEMPLATE.SUNSTONE &&
    informationUser.TEMPLATE.SUNSTONE[default2FAOpennebulaVar]
  ) {
    if (tfatoken.length <= 0) {
      updaterResponse(httpResponse(accepted));
      next();
      return;
    }

    const secret = informationUser.TEMPLATE.SUNSTONE[default2FAOpennebulaVar];
    if (!check2Fa(secret, tfatoken)) {
      updaterResponse(httpResponse(unauthorized, '', 'invalid 2fa token'));
      next();
    }
  }
};

const genJWT = informationUser => {
  if (informationUser && informationUser.ID && informationUser.PASSWORD) {
    const { ID: id, TEMPLATE: userTemplate } = informationUser;
    const dataJWT = { id, user, token: opennebulaToken };
    const jwt = createToken(dataJWT, nowUnix, nowWithDays.toSeconds());
    if (jwt) {
      if (!global.users) {
        global.users = {};
      }
      global.users[user] = opennebulaToken;
      const rtn = { token: jwt, id };
      if (userTemplate && userTemplate.SUNSTONE && userTemplate.SUNSTONE.LANG) {
        rtn.language = userTemplate.SUNSTONE.LANG;
      }
      updaterResponse(httpResponse(ok, rtn));
    }
  }
};

const setZones = () => {
  if (global && !global.zones) {
    const oneConnect = connectOpennebula();
    const dataSource = dataSourceWithExpirateDate();
    oneConnect(
      defaultMethodZones,
      getOpennebulaMethod(dataSource),
      (err, value) => {
        // res, err, value, response, next
        responseOpennebula(
          () => undefined,
          err,
          value,
          zonesOpennebula => {
            if (
              zonesOpennebula &&
              zonesOpennebula.ZONE_POOL &&
              zonesOpennebula.ZONE_POOL.ZONE
            ) {
              const oneZones = !Array.isArray(zonesOpennebula.ZONE_POOL.ZONE)
                ? [zonesOpennebula.ZONE_POOL.ZONE]
                : zonesOpennebula.ZONE_POOL.ZONE;
              global.zones = oneZones.map(oneZone => ({
                ID: oneZone.ID || '',
                NAME: oneZone.NAME || '',
                RPC:
                  (oneZone && oneZone.TEMPLATE && oneZone.TEMPLATE.ENDPOINT) ||
                  ''
              }));
            }
          },
          next
        );
      }
    );
  }
};

const setOneConfig = () => {
  if (global && global.oneConfig && global.oneConfig.length === 0) {
    console.log('setConfig');
  }
};

const userInfo = userData => {
  if (user && opennebulaToken && userData && userData.USER) {
    const informationUser = userData.USER;
    // remove opennebula user tokens
    if (
      informationUser.LOGIN_TOKEN &&
      Array.isArray(informationUser.LOGIN_TOKEN)
    ) {
      informationUser.LOGIN_TOKEN.forEach(loginToken => {
        if (
          loginToken &&
          loginToken.TOKEN &&
          loginToken.TOKEN !== opennebulaToken
        ) {
          const dataSource = dataSourceWithExpirateDate();
          dataSource[fromData.postBody].expire = 0;
          dataSource[fromData.postBody].token = loginToken.TOKEN;
          const oneConnect = connectOpennebula();
          oneConnect(
            defaultMethodLogin,
            getOpennebulaMethod(dataSource),
            (err, value) => {
              responseOpennebula(
                () => undefined,
                err,
                value,
                () => {
                  setZones();
                  setOneConfig(); // esto debe de estar antes de hacer el JWT
                },
                next
              );
            }
          );
        }
      });
    }
    validate2faAuthentication(informationUser);
    genJWT(informationUser);
    next();
  } else {
    next();
  }
};

const authenticate = val => {
  const findTextError = `[${namespace + defaultMethodLogin}]`;
  if (val) {
    if (val.indexOf(findTextError) >= 0) {
      updaterResponse(httpResponse(unauthorized));
      next();
    } else {
      const oneConnect = connectOpennebula();
      opennebulaToken = val;
      oneConnect(
        defaultMethodUserInfo,
        paramsDefaultByCommandOpennebula(defaultMethodUserInfo, GET),
        (err, value) => {
          responseOpennebula(updaterResponse, err, value, userInfo, next);
        }
      );
    }
  } else {
    next();
  }
};

const functionRoutes = {
  authenticate,
  getUser,
  getPass,
  setUser,
  setPass,
  setTfaToken,
  setExtended,
  setNext,
  setReq,
  setRes,
  updaterResponse,
  setNodeConnect,
  connectOpennebula,
  setDates,
  getRelativeTime
};

module.exports = functionRoutes;
