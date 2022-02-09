/* ------------------------------------------------------------------------- *
 * Copyright 2002-2022, OpenNebula Project, OpenNebula Systems               *
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
import * as STATES from 'client/constants/states'
import * as ACTIONS from 'client/constants/actions'
import COLOR from 'client/constants/color'

/**
 * @typedef {object} PciDevice - PCI device
 * @property {string} DOMAIN - PCI address domain
 * @property {string} BUS - PCI address bus
 * @property {string} SLOT - PCI address slot
 * @property {string} FUNCTION - PCI address function
 * @property {string} ADDRESS - PCI address, bus, slot and function
 * @property {string} DEVICE - Id of PCI device
 * @property {string} CLASS - Id of PCI device class
 * @property {string} VENDOR - Id of PCI device vendor
 * @property {string} VMID - Id using this device, -1 if free
 * @property {string} [DEVICE_NAME] - Name of PCI device
 * @property {string} [VENDOR_NAME] - Name of PCI device vendor
 * @property {string} [CLASS_NAME] - Name of PCI device class
 */

/** @type {STATES.StateInfo[]} Host states */
export const HOST_STATES = [
  {
    name: STATES.INIT,
    shortName: 'init',
    color: COLOR.info.main,
  },
  {
    name: STATES.MONITORING_MONITORED,
    shortName: 'update',
    color: COLOR.info.main,
  },
  {
    name: STATES.MONITORED,
    shortName: 'on',
    color: COLOR.success.main,
  },
  {
    name: STATES.ERROR,
    shortName: 'err',
    color: COLOR.error.dark,
  },
  {
    name: STATES.DISABLED,
    shortName: 'dsbl',
    color: COLOR.error.light,
  },
  {
    name: STATES.MONITORING_ERROR,
    shortName: 'retry',
    color: COLOR.error.dark,
  },
  {
    name: STATES.MONITORING_INIT,
    shortName: 'init',
    color: COLOR.info.main,
  },
  {
    name: STATES.MONITORING_DISABLED,
    shortName: 'dsbl',
    color: COLOR.error.light,
  },
  {
    name: STATES.OFFLINE,
    shortName: 'off',
    color: COLOR.error.dark,
  },
]

/** @enum {string} Host actions */
export const HOST_ACTIONS = {
  REFRESH: ACTIONS.REFRESH,
  CREATE_DIALOG: 'create_dialog',
  RENAME: ACTIONS.RENAME,
  ADD_TO_CLUSTER: 'addtocluster',
  ENABLE: 'enable',
  DISABLE: 'disable',
  OFFLINE: 'offline',
  DELETE: 'delete',
}
