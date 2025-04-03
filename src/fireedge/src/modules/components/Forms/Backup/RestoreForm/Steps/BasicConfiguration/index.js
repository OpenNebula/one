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
/* eslint-disable jsdoc/require-jsdoc */
import PropTypes from 'prop-types'

import FormWithSchema from '@modules/components/Forms/FormWithSchema'

import {
  SCHEMA,
  FIELDS,
} from '@modules/components/Forms/Backup/RestoreForm/Steps/BasicConfiguration/schema'
import { Step } from '@UtilsModule'
import { T } from '@ConstantsModule'

export const STEP_ID = 'configuration'

const Content = (props, isIncrement) => (
  <FormWithSchema
    cy="restore-configuration"
    id={STEP_ID}
    fields={() => FIELDS(props, isIncrement)}
  />
)

/**
 * Step to configure the marketplace app.
 *
 * @param {object} props - Step props
 * @returns {Step} Configuration step
 */
const ConfigurationStep = (props) => ({
  id: STEP_ID,
  label: T.Configuration,
  resolver: () => SCHEMA(props),
  optionsValidate: { abortEarly: false },
  content: () => Content(props),
})

Content.propTypes = {
  data: PropTypes.any,
  setFormData: PropTypes.func,
  nics: PropTypes.array,
  props: PropTypes.object,
}

export default ConfigurationStep
