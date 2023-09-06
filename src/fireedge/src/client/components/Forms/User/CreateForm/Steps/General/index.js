/* ------------------------------------------------------------------------- *
 * Copyright 2002-2023, OpenNebula Project, OpenNebula Systems               *
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
import { T } from 'client/constants'
import {
  SCHEMA,
  USERNAME_FIELD,
  AUTH_TYPE_FIELD,
  PASSWORD_FIELD,
  CONFIRM_PASSWORD_FIELD,
} from './schema'

export const STEP_ID = 'general'

const Content = () => (
  <FormWithSchema
    id={STEP_ID}
    cy={`${STEP_ID}`}
    fields={[
      USERNAME_FIELD,
      AUTH_TYPE_FIELD,
      PASSWORD_FIELD,
      CONFIRM_PASSWORD_FIELD,
    ]}
  />
)

/**
 * General User configuration.
 *
 * @returns {object} General configuration step
 */
const General = () => ({
  id: STEP_ID,
  label: T.General,
  resolver: SCHEMA,
  optionsValidate: { abortEarly: false },
  content: Content,
})

General.propTypes = {
  data: PropTypes.object,
  setFormData: PropTypes.func,
}

export default General
