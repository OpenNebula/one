/* ------------------------------------------------------------------------- *
 * Copyright 2002-2024, OpenNebula Project, OpenNebula Systems               *
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

const role = {
  id: '/Role',
  type: 'object',
  properties: {
    name: {
      type: 'string',
      required: true,
    },
    cardinality: {
      type: 'integer',
      default: 1,
      minimum: 0,
    },
    vm_template: {
      type: 'integer',
      required: true,
    },
    vm_template_contents: {
      type: 'string',
      required: false,
    },
    parents: {
      type: 'array',
      items: {
        type: 'string',
      },
    },
    shutdown_action: {
      type: 'string',
      enum: ['shutdown', 'shutdown-hard'],
      required: false,
    },
    min_vms: {
      type: 'integer',
      required: false,
      minimum: 0,
    },
    max_vms: {
      type: 'integer',
      required: false,
      minimum: 0,
    },
    cooldown: {
      type: 'integer',
      required: false,
      minimum: 0,
    },
    elasticity_policies: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            enum: ['CHANGE', 'CARDINALITY', 'PERCENTAGE_CHANGE'],
            required: true,
          },
          adjust: {
            type: 'integer',
            required: true,
          },
          min_adjust_step: {
            type: 'integer',
            required: false,
            minimum: 1,
          },
          period_number: {
            type: 'integer',
            required: false,
            minimum: 0,
          },
          period: {
            type: 'integer',
            required: false,
            minimum: 0,
          },
          expression: {
            type: 'string',
            required: true,
          },
          cooldown: {
            type: 'integer',
            required: false,
            minimum: 0,
          },
        },
      },
    },
    scheduled_policies: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            enum: ['CHANGE', 'CARDINALITY', 'PERCENTAGE_CHANGE'],
            required: true,
          },
          adjust: {
            type: 'integer',
            required: true,
          },
          min_adjust_step: {
            type: 'integer',
            required: false,
            minimum: 1,
          },
          start_time: {
            type: 'string',
            required: false,
          },
          recurrence: {
            type: 'string',
            required: false,
          },
        },
      },
    },
  },
}

const action = {
  id: '/Action',
  type: 'object',
  properties: {
    perform: {
      type: 'string',
      required: false,
    },
    // Not required for some actions
    params: {
      type: 'object',
      additionalProperties: true,
      required: false,
    },
  },
}

const service = {
  type: 'object',
  properties: {
    name: {
      type: 'string',
      required: true,
    },
    deployment: {
      type: 'string',
      enum: ['none', 'straight'],
      default: 'none',
    },
    description: {
      type: 'string',
      required: false,
    },
    shutdown_action: {
      type: 'string',
      enum: ['terminate', 'terminate-hard', 'shutdown', 'shutdown-hard'],
      required: false,
    },
    roles: {
      type: 'array',
      items: { $ref: '/Role' },
      required: true,
    },
    custom_attrs: {
      type: 'object',
      properties: {},
      required: false,
    },
    custom_attrs_values: {
      type: 'object',
      properties: {},
      required: false,
    },
    networks: {
      type: 'object',
      properties: {},
      required: false,
    },
    networks_values: {
      type: 'array',
      items: {
        type: 'object',
        properties: {},
      },
      required: false,
    },
    ready_status_gate: {
      type: 'boolean',
      required: false,
    },
  },
}

const schemas = { role, service, action }

module.exports = schemas
