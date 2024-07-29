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
import { ElectronicsChip as NumaIcon } from 'iconoir-react'
import { useEffect } from 'react'
import { useWatch, useFormContext } from 'react-hook-form'

import FormWithSchema from 'client/components/Forms/FormWithSchema'
import {
  STEP_ID as EXTRA_ID,
  TabType,
} from 'client/components/Forms/VmTemplate/CreateForm/Steps/ExtraConfiguration'

import {
  NUMA_FIELDS,
  VIRTUAL_CPU,
} from 'client/components/Forms/VmTemplate/CreateForm/Steps/ExtraConfiguration/numa/schema'
import { T } from 'client/constants'
import { useGeneralApi } from 'client/features/General'

import { disableFields } from 'client/utils'

import { set } from 'lodash'

export const TAB_ID = 'NUMA'

const Numa = ({ hypervisor, oneConfig, adminGroup, setFormData }) => {
  const { setFieldPath, setModifiedFields } = useGeneralApi()

  useEffect(() => {
    setFieldPath(`extra.NUMA`)
  }, [])

  const { getValues, setValue } = useFormContext()

  // Create watch for vcpu
  const vcpuWatch = useWatch({
    name: 'extra.VCPU',
    defaultValue: getValues('general.VCPU'),
  })

  // Synchronize general.VCPU and extra.VCPU (they're the same field but we need to create two to validate in both steps the vcpu)
  useEffect(() => {
    // Set general.VCPU as modified field
    setFieldPath(`general`)
    setModifiedFields({
      general: { VCPU: true },
      setPath: 'extra.NUMA',
    })

    // Set value in formContext
    setValue('general.VCPU', vcpuWatch)

    // Set value in formData (general.VCPU is in another step, so formData won't be updated if we don't force to update) -> components/Forms/VmTemplate/CreateForm/Steps/General/index.js
    setFormData((prevState) => {
      set(prevState, 'general.VCPU', vcpuWatch)

      return prevState
    })
  }, [vcpuWatch])

  return (
    <>
      <FormWithSchema
        cy={`${EXTRA_ID}-vcpu`}
        fields={disableFields([VIRTUAL_CPU], '', oneConfig, adminGroup)}
        id={EXTRA_ID}
        saveState={true}
      />
      <FormWithSchema
        cy={`${EXTRA_ID}-numa`}
        fields={disableFields(
          NUMA_FIELDS(hypervisor),
          'TOPOLOGY',
          oneConfig,
          adminGroup
        )}
        saveState={true}
        id={EXTRA_ID}
      />
    </>
  )
}

Numa.propTypes = {
  data: PropTypes.any,
  setFormData: PropTypes.func,
  hypervisor: PropTypes.string,
  control: PropTypes.object,
  oneConfig: PropTypes.object,
  adminGroup: PropTypes.bool,
}

/** @type {TabType} */
const TAB = {
  id: 'numa',
  name: T.Numa,
  icon: NumaIcon,
  Content: Numa,
  getError: (error) => !!error?.[TAB_ID] || !!error?.[VIRTUAL_CPU.name],
}

export default TAB
