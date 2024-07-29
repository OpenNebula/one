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
import ConfigurationsIcon from 'iconoir-react/dist/Settings'
import PropTypes from 'prop-types'

import {
  STEP_ID as EXTRA_ID,
  TabType,
} from 'client/components/Forms/VNTemplate/CreateForm/Steps/ExtraConfiguration'
import { FIELDS } from 'client/components/Forms/VNTemplate/CreateForm/Steps/ExtraConfiguration/configuration/schema'

import FormWithSchema from 'client/components/Forms/FormWithSchema'
import { T } from 'client/constants'

const ConfigurationContent = ({ oneConfig, adminGroup }) => (
  <>
    <FormWithSchema
      id={EXTRA_ID}
      cy="configuration"
      fields={FIELDS(oneConfig, adminGroup)}
    />
  </>
)

ConfigurationContent.propTypes = {
  oneConfig: PropTypes.object,
  adminGroup: PropTypes.bool,
}

/** @type {TabType} */
const TAB = {
  id: 'configuration',
  name: T.Configuration,
  icon: ConfigurationsIcon,
  Content: ConfigurationContent,
  getError: (error) => FIELDS().some(({ name }) => error?.[name]),
}

export default TAB
