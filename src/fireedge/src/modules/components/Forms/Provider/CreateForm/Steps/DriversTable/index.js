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
import { useFormContext, useWatch } from 'react-hook-form'
import { useEffect } from 'react'
import { find } from 'lodash'

export const STEP_ID = 'driver'

const Content = (groupDrivers) => {
  // Access to the form
  const { control, register, unregister, setValue } = useFormContext()

  // Watch the value of the driver
  const value = useWatch({
    control,
    name: 'driver.DRIVER',
  })

  // Register the connection values that corresponds with the driver
  useEffect(() => {
    // Get driver selected
    const driver = find(groupDrivers, { name: value })

    // Register the connection values for the driver
    setValue('connection_values', {})
    unregister('connection_values')
    driver?.driverFields.forEach((field) => {
      register(`connection_values.${field.name}`)
      setValue(`connection_values.${field.name}`, field.default)
    })
  }, [value])

  return <FormWithSchema id={STEP_ID} cy={`${STEP_ID}`} fields={FIELDS} />
}

/**
 * Drivers table selector.
 *
 * @param {object} props - Properties for the step
 * @param {boolean} props.update - Determine if this step is shown. False as default
 * @param {object} props.groupedDrivers - Drivers data
 * @returns {object} Drivers table selector step
 */
const DriversStep = ({ update = false, groupedDrivers } = {}) => ({
  id: STEP_ID,
  label: T.SelectDriver,
  resolver: SCHEMA,
  optionsValidate: { abortEarly: false },
  content: () => Content(groupedDrivers),
  defaultDisabled: {
    condition: () => update,
  },
})

DriversStep.propTypes = {
  data: PropTypes.object,
  setFormData: PropTypes.func,
}

export default DriversStep
