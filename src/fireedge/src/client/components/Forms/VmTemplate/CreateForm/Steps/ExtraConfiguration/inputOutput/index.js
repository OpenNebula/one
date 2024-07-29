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
import PropTypes from 'prop-types'
import { Stack } from '@mui/material'
import { DataTransferBoth as IOIcon } from 'iconoir-react'

import { FormWithSchema } from 'client/components/Forms'
import { useEffect } from 'react'

import {
  STEP_ID as EXTRA_ID,
  TabType,
} from 'client/components/Forms/VmTemplate/CreateForm/Steps/ExtraConfiguration'
import InputsSection, { SECTION_ID as INPUT_ID } from './inputsSection'
import VideoSection, { SECTION_ID as VIDEO_ID } from './videoSection'
import { GRAPHICS_FIELDS } from './schema'
import { T } from 'client/constants'
import { useGeneralApi } from 'client/features/General'

export const TAB_ID = ['GRAPHICS', INPUT_ID, VIDEO_ID]

const InputOutput = ({ hypervisor, oneConfig, adminGroup, isUpdate }) => {
  const { setFieldPath } = useGeneralApi()
  useEffect(() => {
    setFieldPath(`extra.InputOutput`)
  }, [])

  return (
    <Stack
      display="grid"
      gap="1em"
      sx={{ gridTemplateColumns: { sm: '1fr', md: '1fr 1fr' } }}
    >
      <FormWithSchema
        cy={`${EXTRA_ID}-io-graphics`}
        fields={GRAPHICS_FIELDS(hypervisor, oneConfig, adminGroup, isUpdate)}
        legend={T.Graphics}
        id={EXTRA_ID}
        saveState={true}
      />
      <InputsSection
        stepId={EXTRA_ID}
        hypervisor={hypervisor}
        oneConfig={oneConfig}
        adminGroup={adminGroup}
      />
      <VideoSection
        stepId={EXTRA_ID}
        hypervisor={hypervisor}
        oneConfig={oneConfig}
        adminGroup={adminGroup}
      />
    </Stack>
  )
}

InputOutput.propTypes = {
  data: PropTypes.any,
  setFormData: PropTypes.func,
  hypervisor: PropTypes.string,
  control: PropTypes.object,
  oneConfig: PropTypes.object,
  adminGroup: PropTypes.bool,
  isUpdate: PropTypes.bool,
  isVrouter: PropTypes.bool,
}

InputOutput.displayName = 'InputOutput'

/** @type {TabType} */
const TAB = {
  id: 'input_output',
  name: T.InputOrOutput,
  icon: IOIcon,
  Content: (isVrouter) => InputOutput(isVrouter),
  getError: (error) => TAB_ID.some((id) => error?.[id]),
}

export default TAB
