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
import { useMemo } from 'react'
import PropTypes from 'prop-types'

import {
  FIELDS,
  SCHEMA,
} from 'client/components/Forms/VmTemplate/InstantiateForm/Steps/UserInputs/schema'
import { T, UserInputObject } from 'client/constants'
import { FormWithSchema } from 'client/components/Forms'

export const STEP_ID = 'user_inputs'

const Content = ({ userInputs }) => (
  <FormWithSchema
    cy="user-inputs"
    id={STEP_ID}
    fields={useMemo(() => FIELDS(userInputs), [])}
    saveState={true}
  />
)

Content.propTypes = {
  data: PropTypes.any,
  userInputs: PropTypes.object,
}

/**
 * User inputs step.
 *
 * @param {UserInputObject[]} userInputs - User inputs
 * @returns {object} User inputs step
 */
const UserInputsStep = (userInputs) => ({
  id: STEP_ID,
  label: T.UserInputs,
  optionsValidate: { abortEarly: false },
  resolver: SCHEMA(userInputs),
  content: (props) => Content({ ...props, userInputs }),
})

export default UserInputsStep
