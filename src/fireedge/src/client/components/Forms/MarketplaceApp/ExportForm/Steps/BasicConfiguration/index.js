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
/* eslint-disable jsdoc/require-jsdoc */
import PropTypes from 'prop-types'

import FormWithSchema from 'client/components/Forms/FormWithSchema'

import {
  SCHEMA,
  FIELDS,
} from 'client/components/Forms/MarketplaceApp/ExportForm/Steps/BasicConfiguration/schema'
import { Step } from 'client/utils'
import { T } from 'client/constants'

export const STEP_ID = 'configuration'

const Content = () => (
  <FormWithSchema cy="export-app-configuration" id={STEP_ID} fields={FIELDS} />
)

/**
 * Step to configure the marketplace app.
 *
 * @returns {Step} Configuration step
 */
const ConfigurationStep = () => ({
  id: STEP_ID,
  label: T.Configuration,
  resolver: SCHEMA,
  optionsValidate: { abortEarly: false },
  content: Content,
})

Content.propTypes = {
  data: PropTypes.any,
  setFormData: PropTypes.func,
  nics: PropTypes.array,
}

export default ConfigurationStep
