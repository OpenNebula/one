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
import { useMemo } from 'react'
import PropTypes from 'prop-types'
import { Box } from '@mui/material'

import {
  SCHEMA,
  SECTIONS,
} from 'client/components/Forms/Vm/AttachNicForm/Steps/QOSOptions/schema'
import FormWithSchema from 'client/components/Forms/FormWithSchema'
import { Step } from 'client/utils'
import { T, HYPERVISORS } from 'client/constants'

export const STEP_ID = 'qos'

const Content = (props) => {
  const sections = useMemo(() => SECTIONS(props), [])

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
          saveState={true}
        />
      ))}
    </Box>
  )
}

/**
 * Renders advanced options to nic.
 *
 * @param {object} props - Props
 * @param {HYPERVISORS} props.hypervisor - Hypervisor
 * @returns {Step} Advance options step
 */
const QOSOptions = (props) => ({
  id: STEP_ID,
  label: T.SelectQOS,
  resolver: () => SCHEMA(props),
  optionsValidate: { abortEarly: false },
  content: () => Content(props),
})

Content.propTypes = {
  data: PropTypes.any,
  setFormData: PropTypes.func,
  hypervisor: PropTypes.string,
}

export default QOSOptions
