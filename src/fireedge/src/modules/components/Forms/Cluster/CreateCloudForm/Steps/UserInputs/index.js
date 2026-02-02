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

import { useFormContext, useController } from 'react-hook-form'
import { find } from 'lodash'

import { SCHEMA } from '@modules/components/Forms/Cluster/CreateCloudForm/Steps/UserInputs/schema'

export const STEP_ID = 'user_inputs'

const Content = ({ deploymentConfs }) => {
  // Access to the form
  const { control } = useFormContext()

  // Control the driver value
  const {
    field: { value: deployment },
  } = useController({ name: `deployments.DEPLOYMENT_CONF`, control: control })

  // Get the corresponding deployment conf
  const deploymentConf = find(deploymentConfs, { deploymentAlias: deployment })

  // Render tabs or form depending if there is layout
  if (
    deploymentConf?.userInputsLayout &&
    deploymentConf?.userInputsLayout.length > 0
  ) {
    return generateTabs(
      deploymentConf?.userInputsLayout,
      STEP_ID,
      (userInputs = []) => userInputs
    )
  } else {
    return (
      <FormWithSchema
        id={STEP_ID}
        cy={`${STEP_ID}`}
        key={`${STEP_ID}`}
        fields={deploymentConf?.deploymentUserInputs}
      />
    )
  }
}

/**
 * User Inputs configuration.
 *
 * @param {object} props - Step props
 * @param {object} props.deploymentConfs - Deployment configuration data
 * @returns {object} User Inputs configuration step
 */
const UserInputs = ({ deploymentConfs }) => ({
  id: STEP_ID,
  label: T.UserInputs,
  resolver: SCHEMA({ deploymentConfs }),
  optionsValidate: { abortEarly: false },
  content: () => Content({ deploymentConfs }),
})

UserInputs.propTypes = {
  data: PropTypes.object,
  setFormData: PropTypes.func,
}

Content.propTypes = { deploymentConfs: PropTypes.array }

export default UserInputs
