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
import { SCHEMA, FIELDS } from './schema'
import FormWithSchema from '@modules/components/Forms/FormWithSchema'

export const STEP_ID = 'driver'

const Content = (driversSteps) => (
  <FormWithSchema
    id={STEP_ID}
    cy={`${STEP_ID}`}
    fields={FIELDS(driversSteps)}
  />
)

/**
 * Drivers table selector.
 *
 * @param {object} steps - Next steps associated for drivers
 * @param {boolean} update - Determine if this step is shown. False as default
 * @returns {object} Drivers table selector step
 */
const DriversStep = (steps, update = false) => ({
  id: STEP_ID,
  label: T.SelectDriver,
  resolver: SCHEMA(steps),
  optionsValidate: { abortEarly: false },
  content: () => Content(steps),
  defaultDisabled: {
    condition: () => update,
  },
})

DriversStep.propTypes = {
  data: PropTypes.object,
  setFormData: PropTypes.func,
}

export default DriversStep
