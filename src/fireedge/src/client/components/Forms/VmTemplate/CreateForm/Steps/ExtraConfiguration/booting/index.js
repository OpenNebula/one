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
import { Stack, Typography } from '@mui/material'

import FormWithSchema from 'client/components/Forms/FormWithSchema'

import { STEP_ID } from 'client/components/Forms/VmTemplate/CreateForm/Steps/ExtraConfiguration'
import BootOrder, { reorderBootAfterRemove } from 'client/components/Forms/VmTemplate/CreateForm/Steps/ExtraConfiguration/booting/bootOrder'
import { TAB_ID as STORAGE_ID } from 'client/components/Forms/VmTemplate/CreateForm/Steps/ExtraConfiguration/storage'
import { TAB_ID as NIC_ID } from 'client/components/Forms/VmTemplate/CreateForm/Steps/ExtraConfiguration/networking'
import { BOOT_FIELDS, KERNEL_FIELDS, RAMDISK_FIELDS, FEATURES_FIELDS } from 'client/components/Forms/VmTemplate/CreateForm/Steps/ExtraConfiguration/booting/schema'
import { Translate } from 'client/components/HOC'
import { T } from 'client/constants'
import AdornmentWithTooltip from 'client/components/FormControl/Tooltip'

export const TAB_ID = 'OS'

const Booting = props => {
  const { hypervisor } = props

  return (
    <>
      {(
        !!props.data?.[STORAGE_ID]?.length ||
        !!props.data?.[NIC_ID]?.length
      ) && (
        <fieldset>
          <Typography
            variant='subtitle1'
            component='legend'
            sx={{
              display: 'inline-flex',
              alignItems: 'center'
            }}
          >
            <Translate word={T.BootOrder} />
            <AdornmentWithTooltip title={T.BootOrderConcept} />
          </Typography>
          <BootOrder {...props} />
        </fieldset>
      )}
      <Stack
        display='grid'
        gap='2em'
        sx={{ gridTemplateColumns: { sm: '1fr', md: '1fr 1fr' } }}
      >
        <FormWithSchema
          cy='create-vm-template-extra.os-boot'
          fields={BOOT_FIELDS(hypervisor)}
          legend={T.Boot}
          id={STEP_ID}
        />
        <FormWithSchema
          cy='create-vm-template-extra.os-features'
          fields={FEATURES_FIELDS(hypervisor)}
          legend={T.Features}
          id={STEP_ID}
        />
        <FormWithSchema
          cy='create-vm-template-extra.os-kernel'
          fields={KERNEL_FIELDS(hypervisor)}
          legend={T.Kernel}
          id={STEP_ID}
        />
        <FormWithSchema
          cy='create-vm-template-extra.os-ramdisk'
          fields={RAMDISK_FIELDS(hypervisor)}
          legend={T.Ramdisk}
          id={STEP_ID}
        />
      </Stack>
    </>
  )
}

Booting.propTypes = {
  data: PropTypes.any,
  setFormData: PropTypes.func,
  hypervisor: PropTypes.string,
  control: PropTypes.object
}

Booting.displayName = 'Booting'

export default Booting

export { reorderBootAfterRemove }
