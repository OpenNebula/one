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
const { Validator } = require('jsonschema');
const { action } = require('./schemas');
const { conectionOneFlow } = require('./functions');
const { httpMethod } = require('server/utils/constants/defaults');
const { from: fromData } = require('server/utils/constants/defaults');
const { httpResponse } = require('server/utils/server');
const {
  methodNotAllowed,
  internalServerError
} = require('server/utils/constants/http-codes');
const { parsePostData, returnSchemaError } = require('./functions');

const { GET, POST, DELETE } = httpMethod;

const service = (req, res, next, connect, zone, user) => {
  if (req && res && user && next) {
    if (
      req &&
      fromData &&
      fromData.resource &&
      req[fromData.resource] &&
      req[fromData.resource].method
    ) {
      conectionOneFlow(
        res,
        next,
        GET,
        user,
        `/service/{0}`,
        req[fromData.resource].method
      );
    } else {
      conectionOneFlow(res, next, GET, user, '/service');
    }
  } else {
    next();
  }
};

const serviceDelete = (req, res, next, connect, zone, user) => {
  if (req && res && user && next) {
    if (
      req &&
      fromData &&
      fromData.resource &&
      req[fromData.resource] &&
      req[fromData.resource].method
    ) {
      conectionOneFlow(res, next, DELETE, user, `/service/{0}`, [
        req[fromData.resource].method
      ]);
    } else {
      res.locals.httpCode = httpResponse(
        methodNotAllowed,
        '',
        'invalid id service'
      );
      next();
    }
  } else {
    next();
  }
};

const serviceAddAction = (req, res, next, connect, zone, user) => {
  if (req && res && user && next) {
    if (
      req &&
      fromData &&
      fromData.resource &&
      fromData.postBody &&
      req[fromData.resource] &&
      req[fromData.postBody] &&
      req[fromData.resource].method
    ) {
      const postAction = parsePostData(req[fromData.postBody]);
      const v = new Validator();
      const valSchema = v.validate(postAction, action);
      if (valSchema.valid) {
        conectionOneFlow(
          res,
          next,
          POST,
          user,
          `/service/{0}/action`,
          req[fromData.resource].method,
          postAction
        );
      } else {
        res.locals.httpCode = httpResponse(
          internalServerError,
          '',
          `invalid schema ${returnSchemaError(valSchema.errors)}`
        );
        next();
      }
    } else {
      res.locals.httpCode = httpResponse(
        methodNotAllowed,
        '',
        'invalid action or id'
      );
      next();
    }
  } else {
    next();
  }
};

const serviceAddScale = (req, res, next, connect, zone, user) => {
  if (req && res && user && next) {
    if (
      req &&
      fromData &&
      fromData.resource &&
      fromData.postBody &&
      req[fromData.resource] &&
      req[fromData.postBody] &&
      req[fromData.resource].method
    ) {
      const postAction = parsePostData(req[fromData.postBody]);
      const v = new Validator();
      const valSchema = v.validate(postAction, action);
      if (valSchema.valid) {
        conectionOneFlow(
          res,
          next,
          POST,
          user,
          `/service/{0}/action`,
          req[fromData.resource].method,
          postAction
        );
      } else {
        res.locals.httpCode = httpResponse(
          internalServerError,
          '',
          `invalid schema ${returnSchemaError(valSchema.errors)}`
        );
        next();
      }
    } else {
      res.locals.httpCode = httpResponse(
        methodNotAllowed,
        '',
        'invalid action or id'
      );
      next();
    }
  } else {
    next();
  }
};

const serviceAddRoleAction = (req, res, next, connect, zone, user) => {
  if (req && res && user && next) {
    if (
      req &&
      fromData &&
      fromData.resource &&
      fromData.postBody &&
      req[fromData.resource] &&
      req[fromData.postBody] &&
      req[fromData.resource].method &&
      req[fromData.resource].id
    ) {
      const postAction = parsePostData(req[fromData.postBody]);
      const v = new Validator();
      const valSchema = v.validate(postAction, action);
      if (valSchema.valid) {
        conectionOneFlow(
          res,
          next,
          POST,
          user,
          `/service/{0}/role/{1}`,
          [req[fromData.resource].method, req[fromData.resource].id],
          postAction
        );
      } else {
        res.locals.httpCode = httpResponse(
          internalServerError,
          '',
          `invalid schema ${returnSchemaError(valSchema.errors)}`
        );
        next();
      }
    } else {
      res.locals.httpCode = httpResponse(
        methodNotAllowed,
        '',
        'invalid action or id'
      );
      next();
    }
  } else {
    next();
  }
};

const serviceApi = {
  service,
  serviceDelete,
  serviceAddAction,
  serviceAddScale,
  serviceAddRoleAction
};
module.exports = serviceApi;
