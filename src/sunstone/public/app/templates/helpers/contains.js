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
  /**
   * Block helper that renders the block if `collection` has the
   * given `value`, using strict equality (`===`) for comparison,
   * otherwise the inverse block is rendered (if specified). If a
   * `startIndex` is specified and is negative, it is used as the
   * offset from the end of the collection.
   *
   * ```handlebars
   * <!-- array = ['a', 'b', 'c'] -->
   * {{#contains array "d"}}
   *   This will not be rendered.
   * {{else}}
   *   This will be rendered.
   * {{/contains}}
   * ```
   * @param {Array|Object|String} `collection` The collection to iterate over.
   * @param {any} `value` The value to check for.
   * @param {Number} `[startIndex=0]` Optionally define the starting index.
   * @param {Object} `options` Handlebars provided options object.
   * @block
   * @api public
   */

  var Handlebars = require('hbs/handlebars');

  function isFunction(val) {
    return typeof val === 'function';
  };

  function isObject(val) {
    return typeof val === 'object';
  };

  function isOptions(val) {
    return isObject(val) && isObject(val.hash);
  };

  function isBlock(options) {
    return isOptions(options) && isFunction(options.fn) && isFunction(options.inverse)
  };

  function getValue(val, context, options) {
    if (isOptions(val)) {
      return getValue(null, val, options);
    }

    if (isOptions(context)) {
      return getValue(val, {}, context);
    }

    if (isBlock(options)) {
      return !!val ? options.fn(context) : options.inverse(context);
    }

    return val;
  };

  var contains = function(collection, value, startIndex, options) {
    if (typeof startIndex === 'object') {
      options = startIndex;
      startIndex = undefined;
    }

    let val = (collection === null || value === null || isNaN(collection.length))
      ? false
      : collection.indexOf(value, startIndex) !== -1;

    return getValue(val, this, options);
  };

  Handlebars.registerHelper('contains', contains);

  return contains;
});


























