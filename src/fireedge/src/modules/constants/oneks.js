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
import { COLOR } from '@modules/constants/color'

/**
 * @typedef Kubernete
 * @property {string} ID - Id
 * @property {string} NAME - Name
 * @property {{ ID: string|string[] }} HOSTS - Hosts
 * @property {{ ID: string|string[] }} DATASTORES - Datastores
 * @property {{ ID: string|string[] }} VNETS - Virtual networks
 * @property {object} TEMPLATE - Template
 * @property {string} [TEMPLATE.RESERVED_MEM] - Reserved memory
 * @property {string} [TEMPLATE.RESERVED_CPU] - Reserved CPU
 */

/** @enum {string} oneKs actions */
export const ONEKS_ACTIONS = {
  CREATE_DIALOG: 'create_dialog',
  RECOVER: 'recover',
  DELETE: 'delete',
}

export const CAPACITY_USER_INPUTS = ['cpu', 'vcpu', 'disk_size', 'memory']

export const STATE_SHOW_DATA = {
  RUNNING: 'RUNNING',
}

/** @enum {string} oneKs states */
export const ONEKS_STATE = {
  UNKNOWN: {
    name: 'UNKNOWN',
    color: COLOR.debug.light,
    finalState: false,
  },
  PENDING: {
    name: 'PENDING',
    color: COLOR.debug.light,
    finalState: false,
  },
  BOOTSTRAPING: {
    name: 'READY',
    color: COLOR.info.main,
    finalState: false,
  },
  BOOTSTRAPING_FAILURE: {
    name: 'BOOTSTRAPING_FAILURE',
    color: COLOR.warning.main,
    finalState: true,
  },
  PROVISIONING_SEED: {
    name: 'PROVISIONING_SEED',
    color: COLOR.info.main,
    finalState: false,
  },
  PROVISIONING: {
    name: 'PROVISIONING',
    color: COLOR.info.main,
    finalState: false,
  },
  PROVISIONING_MGMT: {
    name: 'PROVISIONING_MGMT',
    color: COLOR.info.main,
    finalState: false,
  },
  PROVISIONING_CP: {
    name: 'PROVISIONING_CP',
    color: COLOR.info.main,
    finalState: false,
  },
  PROVISIONING_FAILURE: {
    name: 'PROVISIONING_FAILURE',
    color: COLOR.warning.main,
    finalState: true,
  },
  PIVOTING_CLUSTER: {
    name: 'PIVOTING_CLUSTER',
    color: COLOR.info.main,
    finalState: false,
  },
  PIVOTING_FAILURE: {
    name: 'PIVOTING_FAILURE',
    color: COLOR.warning.main,
    finalState: true,
  },
  SCALING: {
    name: 'SCALING',
    color: COLOR.info.main,
    finalState: false,
  },
  SCALING_FAILURE: {
    name: 'SCALING_FAILURE',
    color: COLOR.warning.main,
    finalState: true,
  },
  UPGRADING: {
    name: 'UPGRADING',
    color: COLOR.info.main,
    finalState: false,
  },
  UPGRADING_FAILURE: {
    name: 'UPGRADING_FAILURE',
    color: COLOR.warning.main,
    finalState: true,
  },
  DEPROVISIONING: {
    name: 'DEPROVISIONING',
    color: COLOR.info.main,
    finalState: false,
  },
  DEPROVISIONING_FAILURE: {
    name: 'DEPROVISIONING_FAILURE',
    color: COLOR.warning.main,
    finalState: true,
  },
  DEPLOYING: {
    name: 'DEPLOYING',
    color: COLOR.info.main,
    finalState: false,
  },
  RUNNING: {
    name: STATE_SHOW_DATA.RUNNING,
    color: COLOR.success.main,
    finalState: true,
  },
  WARNING: {
    name: 'WARNING',
    color: COLOR.warning.main,
    finalState: true,
  },
  ERROR: {
    name: 'ERROR',
    color: COLOR.error.main,
    finalState: true,
  },
  DONE: {
    name: 'DONE',
    color: COLOR.success.main,
    finalState: true,
  },
  DELETED: {
    name: 'DELETED',
    color: COLOR.error.main,
    finalState: true,
  },
  ANY: {
    name: 'ANY',
    color: COLOR.debug.light,
    finalState: false,
  },
}

/** @enum {string} OneKS operations */
export const ONEKS_OPERATIONS = {
  CREATE: {
    name: 'CREATE',
    text: 'CreatingNodeGroupCluster',
  },
  ADD_NODEGROUP: {
    name: 'ADD_NODEGROUP',
    text: 'AddingNodeGroupCluster',
  },
  SCALING: {
    name: 'SCALING',
    text: 'ScalingNodeGroupCluster',
  },
}
