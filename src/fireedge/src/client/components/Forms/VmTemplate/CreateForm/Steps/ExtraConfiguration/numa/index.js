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
import PropTypes from 'prop-types'
import { ElectronicsChip as NumaIcon } from 'iconoir-react'

import FormWithSchema from 'client/components/Forms/FormWithSchema'
import { STEP_ID as GENERAL_ID } from 'client/components/Forms/VmTemplate/CreateForm/Steps/General'
import { STEP_ID as EXTRA_ID, TabType } from 'client/components/Forms/VmTemplate/CreateForm/Steps/ExtraConfiguration'
import { VIRTUAL_CPU as VCPU_FIELD } from 'client/components/Forms/VmTemplate/CreateForm/Steps/General/capacitySchema'
import { FIELDS as NUMA_FIELDS } from 'client/components/Forms/VmTemplate/CreateForm/Steps/ExtraConfiguration/numa/schema'
import { T } from 'client/constants'

export const TAB_ID = 'NUMA'

const Numa = ({ hypervisor }) => {
  return (
    <>
      <FormWithSchema
        cy={`create-vm-template-${EXTRA_ID}.vcpu`}
        fields={[VCPU_FIELD]}
        id={GENERAL_ID}
      />
      <FormWithSchema
        cy={`create-vm-template-${EXTRA_ID}.numa`}
        fields={NUMA_FIELDS(hypervisor)}
        id={EXTRA_ID}
      />
    </>
  )
}

Numa.propTypes = {
  data: PropTypes.any,
  setFormData: PropTypes.func,
  hypervisor: PropTypes.string,
  control: PropTypes.object
}

/** @type {TabType} */
const TAB = {
  id: 'numa',
  name: T.Numa,
  icon: NumaIcon,
  Content: Numa,
  getError: error =>
    !!error?.[TAB_ID] ||
    !!error?.[VCPU_FIELD.name]
}

export default TAB
