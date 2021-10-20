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
/* eslint-disable jsdoc/require-jsdoc */
import PropTypes from 'prop-types'
import { Stack } from '@mui/material'

import FormWithSchema from 'client/components/Forms/FormWithSchema'

import { STEP_ID } from 'client/components/Forms/VmTemplate/CreateForm/Steps/ExtraConfiguration'
import { INPUT_OUTPUT_FIELDS } from 'client/components/Forms/VmTemplate/CreateForm/Steps/ExtraConfiguration/inputOutput/schema'
import { T } from 'client/constants'

const InputOutput = ({ hypervisor }) => {
  return (
    <Stack
      display='grid'
      gap='2em'
      sx={{ gridTemplateColumns: { sm: '1fr', md: '1fr 1fr' } }}
    >
      <FormWithSchema
        cy='create-vm-template-extra.io-graphics'
        fields={INPUT_OUTPUT_FIELDS(hypervisor)}
        legend={T.Graphics}
        id={STEP_ID}
      />
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

export default InputOutput
