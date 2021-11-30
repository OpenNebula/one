/* ------------------------------------------------------------------------- *
 * Copyright 2002-2021, OpenNebula Project, OpenNebula Systems               *
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

import FormWithSchema from 'client/components/Forms/FormWithSchema'
import {
  FIELDS,
  SCHEMA,
} from 'client/components/Forms/MarketplaceApp/CreateForm/Steps/BasicConfiguration/schema'
import { Step } from 'client/utils'
import { T } from 'client/constants'

export const STEP_ID = 'configuration'

const Content = () => {
  return (
    <FormWithSchema
      cy={'create-marketplace-app.configuration'}
      fields={FIELDS}
      id={STEP_ID}
    />
  )
}

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
}

export default ConfigurationStep
