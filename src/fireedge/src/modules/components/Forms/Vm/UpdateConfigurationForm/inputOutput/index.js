/* ------------------------------------------------------------------------- *
 * Copyright 2002-2025, OpenNebula Project, OpenNebula Systems               *
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
import { ReactElement, useMemo } from 'react'
import PropTypes from 'prop-types'
import { Stack } from '@mui/material'

import { FormWithSchema } from '@modules/components/Forms'

import InputsSection from '@modules/components/Forms/VmTemplate/CreateForm/Steps/ExtraConfiguration/inputOutput/inputsSection'
import VideoSection from '@modules/components/Forms/VmTemplate/CreateForm/Steps/ExtraConfiguration/inputOutput/videoSection'
import { GRAPHICS_FIELDS } from '@modules/components/Forms/Vm/UpdateConfigurationForm/inputOutput/schema'
import { T, HYPERVISORS } from '@ConstantsModule'

/**
 * @param {object} props - Component props
 * @param {HYPERVISORS} props.hypervisor - VM hypervisor
 * @param {object} props.oneConfig - Config of oned.conf
 * @param {boolean} props.adminGroup - User is admin or not
 * @returns {ReactElement} IO section component
 */
const InputOutput = ({ hypervisor, oneConfig, adminGroup }) => (
  <Stack
    display="grid"
    gap="1em"
    sx={{ gridTemplateColumns: { sm: '1fr', md: '1fr 1fr' } }}
  >
    <FormWithSchema
      cy={'io-graphics'}
      fields={useMemo(
        () => GRAPHICS_FIELDS({ hypervisor, oneConfig, adminGroup }),
        [hypervisor]
      )}
      legend={T.Graphics}
    />
    <InputsSection
      hypervisor={hypervisor}
      oneConfig={oneConfig}
      adminGroup={adminGroup}
    />
    <VideoSection
      hypervisor={hypervisor}
      oneConfig={oneConfig}
      adminGroup={adminGroup}
    />
  </Stack>
)

InputOutput.propTypes = {
  hypervisor: PropTypes.string,
  oneConfig: PropTypes.object,
  adminGroup: PropTypes.bool,
}
InputOutput.displayName = 'InputOutput'

export default InputOutput
