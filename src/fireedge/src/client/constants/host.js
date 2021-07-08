/* ------------------------------------------------------------------------- *
 * Copyright 2002-2021, OpenNebula Project, OpenNebula Systems               *
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

export const HOST_STATES = [
  {
    name: STATES.INIT,
    shortName: 'init',
    color: COLOR.info.main
  },
  {
    name: STATES.MONITORING_MONITORED,
    shortName: 'update',
    color: COLOR.info.main
  },
  {
    name: STATES.MONITORED,
    shortName: 'on',
    color: COLOR.success.main
  },
  {
    name: STATES.ERROR,
    shortName: 'err',
    color: COLOR.error.dark
  },
  {
    name: STATES.DISABLED,
    shortName: 'dsbl',
    color: COLOR.error.light
  },
  {
    name: STATES.MONITORING_ERROR,
    shortName: 'retry',
    color: COLOR.error.dark
  },
  {
    name: STATES.MONITORING_INIT,
    shortName: 'init',
    color: COLOR.info.main
  },
  {
    name: STATES.MONITORING_DISABLED,
    shortName: 'dsbl',
    color: COLOR.error.light
  },
  {
    name: STATES.OFFLINE,
    shortName: 'off',
    color: COLOR.error.dark
  }
]
