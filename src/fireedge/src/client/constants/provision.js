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
import * as STATES from 'client/constants/states'
import COLOR from 'client/constants/color'

export const PROVISIONS_STATES = [
  {
    name: STATES.PENDING,
    color: COLOR.warning.main,
    meaning: '',
  },
  {
    name: STATES.DEPLOYING,
    color: COLOR.info.main,
    meaning: '',
  },
  {
    name: STATES.CONFIGURING,
    color: COLOR.info.main,
    meaning: '',
  },
  {
    name: STATES.RUNNING,
    color: COLOR.success.main,
    meaning: '',
  },
  {
    name: STATES.ERROR,
    color: COLOR.error.dark,
    meaning: '',
  },
  {
    name: STATES.DELETING,
    color: COLOR.error.light,
    meaning: '',
  },
]
