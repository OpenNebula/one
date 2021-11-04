/* ------------------------------------------------------------------------- *
 * Copyright 2002-2021, OpenNebula Project, OpenNebula Systems               *
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
import { Stack } from '@mui/material'
import { DataTransferBoth as IOIcon } from 'iconoir-react'

import { FormWithSchema } from 'client/components/Forms'

import { STEP_ID as EXTRA_ID, TabType } from 'client/components/Forms/VmTemplate/CreateForm/Steps/ExtraConfiguration'
import InputsSection, { SECTION_ID as INPUT_ID } from './inputsSection'
import PciDevicesSection, { SECTION_ID as PCI_ID } from './pciDevicesSection'
import { INPUT_OUTPUT_FIELDS, INPUTS_FIELDS, PCI_FIELDS } from './schema'
import { T } from 'client/constants'

export const TAB_ID = ['GRAPHICS', INPUT_ID, PCI_ID]

const InputOutput = ({ hypervisor }) => {
  const inputsFields = useMemo(() => INPUTS_FIELDS(hypervisor), [hypervisor])
  const pciDevicesFields = useMemo(() => PCI_FIELDS(hypervisor), [hypervisor])

  return (
    <Stack
      display='grid'
      gap='1em'
      sx={{ gridTemplateColumns: { sm: '1fr', md: '1fr 1fr' } }}
    >
      <FormWithSchema
        cy={`create-vm-template-${EXTRA_ID}.io-graphics`}
        fields={INPUT_OUTPUT_FIELDS(hypervisor)}
        legend={T.Graphics}
        id={EXTRA_ID}
      />
      {inputsFields.length > 0 && (
        <InputsSection fields={inputsFields} />
      )}
      {pciDevicesFields.length > 0 && (
        <PciDevicesSection fields={pciDevicesFields} />
      )}
    </Stack>
  )
}

InputOutput.propTypes = {
  data: PropTypes.any,
  setFormData: PropTypes.func,
  hypervisor: PropTypes.string,
  control: PropTypes.object
}

InputOutput.displayName = 'InputOutput'

/** @type {TabType} */
const TAB = {
  id: 'input_output',
  name: T.InputOrOutput,
  icon: IOIcon,
  Content: InputOutput,
  getError: error => TAB_ID.some(id => error?.[id])
}

export default TAB
