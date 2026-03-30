/* ------------------------------------------------------------------------- *
 * Copyright 2002-2026, OpenNebula Project, OpenNebula Systems               *
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

export const STEP_ID = 'provider'

const Content = () => (
  <FormWithSchema id={STEP_ID} cy={`${STEP_ID}`} fields={FIELDS} />
)

/**
 * Providers table selector.
 *
 * @param {object} props - Step props
 * @param {boolean} props.onpremiseProvider - Use onpremise provider
 * @returns {object} Drivers table selector step
 */
const ProvidersStep = ({ onpremiseProvider }) => ({
  id: STEP_ID,
  label: T.SelectProvider,
  resolver: SCHEMA,
  optionsValidate: { abortEarly: false },
  content: () => Content(),
  defaultDisabled: {
    condition: () => onpremiseProvider,
  },
})

ProvidersStep.propTypes = {
  data: PropTypes.object,
  setFormData: PropTypes.func,
}

export default ProvidersStep
