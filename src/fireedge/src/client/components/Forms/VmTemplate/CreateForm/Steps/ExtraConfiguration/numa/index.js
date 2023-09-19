/* ------------------------------------------------------------------------- *
 * Copyright 2002-2023, OpenNebula Project, OpenNebula Systems               *
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
import { useWatch } from 'react-hook-form'

import FormWithSchema from 'client/components/Forms/FormWithSchema'
import { STEP_ID as GENERAL_ID } from 'client/components/Forms/VmTemplate/CreateForm/Steps/General'
import {
  STEP_ID as EXTRA_ID,
  TabType,
} from 'client/components/Forms/VmTemplate/CreateForm/Steps/ExtraConfiguration'
import { VIRTUAL_CPU as VCPU_FIELD } from 'client/components/Forms/VmTemplate/CreateForm/Steps/General/capacitySchema'
import {
  NUMA_FIELDS,
  ENABLE_NUMA,
} from 'client/components/Forms/VmTemplate/CreateForm/Steps/ExtraConfiguration/numa/schema'
import { T } from 'client/constants'

import { disableFields } from 'client/utils'

export const TAB_ID = 'NUMA'

const Numa = ({ hypervisor, oneConfig, adminGroup }) => {
  const enableNuma = useWatch({ name: `${EXTRA_ID}.${ENABLE_NUMA.name}` })

  return (
    <>
      <FormWithSchema
        cy={`${EXTRA_ID}-vcpu`}
        fields={disableFields([VCPU_FIELD], 'TOPOLOGY', oneConfig, adminGroup)}
        id={GENERAL_ID}
      />
      <FormWithSchema
        cy={`${EXTRA_ID}-numa-enable`}
        fields={disableFields([ENABLE_NUMA], 'TOPOLOGY', oneConfig, adminGroup)}
        id={EXTRA_ID}
      />
      {enableNuma && (
        <FormWithSchema
          cy={`${EXTRA_ID}-numa`}
          fields={disableFields(
            NUMA_FIELDS(hypervisor),
            'TOPOLOGY',
            oneConfig,
            adminGroup
          )}
          id={EXTRA_ID}
        />
      )}
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
  getError: (error) => !!error?.[TAB_ID] || !!error?.[VCPU_FIELD.name],
}

export default TAB
