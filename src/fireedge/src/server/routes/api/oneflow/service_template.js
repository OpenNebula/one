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
const { conectionOneFlow } = require('./functions');
const { role, service, action } = require('./schemas');
const { httpMethod } = require('server/utils/constants/defaults');
const { from: fromData } = require('server/utils/constants/defaults');
const { httpResponse } = require('server/utils/server');
const {
  methodNotAllowed,
  internalServerError
} = require('server/utils/constants/http-codes');
const { parsePostData, returnSchemaError } = require('./functions');

const { GET, POST, DELETE, PUT } = httpMethod;

const serviceTemplate = (req, res, next, connect, zone, user) => {
  if (req && res && user && next) {
    if (
      req &&
      fromData &&
      fromData.resource &&
      req[fromData.resource] &&
      req[fromData.resource].method
    ) {
      conectionOneFlow(res, next, GET, user, `/service_template/{0}`, [
        req[fromData.resource].method
      ]);
    } else {
      conectionOneFlow(res, next, GET, user, '/service_template');
    }
  } else {
    next();
  }
};

const serviceTemplateDelete = (req, res, next, connect, zone, user) => {
  if (req && res && user && next) {
    if (
      req &&
      fromData &&
      fromData.resource &&
      req[fromData.resource] &&
      req[fromData.resource].method
    ) {
      conectionOneFlow(res, next, DELETE, user, `/service_template/{0}`, [
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

const serviceTemplateCreate = (req, res, next, connect, zone, user) => {
  if (req && res && user && next) {
    if (req && fromData && fromData.postBody && req[fromData.postBody]) {
      const postService = parsePostData(req[fromData.postBody]);
      const v = new Validator();
      v.addSchema(role, '/Role');
      const valSchema = v.validate(postService, service);
      if (valSchema.valid) {
        conectionOneFlow(
          res,
          next,
          POST,
          user,
          `/service_template`,
          '',
          postService
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
        'invalid service json'
      );
      next();
    }
  } else {
    next();
  }
};

const serviceTemplateUpdate = (req, res, next, connect, zone, user) => {
  if (req && res && user && next) {
    if (
      req &&
      fromData &&
      fromData.postBody &&
      fromData.resource &&
      req[fromData.postBody] &&
      req[fromData.resource] &&
      req[fromData.resource].method
    ) {
      const postService = parsePostData(req[fromData.postBody]);
      const v = new Validator();
      v.addSchema(role, '/Role');
      const valSchema = v.validate(postService, service);
      if (valSchema.valid) {
        conectionOneFlow(
          res,
          next,
          PUT,
          user,
          `/service_template/{0}`,
          [req[fromData.resource].method],
          postService
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
        'invalid service json or id'
      );
      next();
    }
  } else {
    next();
  }
};

const serviceTemplateAction = (req, res, next, connect, zone, user) => {
  if (req && res && user && next) {
    if (
      req &&
      fromData &&
      fromData.postBody &&
      fromData.resource &&
      req[fromData.postBody] &&
      req[fromData.resource] &&
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
          `/service_template/{0}/action`,
          [req[fromData.resource].method],
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

const serviceTemplateApi = {
  serviceTemplate,
  serviceTemplateDelete,
  serviceTemplateCreate,
  serviceTemplateUpdate,
  serviceTemplateAction
};
module.exports = serviceTemplateApi;
