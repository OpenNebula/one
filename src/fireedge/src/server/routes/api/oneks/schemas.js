/* ------------------------------------------------------------------------- *
 * Copyright 2002-2026, OpenNebula Project, OpenNebula Systems               *
 *                                                                           *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may   *
 * not use this file except in compliance with the License. You may obtain   *
 * a copy of the License at                                                  *
 *                                                                           *
 * http://www.apache.org/licenses/LICENSE-2.0                                *
 *                                                                           *
 * Unless required by applicable law or agreed to in writing, software       *
 * distributed under the License is distributed on an "AS IS" BASIS,         *
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  *
 * See the License for the specific language governing permissions and       *
 * limitations under the License.                                            *
 * ------------------------------------------------------------------------- */

const oneKsSchema = {
  id: '/Oneks',
  type: 'object',
  properties: {
    name: {
      type: 'string',
      required: true,
    },
    description: {
      type: 'string',
      required: false,
    },
    kubernetes_version: {
      type: 'string',
      required: true,
    },
    public_network: {
      type: 'integer',
      required: true,
    },
    private_network: {
      type: 'integer',
      required: true,
    },
    spec: {
      type: 'object',
      required: true,
      properties: {
        name: {
          type: 'string',
          required: true,
        },
        description: {
          type: 'string',
          required: false,
        },
        family: {
          type: 'string',
          required: false,
        },
        flavour: {
          type: 'string',
          required: true,
        },
        user_inputs_values: {
          type: 'object',
          required: true,
          additionalProperties: true,
        },
      },
    },
  },
}

const oneKsDeleteSchema = {
  id: '/OneKsDelete',
  type: 'object',
  properties: {
    force: {
      type: 'boolean',
      required: true,
    },
  },
}

const oneKsScaleNodeGroupSchema = {
  id: '/OneKsScaleNodeGroup',
  type: 'object',
  properties: {
    count: {
      type: 'integer',
      required: true,
    },
  },
}

const oneKsCreateNodeGroupSchema = {
  id: '/OneKsCreateNodeGroup',
  type: 'object',
  properties: {
    name: {
      type: 'string',
      required: true,
    },
    family: {
      type: 'string',
      required: false,
    },
    flavour: {
      type: 'string',
      required: true,
    },
    description: {
      type: 'string',
      required: false,
    },
    user_inputs_values: {
      type: 'object',
      required: false,
      additionalProperties: true,
    },
  },
}

module.exports = {
  oneKsSchema,
  oneKsDeleteSchema,
  oneKsScaleNodeGroupSchema,
  oneKsCreateNodeGroupSchema,
}
