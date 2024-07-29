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
import User, {
  STEP_ID as USER_ID,
} from 'client/components/Forms/ACLs/CreateForm/Steps/User'
import Resources, {
  STEP_ID as RESOURCES_ID,
} from 'client/components/Forms/ACLs/CreateForm/Steps/Resources'
import ResourcesIdentifier, {
  STEP_ID as RESOURCES_IDENTIFIER_ID,
} from 'client/components/Forms/ACLs/CreateForm/Steps/ResourcesIdentifier'
import Rights, {
  STEP_ID as RIGHTS_ID,
} from 'client/components/Forms/ACLs/CreateForm/Steps/Rights'
import Zone, {
  STEP_ID as ZONE_ID,
} from 'client/components/Forms/ACLs/CreateForm/Steps/Zone'

import Summary from 'client/components/Forms/ACLs/CreateForm/Steps/Summary'

import StringEditor, {
  STEP_ID as STRING_EDITOR_ID,
} from 'client/components/Forms/ACLs/CreateForm/Steps/StringEditor'

import { createSteps } from 'client/utils'

import { ACL_TYPE_ID, ACL_RESOURCES } from 'client/constants'

import { createStringACL } from 'client/models/ACL'

/**
 * Create steps for ACL Create Form with wizard:
 * 1. User: User or users whom the rule will apply
 * 2. Resources: Affected resources by the rule
 * 3. ResourcesIdentifier: Identifier of the resources
 * 4. Rights: Operations that will be enabled
 * 5. Zone: Zone whom the rule will apply
 * 6. Summary: Resume of the rules
 * Create steps for ACL Create From from string:
 * 1. StringEditor: Enter the string rule to create it
 */
const Steps = createSteps(
  (stepProps) =>
    stepProps?.fromString
      ? [StringEditor]
      : [User, Resources, ResourcesIdentifier, Rights, Zone, Summary],
  {
    transformBeforeSubmit: (formData) => {
      // Get data from steps
      const { [USER_ID]: userData } = formData
      const { [RESOURCES_ID]: resourcesData } = formData
      const { [RESOURCES_IDENTIFIER_ID]: resourcesIdentifierData } = formData
      const { [RIGHTS_ID]: rightsData } = formData
      const { [ZONE_ID]: zoneData } = formData

      const { [STRING_EDITOR_ID]: stringEditorData } = formData

      // In case of string editor, we only need the string rule
      if (stringEditorData) {
        // Return the string rule
        return {
          string: stringEditorData?.RULE,
        }
      } else {
        // Create the string rule from the data that the user enter on the wizard
        const rule = createStringACL(
          ACL_TYPE_ID[userData.TYPE],
          userData?.INDIVIDUAL ?? userData?.GROUP ?? userData?.CLUSTER,
          Object.keys(resourcesData)
            .filter((resource) => resourcesData[resource])
            .map((resource) => ACL_RESOURCES[resource]),
          ACL_TYPE_ID[resourcesIdentifierData?.TYPE],
          resourcesIdentifierData?.INDIVIDUAL ??
            resourcesIdentifierData?.GROUP ??
            resourcesIdentifierData?.CLUSTER,
          Object.keys(rightsData).filter((key) => rightsData[key]),
          zoneData?.TYPE ? ACL_TYPE_ID[zoneData?.TYPE] : undefined,
          zoneData?.ZONE
        )

        // Return the string rule
        return {
          string: rule,
        }
      }
    },
  }
)

export default Steps
