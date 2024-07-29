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
  FORM_FIELDS,
  STEP_FORM_SCHEMA,
} from 'client/components/Forms/Provider/CreateForm/Steps/BasicConfiguration/schema'
import { T } from 'client/constants'

export const STEP_ID = 'configuration'

const Content = ({ isUpdate }) => (
  <FormWithSchema
    cy="form-provider"
    id={STEP_ID}
    fields={FORM_FIELDS({ isUpdate })}
  />
)

const BasicConfiguration = ({ isUpdate }) => ({
  id: STEP_ID,
  label: T.ProviderOverview,
  resolver: () => STEP_FORM_SCHEMA({ isUpdate }),
  optionsValidate: { abortEarly: false },
  content: () => Content({ isUpdate }),
})

Content.propTypes = {
  isUpdate: PropTypes.bool,
}

export * from 'client/components/Forms/Provider/CreateForm/Steps/BasicConfiguration/schema'
export default BasicConfiguration
