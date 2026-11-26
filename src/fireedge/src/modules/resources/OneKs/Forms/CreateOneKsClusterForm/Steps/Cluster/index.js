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
import { object } from 'yup'
import { FormWithSchema } from '@ComponentsModule'
import { T } from '@ConstantsModule'
import { SCHEMA, FIELDS } from './schema'

export const STEP_ID = 'cluster'

const Content = () => (
  <FormWithSchema id={STEP_ID} cy={`${STEP_ID}`} fields={FIELDS} />
)

/**
 * Cluster configuration.
 *
 * @param {object} props - Form props
 * @param {boolean} props.adminGroup - Whether the user belongs to the admin group
 * @returns {object} Cluster configuration step
 */
const Cluster = ({ adminGroup }) => ({
  id: STEP_ID,
  label: T.SelectCluster,
  resolver: adminGroup ? SCHEMA : object().strip(),
  optionsValidate: { abortEarly: false },
  content: () => Content(),
  defaultDisabled: { condition: () => !adminGroup },
})

Cluster.propTypes = {
  adminGroup: PropTypes.bool,
}

export default Cluster
