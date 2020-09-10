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
const {
  private: authenticated,
  public: nonAuthenticated
} = require('../../../api');
const { httpCodes, params } = require('../../../../utils/constants');
const {
  validateAuth,
  getAllowedQueryParams,
  createParamsState,
  createQueriesState
} = require('../../../../utils');

const defaultParams = Map(createParamsState());
const defaultQueries = Map(createQueriesState());

let paramsState = defaultParams.toObject();
let queriesState = defaultQueries.toObject();
let idUserOpennebula = '';
let userOpennebula = '';
let passOpennebula = '';

const getParamsState = () => paramsState;
const getQueriesState = () => queriesState;
const getIdUserOpennebula = () => idUserOpennebula;
const getUserOpennebula = () => userOpennebula;
const getPassOpennebula = () => passOpennebula;

const validateResource = (req, res, next) => {
  const { badRequest, unauthorized, serviceUnavailable } = httpCodes;
  let status = badRequest;
  if (req && req.params && req.params.resource) {
    const resource = req.params.resource;
    status = serviceUnavailable;
    const finderCommand = rtnCommand =>
      rtnCommand && rtnCommand.endpoint && rtnCommand.endpoint === resource;
    if (authenticated.some(finderCommand)) {
      const session = validateAuth(req);
      if (
        session &&
        'iss' in session &&
        'aud' in session &&
        'jti' in session &&
        'iat' in session &&
        'exp' in session
      ) {
        idUserOpennebula = session.iss;
        userOpennebula = session.aud;
        passOpennebula = session.jti;
        if (process.env.ssr) {
          if (
            global &&
            global.users &&
            global.users[userOpennebula] &&
            global.users[userOpennebula] === passOpennebula
          ) {
            next();
            return;
          }
        } else {
          next();
          return;
        }
      }
      status = unauthorized;
    }
    if (nonAuthenticated.some(finderCommand)) {
      next();
      return;
    }
  }
  res.status(status.id).json(status);
};

const optionalParameters = (req, res, next) => {
  if (req && req.params) {
    let start = true;
    const keys = Object.keys(req.params);
    keys.forEach(param => {
      if (start) {
        start = false;
        return start;
      }
      if (req.params[param]) {
        const matches = req.params[param].match(/(^[\w]*=)/gi);
        if (matches && matches[0]) {
          params.forEach(parameter => {
            if (
              matches[0].replace(/=/g, '').toLowerCase() ===
              parameter.toLowerCase()
            ) {
              const removeKey = new RegExp(`^${parameter}=`, 'i');
              if (paramsState[parameter] === null) {
                paramsState[parameter] = req.params[param].replace(
                  removeKey,
                  ''
                );
              }
            }
          });
        } else {
          paramsState[param] = req.params[param];
        }
      }
      return '';
    });
  }
  next();
};

const optionalQueries = (req, res, next) => {
  if (req && req.query) {
    const keys = Object.keys(req.query);
    const queries = getAllowedQueryParams();
    keys.forEach(query => {
      if (req.query[query] && queries.includes(query)) {
        queriesState[query] = req.query[query];
      }
    });
  }
  next();
};

const clearStates = () => {
  paramsState = defaultParams.toObject();
  queriesState = defaultQueries.toObject();
  idUserOpennebula = '';
  userOpennebula = '';
  passOpennebula = '';
};

module.exports = {
  validateResource,
  optionalParameters,
  optionalQueries,
  clearStates,
  getParamsState,
  getQueriesState,
  getIdUserOpennebula,
  getUserOpennebula,
  getPassOpennebula
};
