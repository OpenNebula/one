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
import * as ACTIONS from 'client/constants/actions'

/**
 * @typedef VDC
 * @property {string|number} ID - Id
 * @property {string} NAME - Name
 * @property {object} TEMPLATE - Template information
 * @property {string} [TEMPLATE.DESCRIPTION] - VDC Description
 * @property {string} [TEMPLATE.LABELS] - VDC Labels
 */

/**
 * @typedef VDCHost
 * @property {string} ZONE_ID - Host zone id
 * @property {string} HOST_ID - Host id
 */

/**
 * @typedef VDCCluster
 * @property {string} ZONE_ID - Cluster zone id
 * @property {string} CLUSTER_ID - Cluster id
 */

/**
 * @typedef VDCDatastore
 * @property {string} ZONE_ID - Datastore zone id
 * @property {string} DATASTORE_ID - Datastore id
 */

/**
 * @typedef VDCVnet
 * @property {string} ZONE_ID - Vnet zone id
 * @property {string} VNET_ID - Vnet id
 */

export const VDC_ACTIONS = {
  CREATE_DIALOG: 'create_dialog',
  UPDATE_DIALOG: 'update_dialog',
  DELETE: 'delete',
  RENAME: ACTIONS.RENAME,
}

export const ALL_SELECTED = '-10'
