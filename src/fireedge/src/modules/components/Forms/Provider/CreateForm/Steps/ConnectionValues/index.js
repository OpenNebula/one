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
import FormWithSchema from '@modules/components/Forms/FormWithSchema'
import { T } from '@ConstantsModule'
import { useFormContext, useController } from 'react-hook-form'
import { find } from 'lodash'
import { SCHEMA } from './schema'

export const STEP_ID = 'connection_values'

const Content = (groupDrivers) => {
  // Access to the form
  const { control } = useFormContext()

  // Control the driver value
  const {
    field: { value },
  } = useController({ name: `driver.DRIVER`, control: control })

  // Get the correspoding driver
  const driver = find(groupDrivers, { name: value })

  // Render the form with the connection values from the driver
  return (
    <FormWithSchema
      id={`${STEP_ID}`}
      cy={`${STEP_ID}`}
      key={`${STEP_ID}`}
      fields={driver?.driverFields}
    />
  )
}

/**
 * Connection Values configuration.
 *
 * @param {object} props - Properties for the step
 * @param {object} props.groupedDrivers - Drivers data
 * @returns {object} Connection values configuration step
 */
const ConnectionValues = ({ groupedDrivers }) => ({
  id: STEP_ID,
  label: T.ConnectionValues,
  resolver: SCHEMA(groupedDrivers),
  optionsValidate: { abortEarly: false },
  content: () => Content(groupedDrivers),
})

ConnectionValues.propTypes = {
  data: PropTypes.object,
  setFormData: PropTypes.func,
}

Content.propTypes = { isUpdate: PropTypes.bool }

export default ConnectionValues
