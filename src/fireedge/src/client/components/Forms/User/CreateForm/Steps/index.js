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
import General, {
  STEP_ID as GENERAL_ID,
} from 'client/components/Forms/User/CreateForm/Steps/General'
import SecondaryGroups, {
  STEP_ID as SECONDARY_GROUPS_ID,
} from 'client/components/Forms/User/CreateForm/Steps/SecondaryGroups'
import PrimaryGroup, {
  STEP_ID as PRIMARY_GROUP_ID,
} from 'client/components/Forms/User/CreateForm/Steps/PrimaryGroup'
import { AUTH_DRIVER } from 'client/constants'

import { createSteps } from 'client/utils'
const Steps = createSteps([General, PrimaryGroup, SecondaryGroups], {
  transformBeforeSubmit: (formData) => {
    const {
      [GENERAL_ID]: generalData,
      [PRIMARY_GROUP_ID]: primaryGroupsData,
      [SECONDARY_GROUPS_ID]: secondaryGroupsData,
    } = formData

    // LDAP driver needs to set passwort to '-'
    return {
      username: generalData.username,
      password:
        generalData.authType === AUTH_DRIVER.LDAP ? '-' : generalData.password,
      driver: generalData.authType,
      group: [primaryGroupsData, ...secondaryGroupsData],
    }
  },
})

export default Steps
