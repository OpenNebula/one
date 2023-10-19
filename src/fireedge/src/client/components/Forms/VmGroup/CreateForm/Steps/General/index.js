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
import { SCHEMA, NAME_FIELD, DESCRIPTION_FIELD } from './schema'

export const STEP_ID = 'general'

const Content = ({ isUpdate }) => (
  <FormWithSchema
    id={STEP_ID}
    cy={`${STEP_ID}`}
    fields={[
      { ...NAME_FIELD, fieldProps: { disabled: !!isUpdate } },
      DESCRIPTION_FIELD,
    ]}
  />
)

/**
 * General VmGroup configuration.
 *
 * @param {object} data - VmGroup data
 * @returns {object} General configuration step
 */
const General = (data) => {
  const isUpdate = data?.ID

  return {
    id: STEP_ID,
    label: T.General,
    resolver: SCHEMA,
    optionsValidate: { abortEarly: false },
    content: () => Content({ isUpdate }),
  }
}

General.propTypes = {
  data: PropTypes.object,
  setFormData: PropTypes.func,
}

Content.propTypes = { isUpdate: PropTypes.bool }
export default General
