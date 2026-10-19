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
import { useEffect, useMemo, useRef } from 'react'
import { useFormContext, useWatch } from 'react-hook-form'
import PropTypes from 'prop-types'
import { Box } from '@mui/material'

import {
  SCHEMA,
  SECTIONS,
} from '@modules/resources/VirtualMachine/Forms/AttachNicForm/Steps/AdvancedOptions/schema'
import { FormWithSchema } from '@ComponentsModule'
import { Step } from '@UtilsModule'
import { T, Nic, HYPERVISORS } from '@ConstantsModule'

export const STEP_ID = 'advanced'

const Content = (props) => {
  const sections = useMemo(() => SECTIONS(props), [])
  const { setValue } = useFormContext()
  const [pciType, selectionMode] = useWatch({
    name: [`${STEP_ID}.PCI_TYPE`, `${STEP_ID}.PCI_SELECTION_MODE`],
  })
  const previousSelection = useRef([pciType, selectionMode])

  useEffect(() => {
    const [previousType, previousMode] = previousSelection.current
    if (
      previousType &&
      previousMode &&
      (previousType !== pciType || previousMode !== selectionMode)
    ) {
      setValue(`${STEP_ID}.PCI_ADDRESS`, undefined)
      if (pciType !== 'vf' && selectionMode === 'pf_ifname') {
        setValue(`${STEP_ID}.PCI_SELECTION_MODE`, 'automatic')
      }
    }
    previousSelection.current = [pciType, selectionMode]
  }, [pciType, selectionMode, setValue])

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: '2px',
      }}
    >
      <Box
        display="grid"
        gap="2em"
        sx={{ gridTemplateColumns: { lg: '1fr 1fr', md: '1fr' } }}
      >
        {sections.map(({ id, legend, fields }) => (
          <FormWithSchema
            key={id}
            rootProps={{
              sx: (id === 'general' ||
                id === 'guacamole-connections' ||
                id === 'hardware') && {
                gridColumn: '1 / -1',
              },
            }}
            cy={id}
            saveState={true}
            fields={fields}
            legend={legend}
            id={STEP_ID}
          />
        ))}
      </Box>
    </Box>
  )
}

/**
 * Renders advanced options to nic.
 *
 * @param {object} props - Props
 * @param {Nic[]} props.nics - Current nics
 * @param {HYPERVISORS} props.hypervisor - Hypervisor
 * @returns {Step} Advance options step
 */
const AdvancedOptions = (props) => ({
  id: STEP_ID,
  label: T.AdvancedOptions,
  resolver: () => SCHEMA(props),
  optionsValidate: { abortEarly: false },
  content: () => Content(props),
})

Content.propTypes = {
  data: PropTypes.any,
  setFormData: PropTypes.func,
  nics: PropTypes.array,
  hypervisor: PropTypes.string,
}

export default AdvancedOptions
