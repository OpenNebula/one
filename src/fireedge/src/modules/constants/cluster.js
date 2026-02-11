/* ------------------------------------------------------------------------- *
 * Copyright 2002-2025, OpenNebula Project, OpenNebula Systems               *
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
import * as ACTIONS from '@modules/constants/actions'
import { COLOR } from '@modules/constants/color'

/**
 * @typedef Cluster
 * @property {string} ID - Id
 * @property {string} NAME - Name
 * @property {{ ID: string|string[] }} HOSTS - Hosts
 * @property {{ ID: string|string[] }} DATASTORES - Datastores
 * @property {{ ID: string|string[] }} VNETS - Virtual networks
 * @property {object} TEMPLATE - Template
 * @property {string} [TEMPLATE.RESERVED_MEM] - Reserved memory
 * @property {string} [TEMPLATE.RESERVED_CPU] - Reserved CPU
 */

/** @enum {string} Cluster actions */
export const CLUSTER_ACTIONS = {
  CREATE_DIALOG: 'create_dialog',
  UPDATE_DIALOG: 'update_dialog',
  DELETE: 'delete',
  RENAME: ACTIONS.RENAME,
}

/**
 * @enum {string} DRS Plan Optimization POLICY
 * @readonly
 */
export const DRS_POLICY = {
  PACK: 'pack',
  BALANCE: 'balance',
}

/**
 * @enum {string} DRS Plan Optimization AUTOMATION
 * @readonly
 */
export const DRS_AUTOMATION = {
  MANUAL: 'manual',
  PARTIAL: 'partial',
  FULL: 'full',
}

/** @enum {string} DRS Plan Optimization Configuration */
export const DRS_CONFIG_ATTRIBUTES = {
  MIGRATION_THRESHOLD: 'MIGRATION_THRESHOLD',
  CPU_USAGE_WEIGHT: 'CPU_USAGE_WEIGHT',
  CPU_WEIGHT: 'CPU_WEIGHT',
  MEMORY_WEIGHT: 'MEMORY_WEIGHT',
  NET_WEIGHT: 'NET_WEIGHT',
  DISK_WEIGHT: 'DISK_WEIGHT',
  PREDICTIVE: 'PREDICTIVE',
  POLICY: 'POLICY',
  AUTOMATION: 'AUTOMATION',
}

/** @enum {string} DRS Plan states */
export const PLAN_STATE = {
  '-1': {
    name: 'NONE',
    color: COLOR.debug.light,
  },
  0: {
    name: 'READY',
    color: COLOR.debug.main,
  },
  1: {
    name: 'APPLYING',
    color: COLOR.info.main,
  },
  2: {
    name: 'DONE',
    color: COLOR.success.main,
  },
  3: {
    name: 'ERROR',
    color: COLOR.error.main,
  },

  4: {
    name: 'TIMEOUT',
    color: COLOR.warning.main,
  },
}

export const PROVISION_STATES = {
  PENDING: {
    name: 'PENDING',
    color: COLOR.info.light,
    finalState: false,
  },
  INIT: {
    name: 'INIT',
    color: COLOR.info.light,
    finalState: false,
  },
  INIT_FAILURE: {
    name: 'INIT_FAILURE',
    color: COLOR.error.dark,
    finalState: true,
  },
  PLANNING: {
    name: 'PLANNING',
    color: COLOR.info.light,
    finalState: false,
  },
  PLANNING_FAILURE: {
    name: 'PLANNING_FAILURE',
    color: COLOR.error.dark,
    finalState: true,
  },
  APPLYING: {
    name: 'APPLYING',
    color: COLOR.info.light,
    finalState: false,
  },
  APPLYING_FAILURE: {
    name: 'APPLYING_FAILURE',
    color: COLOR.error.dark,
    finalState: true,
  },
  CONFIGURING_ONE: {
    name: 'CONFIGURING_ONE',
    color: COLOR.info.light,
    finalState: false,
  },
  CONFIGURING_ONE_FAILURE: {
    name: 'CONFIGURING_ONE_FAILURE',
    color: COLOR.error.dark,
    finalState: true,
  },
  CONFIGURING_PROVISION: {
    name: 'CONFIGURING_PROVISION',
    color: COLOR.info.light,
    finalState: false,
  },
  CONFIGURING_PROVISION_FAILURE: {
    name: 'CONFIGURING_PROVISION_FAILURE',
    color: COLOR.error.dark,
    finalState: true,
  },
  RUNNING: {
    name: 'RUNNING',
    color: COLOR.success.light,
    finalState: true,
  },
  SCALING: {
    name: 'SCALING',
    color: COLOR.info.light,
    finalState: false,
  },
  SCALING_FAILURE: {
    name: 'SCALING_FAILURE',
    color: COLOR.error.dark,
    finalState: true,
  },
  DEPROVISIONING_ONE: {
    name: 'DEPROVISIONING_ONE',
    color: COLOR.info.light,
    finalState: false,
  },
  DEPROVISIONING_ONE_FAILURE: {
    name: 'DEPROVISIONING_ONE_FAILURE',
    color: COLOR.error.dark,
    finalState: true,
  },
  DEPROVISIONING: {
    name: 'DEPROVISIONING',
    color: COLOR.info.light,
    finalState: false,
  },
  DONE: {
    name: 'DONE',
    color: COLOR.success.light,
    finalState: true,
  },
}

/** @enum {string} Cluster cloud operations */
export const CLUSTER_CLOUD_OPERATIONS = {
  CREATE: {
    name: 'CREATE',
    text: 'CreatingCluster',
  },
  DEPROVISION: {
    name: 'DEPROVISION',
    text: 'DeprovisioningCluster',
  },
  DELETE: {
    name: 'DELETE',
    text: 'DeletingCluster',
  },
  ADDHOST: {
    name: 'ADDHOST',
    text: 'AddingHostCluster',
  },
  DELETEHOST: {
    name: 'DELETEHOST',
    text: 'DeletingHostCluster',
  },
}
