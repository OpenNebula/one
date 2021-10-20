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

import FormWithSchema from 'client/components/Forms/FormWithSchema'
import { STEP_ID as GENERAL_ID } from 'client/components/Forms/VmTemplate/CreateForm/Steps/General'
import { VIRTUAL_CPU } from 'client/components/Forms/VmTemplate/CreateForm/Steps/General/capacitySchema'
import { STEP_ID as EXTRA_ID } from 'client/components/Forms/VmTemplate/CreateForm/Steps/ExtraConfiguration'
import { NUMA_FIELDS } from 'client/components/Forms/VmTemplate/CreateForm/Steps/ExtraConfiguration/numa/schema'

const Placement = ({ hypervisor }) => {
  return (
    <>
      <FormWithSchema
        cy='create-vm-template-extra.vcpu'
        fields={[VIRTUAL_CPU]}
        id={GENERAL_ID}
      />
      <FormWithSchema
        cy='create-vm-template-extra.numa'
        fields={NUMA_FIELDS(hypervisor)}
        id={EXTRA_ID}
      />
    </>
  )
}

Placement.propTypes = {
  data: PropTypes.any,
  setFormData: PropTypes.func,
  hypervisor: PropTypes.string,
  control: PropTypes.object
}

Placement.displayName = 'Placement'

export default Placement
