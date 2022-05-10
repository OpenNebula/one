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
import COLOR from 'client/constants/color'

export const APPLICATION_STATES = [
  {
    // 0
    name: STATES.PENDING,
    color: COLOR.info.main,
    meaning: `
      The Application starts in this state, and will stay in
      it until the LCM decides to deploy it`,
  },
  {
    // 1
    name: STATES.DEPLOYING,
    color: COLOR.info.main,
    meaning: 'Some Tiers are being deployed',
  },
  {
    // 2
    name: STATES.RUNNING,
    color: COLOR.success.main,
    meaning: 'All Tiers are deployed successfully',
  },
  {
    // 3
    name: STATES.UNDEPLOYING,
    color: COLOR.error.light,
    meaning: 'Some Tiers are being undeployed',
  },
  {
    // 4
    name: STATES.WARNING,
    color: COLOR.error.light,
    meaning: 'A VM was found in a failure state',
  },
  {
    // 5
    name: STATES.DONE,
    color: COLOR.error.dark,
    meaning: `
      The Applications will stay in this state after
      a successful undeployment. It can be deleted`,
  },
  {
    // 6
    name: STATES.FAILED_UNDEPLOYING,
    color: COLOR.error.dark,
    meaning: 'An error occurred while undeploying the Application',
  },
  {
    // 7
    name: STATES.FAILED_DEPLOYING,
    color: COLOR.error.dark,
    meaning: 'An error occurred while deploying the Application',
  },
  {
    // 8
    name: STATES.SCALING,
    color: COLOR.error.light,
    meaning: 'A Tier is scaling up or down',
  },
  {
    // 9
    name: STATES.FAILED_SCALING,
    color: COLOR.error.dark,
    meaning: 'An error occurred while scaling the Application',
  },
  {
    // 10
    name: STATES.COOLDOWN,
    color: COLOR.error.light,
    meaning: 'A Tier is in the cooldown period after a scaling operation',
  },
  {
    // 11
    name: STATES.DEPLOYING_NETS,
    color: COLOR.info.main,
    meaning: '',
  },
  {
    // 12
    name: STATES.UNDEPLOYING_NETS,
    color: COLOR.error.light,
    meaning: '',
  },
  {
    // 13
    name: STATES.FAILED_DEPLOYING_NETS,
    color: COLOR.error.dark,
    meaning: '',
  },
  {
    // 14
    name: STATES.FAILED_UNDEPLOYING_NETS,
    color: COLOR.error.dark,
    meaning: '',
  },
]

export const TIER_STATES = [
  {
    name: STATES.PENDING,
    color: '',
    meaning: 'The Tier is waiting to be deployed',
  },
  {
    name: STATES.DEPLOYING,
    color: '',
    meaning: `
      The VMs are being created, and will be
      monitored until all of them are running`,
  },
  {
    name: STATES.RUNNING,
    color: '',
    meaning: 'All the VMs are running',
  },
  {
    name: STATES.WARNING,
    color: '',
    meaning: 'A VM was found in a failure state',
  },
  {
    name: STATES.SCALING,
    color: '',
    meaning: 'The Tier is waiting for VMs to be deployed or to be shutdown',
  },
  {
    name: STATES.COOLDOWN,
    color: '',
    meaning: 'The Tier is in the cooldown period after a scaling operation',
  },
  {
    name: STATES.UNDEPLOYING,
    color: '',
    meaning: `
      The VMs are being shutdown. The Tier will stay in
      this state until all VMs are done`,
  },
  {
    name: STATES.DONE,
    color: '',
    meaning: 'All the VMs are done',
  },
  {
    name: STATES.FAILED_DEPLOYING,
    color: '',
    meaning: 'An error occurred while deploying the VMs',
  },
  {
    name: STATES.FAILED_UNDEPLOYING,
    color: '',
    meaning: 'An error occurred while undeploying the VMs',
  },
  {
    name: STATES.FAILED_SCALING,
    color: '',
    meaning: 'An error occurred while scaling the Tier',
  },
]
