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
   * Object which represents a thumbnail of the Guacamole client display,
   * along with the time that the thumbnail was generated.
   *
   * @constructor
   * @param {ManagedClientThumbnail|Object} [template = {}]
   *     The object whose properties should be copied within the new
   *     ManagedClientThumbnail.
   */
  function ManagedClientThumbnail(template = {}) {
    /**
     * The time that this thumbnail was generated, as the number of
     * milliseconds elapsed since midnight of January 1, 1970 UTC.
     *
     * @type Number
     */
    this.timestamp = template.timestamp;

    /**
     * The thumbnail of the Guacamole client display.
     *
     * @type HTMLCanvasElement
     */
    this.canvas = template.canvas;
  };

  return ManagedClientThumbnail;

});