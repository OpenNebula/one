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
import { Settings as ConfigurationsIcon } from 'iconoir-react'
import PropTypes from 'prop-types'

import { FIELDS } from '@modules/components/Forms/Commons/VNetwork/Tabs/configuration/schema'

import FormWithSchema from '@modules/components/Forms/FormWithSchema'
import { T } from '@ConstantsModule'

const ConfigurationContent = (stepId) => {
  const InnerComponent = ({ oneConfig, adminGroup, isUpdate, isVnet }) => (
    <>
      <FormWithSchema
        id={stepId}
        cy="configuration"
        fields={FIELDS(oneConfig, adminGroup, isUpdate, isVnet)}
      />
    </>
  )

  InnerComponent.displayName = `InnerComponent`
  InnerComponent.propTypes = {
    oneConfig: PropTypes.object,
    adminGroup: PropTypes.bool,
    isUpdate: PropTypes.bool,
    isVnet: PropTypes.bool,
  }

  return InnerComponent
}

ConfigurationContent.displayName = 'ConfigurationContent'

ConfigurationContent.propTypes = {
  oneConfig: PropTypes.object,
  adminGroup: PropTypes.bool,
}

/**
 * @param {string} stepId - Name of the step
 * @returns {object} - The configuration tab for vnets
 */
const TAB = (stepId) => ({
  id: 'configuration',
  name: T.Configuration,
  icon: ConfigurationsIcon,
  Content: ConfigurationContent(stepId),
  getError: (error) => FIELDS().some(({ name }) => error?.[name]),
})

export default TAB
