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

define(function() {

  /**
   * Arbitrary data which can be contained by the clipboard.
   *
   * @constructor
   * @param {ClipboardData|Object} [template = {}]
   *     The object whose properties should be copied within the new
   *     ClipboardData.
   */
   function ClipboardData(template = {}) {
    /**
     * The mimetype of the data currently stored within the clipboard.
     *
     * @type String
     */
    this.type = template.type || 'text/plain';

    /**
     * The data currently stored within the clipboard. Depending on the
     * nature of the stored data, this may be either a String, a Blob, or a
     * File.
     *
     * @type String|Blob|File
     */
    this.data = template.data || '';
  };

  return ClipboardData;

});