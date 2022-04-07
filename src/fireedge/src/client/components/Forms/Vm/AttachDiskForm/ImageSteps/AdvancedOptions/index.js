/* ------------------------------------------------------------------------- *
 * Copyright 2002-2022, OpenNebula Project, OpenNebula Systems               *
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
import { Box } from '@mui/material'

import FormWithSchema from 'client/components/Forms/FormWithSchema'
import {
  SCHEMA,
  SECTIONS,
} from 'client/components/Forms/Vm/AttachDiskForm/ImageSteps/AdvancedOptions/schema'
import { Step } from 'client/utils'
import { T, HYPERVISORS } from 'client/constants'

export const STEP_ID = 'advanced'

const Content = ({ hypervisor }) => {
  const sections = useMemo(() => SECTIONS(hypervisor), [])

  return (
    <Box
      display="grid"
      gap="2em"
      sx={{ gridTemplateColumns: { lg: '1fr 1fr', md: '1fr' } }}
    >
      {sections.map(({ id, legend, fields }) => (
        <FormWithSchema
          key={id}
          rootProps={{ sx: id === 'general' && { gridColumn: '1 / -1' } }}
          cy={id}
          fields={fields}
          legend={legend}
          id={STEP_ID}
        />
      ))}
    </Box>
  )
}

/**
 * Renders advanced options to disk.
 *
 * @param {object} props - Props
 * @param {HYPERVISORS} props.hypervisor - Hypervisor
 * @returns {Step} Advance options step
 */
const AdvancedOptions = ({ hypervisor } = {}) => ({
  id: STEP_ID,
  label: T.AdvancedOptions,
  resolver: () => SCHEMA(hypervisor),
  optionsValidate: { abortEarly: false },
  content: () => Content({ hypervisor }),
})

Content.propTypes = {
  hypervisor: PropTypes.any,
  data: PropTypes.any,
  setFormData: PropTypes.func,
}

export default AdvancedOptions
