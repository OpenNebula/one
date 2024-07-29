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
import { useEffect, useMemo } from 'react'
import PropTypes from 'prop-types'
import { Stack, FormControl } from '@mui/material'
import { SystemShut as OsIcon } from 'iconoir-react'

import FormWithSchema from 'client/components/Forms/FormWithSchema'
import Legend from 'client/components/Forms/Legend'

import {
  STEP_ID as EXTRA_ID,
  TabType,
} from 'client/components/Forms/VmTemplate/CreateForm/Steps/ExtraConfiguration'
import BootOrder, {
  BOOT_ORDER_NAME,
  reorderBootAfterRemove,
} from 'client/components/Forms/VmTemplate/CreateForm/Steps/ExtraConfiguration/booting/bootOrder'
import { TAB_ID as STORAGE_ID } from 'client/components/Forms/VmTemplate/CreateForm/Steps/ExtraConfiguration/storage'
import { TAB_ID as NIC_ID } from 'client/components/Forms/VmTemplate/CreateForm/Steps/ExtraConfiguration/networking'
import { SECTIONS } from 'client/components/Forms/VmTemplate/CreateForm/Steps/ExtraConfiguration/booting/schema'

import { T } from 'client/constants'
import { useGeneralApi } from 'client/features/General'

import { useWatch, useFormContext } from 'react-hook-form'

export const TAB_ID = 'OS'

const Booting = ({ hypervisor, oneConfig, adminGroup, ...props }) => {
  const { setFieldPath } = useGeneralApi()
  useEffect(() => {
    setFieldPath(`extra.OsCpu`)
  }, [])
  const sections = useMemo(
    () => SECTIONS(hypervisor, oneConfig, adminGroup),
    [hypervisor]
  )

  const kernelWatch = useWatch({ name: `${EXTRA_ID}.OS.KERNEL` })
  const kernelDsWatch = useWatch({ name: `${EXTRA_ID}.OS.KERNEL_DS` })

  useEffect(() => {}, [kernelWatch, kernelDsWatch])

  const { getValues } = useFormContext()
  const disks = getValues(`${EXTRA_ID}.${STORAGE_ID}`)
  const nics = getValues(`${EXTRA_ID}.${NIC_ID[0]}`)
  const nicsAlias = getValues(`${EXTRA_ID}.${NIC_ID[1]}`)

  return (
    <Stack
      display="grid"
      gap="1em"
      sx={{ gridTemplateColumns: { sm: '1fr', md: '1fr 1fr' } }}
    >
      {(!!disks?.length || !!nics?.length || !!nicsAlias?.length) && (
        <FormControl
          component="fieldset"
          sx={{ width: '100%', gridColumn: '1 / -1' }}
        >
          <Legend title={T.BootOrder} tooltip={T.BootOrderConcept} />
          <BootOrder />
        </FormControl>
      )}
      {sections.map(({ id, ...section }) => (
        <FormWithSchema
          key={id}
          id={EXTRA_ID}
          saveState={true}
          cy={`${EXTRA_ID}-${id}`}
          hiddenLegend={id === 'os-ramdisk' && !kernelWatch && !kernelDsWatch}
          {...section}
        />
      ))}
    </Stack>
  )
}

Booting.propTypes = {
  data: PropTypes.any,
  setFormData: PropTypes.func,
  hypervisor: PropTypes.string,
  control: PropTypes.object,
  oneConfig: PropTypes.object,
  adminGroup: PropTypes.bool,
}

/** @type {TabType} */
const TAB = {
  id: 'booting',
  name: T.OSAndCpu,
  icon: OsIcon,
  Content: Booting,
  getError: (error) => !!error?.[TAB_ID],
}

export default TAB

export { reorderBootAfterRemove, BOOT_ORDER_NAME }
