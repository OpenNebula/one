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

import General, {
  STEP_ID as GENERAL_ID,
} from '@modules/resources/resources/Group/Forms/AddVLANRuleForm/Steps/General'

import VNTemplatesStep, {
  STEP_ID as VNTEMPLATETABLE_ID,
} from '@modules/resources/resources/Group/Forms/AddVLANRuleForm/Steps/VNTemplatesTable'

import { createSteps } from '@UtilsModule'

const transformInitialValue = (group, schema) => {
  const { ID: vlanIDs, SCOPE: scope, VNTEMPLATE: vntemplateIds } = group ?? {}
  const vntemplateIdsArray =
    typeof vntemplateIds === 'string' ? vntemplateIds.split(',') : []

  const initialValue = {
    [GENERAL_ID]: {
      ID: vlanIDs,
      SCOPE: scope,
      ALL_VNETS: vntemplateIds === '-1',
    },
    [VNTEMPLATETABLE_ID]: {
      VNTEMPLATES: vntemplateIdsArray,
    },
  }
  const knownTemplate = schema.cast(initialValue)

  return knownTemplate
}

// when clicking on submit button
const transformBeforeSubmit = (formData) => {
  const { [GENERAL_ID]: generalData, [VNTEMPLATETABLE_ID]: vntemplatesData } =
    formData

  const allVnets = generalData?.ALL_VNETS ?? false

  const template = {
    ID: generalData?.ID.join(','),
    SCOPE: generalData?.SCOPE,
    VNTEMPLATE:
      allVnets === true
        ? '-1'
        : Array.isArray(vntemplatesData?.VNTEMPLATES)
        ? vntemplatesData.VNTEMPLATES.join(',')
        : '',
  }

  return template
}

/**
 * @param {object} stepProps - Step props
 * @param {object} initialValues - Initial form values
 * @returns {object} VLAN rule form configuration
 */
const Steps = (stepProps = {}, initialValues) => {
  const update = Boolean(stepProps?.isEditing)

  return createSteps([General, VNTemplatesStep], {
    transformInitialValue,
    transformBeforeSubmit,
    update,
  })({ ...stepProps, update }, initialValues)
}

export default Steps
