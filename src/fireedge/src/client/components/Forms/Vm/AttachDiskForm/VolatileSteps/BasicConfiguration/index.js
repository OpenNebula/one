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
import { useMemo } from 'react'
import PropTypes from 'prop-types'

import FormWithSchema from 'client/components/Forms/FormWithSchema'
import {
  SCHEMA,
  FIELDS,
} from 'client/components/Forms/Vm/AttachDiskForm/VolatileSteps/BasicConfiguration/schema'
import { Step } from 'client/utils'
import { T, HYPERVISORS } from 'client/constants'

export const STEP_ID = 'configuration'

const Content = ({ hypervisor }) => {
  const memoFields = useMemo(() => FIELDS(hypervisor), [])

  return <FormWithSchema cy="attach-disk" fields={memoFields} id={STEP_ID} />
}

/**
 * Renders configuration to volatile disk.
 *
 * @param {object} props - Props
 * @param {HYPERVISORS} props.hypervisor - Hypervisor
 * @returns {Step} Basic configuration step
 */
const BasicConfiguration = ({ hypervisor } = {}) => ({
  id: STEP_ID,
  label: T.Configuration,
  resolver: SCHEMA(hypervisor),
  optionsValidate: { abortEarly: false },
  content: () => Content({ hypervisor }),
})

Content.propTypes = {
  hypervisor: PropTypes.any,
  data: PropTypes.any,
  setFormData: PropTypes.func,
}

export default BasicConfiguration
