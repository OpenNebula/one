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
import PropTypes from 'prop-types'
import { T } from '@ConstantsModule'
import FormWithSchema from '@modules/components/Forms/FormWithSchema'
import { generateTabs } from '@modules/components/Forms/UserInputs'

import {
  FIELDS,
  SCHEMA,
} from '@modules/components/Forms/Cluster/CreateCloudForm/Steps/UserInputs/schema'

const Content = (stepName, userInputs, userInputsLayout) => {
  if (userInputsLayout && userInputsLayout.length > 0) {
    return generateTabs(userInputsLayout, stepName, FIELDS)
  } else {
    return (
      <FormWithSchema
        id={stepName}
        cy={`${stepName}`}
        key={`${stepName}`}
        fields={userInputs}
      />
    )
  }
}

/**
 * User Inputs configuration.
 *
 * @param {string} stepName - Name of the step
 * @param {object} userInputs - user inputs fields
 * @param {object} userInputsLayout - The user inputs layout
 * @returns {object} User Inputs configuration step
 */
const UserInputs = (stepName, userInputs, userInputsLayout) => ({
  id: stepName,
  label: T.UserInputs,
  resolver: SCHEMA(userInputs),
  optionsValidate: { abortEarly: false },
  content: () => Content(stepName, userInputs, userInputsLayout),
  defaultDisabled: {
    condition: () => true,
  },
})

UserInputs.propTypes = {
  data: PropTypes.object,
  setFormData: PropTypes.func,
}

Content.propTypes = { isUpdate: PropTypes.bool }

export default UserInputs
