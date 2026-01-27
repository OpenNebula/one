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
import { getObjectSchemaFromFields } from '@UtilsModule'
import { T } from '@ConstantsModule'

const STEP_ID = 'connection_values'

const Content = (driverName, fields) => (
  <FormWithSchema
    id={driverName}
    cy={`${STEP_ID}-${driverName}`}
    key={`${STEP_ID}-${driverName}`}
    fields={fields}
  />
)

/**
 * Connection Values configuration.
 *
 * @param {object} driver - Driver data
 * @param {boolean} create - Determine if this step is shown. True as default
 * @returns {object} Connection values configuration step
 */
const ConnectionValues = (driver, create = true) => {
  const driverName = driver?.name
  const driverFields = driver?.driverFields

  return {
    id: driverName,
    label: T.ConnectionValues,
    resolver: getObjectSchemaFromFields(driverFields),
    optionsValidate: { abortEarly: false },
    content: () => Content(driverName, driverFields),
    defaultDisabled: {
      condition: () => create,
    },
  }
}

ConnectionValues.propTypes = {
  data: PropTypes.object,
  setFormData: PropTypes.func,
}

Content.propTypes = { isUpdate: PropTypes.bool }

export default ConnectionValues
