/* ------------------------------------------------------------------------- *
 * Copyright 2002-2023, OpenNebula Project, OpenNebula Systems               *
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

const provision = {
  id: '/Provision',
  type: 'object',
  properties: {
    name: {
      type: 'string',
      required: true,
    },
    defaults: {
      type: 'object',
      required: true,
      properties: {
        provision: {
          type: 'object',
          properties: {
            driver: {
              type: 'string',
            },
            packet_token: {
              type: 'string',
            },
            packet_project: {
              type: 'string',
            },
            metro: {
              type: 'string',
            },
            plan: {
              type: 'string',
            },
            os: {
              type: 'string',
            },
          },
        },
        configuration: {
          type: 'object',
        },
      },
    },
    hosts: {
      type: 'array',
      required: true,
      items: {
        type: 'object',
        properties: {
          reserved_cpu: {
            type: 'integer',
            required: true,
          },
          im_mad: {
            type: 'string',
            enum: ['kvm', 'firecracker'],
            required: true,
          },
          vm_mad: {
            type: 'string',
            enum: ['kvm', 'firecracker'],
            required: true,
          },
          provision: {
            type: 'object',
            properties: {
              hostname: {
                type: 'string',
                required: true,
              },
              os: {
                type: 'string',
                required: true,
              },
            },
            required: true,
          },
        },
      },
    },
    clusters: {
      type: 'array',
      required: true,
    },
    datastores: {
      type: 'array',
      required: true,
      items: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            required: false,
          },
          type: {
            type: 'string',
            required: false,
          },
          tm_mad: {
            type: 'string',
            required: false,
          },
        },
      },
    },
    networks: {
      type: 'array',
      required: true,
      items: {
        name: {
          type: 'string',
          required: false,
        },
        vn_mad: {
          type: 'string',
          required: false,
        },
        bridge: {
          type: 'string',
          required: false,
        },
        description: {
          type: 'string',
          required: false,
        },
        ar: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              ip: {
                type: 'string',
                required: true,
              },
              size: {
                type: 'integer',
                required: true,
              },
              type: {
                type: 'string',
                required: true,
              },
            },
          },
          required: false,
        },
      },
    },
  },
}
const schemas = {
  provision,
}

module.exports = schemas
