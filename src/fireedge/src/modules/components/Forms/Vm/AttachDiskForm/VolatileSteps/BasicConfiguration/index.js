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
import { useMemo, useEffect } from 'react'
import PropTypes from 'prop-types'

import FormWithSchema from '@modules/components/Forms/FormWithSchema'
import {
  SCHEMA,
  FIELDS,
} from '@modules/components/Forms/Vm/AttachDiskForm/VolatileSteps/BasicConfiguration/schema'
import { Step } from '@UtilsModule'
import { T, HYPERVISORS } from '@ConstantsModule'
import { useGeneralApi } from '@FeaturesModule'

export const STEP_ID = 'configuration'

const Content = ({ hypervisor, oneConfig, adminGroup, disk, selectDiskId }) => {
  const { setFieldPath } = useGeneralApi()

  useEffect(() => {
    const fieldPath = `extra.Storage.${selectDiskId}`
    setFieldPath(fieldPath)
  }, [])

  const memoFields = useMemo(
    () => FIELDS(hypervisor, oneConfig, adminGroup),
    []
  )

  return (
    <FormWithSchema
      cy="attach-disk"
      fields={memoFields}
      id={STEP_ID}
      saveState={true}
    />
  )
}

/**
 * Renders configuration to volatile disk.
 *
 * @param {object} props - Props
 * @param {HYPERVISORS} props.hypervisor - Hypervisor
 * @param {object} props.oneConfig - Config of oned.conf
 * @param {boolean} props.adminGroup - User is admin or not
 * @param {number} props.selectDiskId - Total existing number of disks
 * @returns {Step} Basic configuration step
 */
const BasicConfiguration = ({
  hypervisor,
  oneConfig,
  adminGroup,
  selectDiskId,
} = {}) => ({
  id: STEP_ID,
  label: T.Configuration,
  resolver: SCHEMA(hypervisor, oneConfig, adminGroup),
  optionsValidate: { abortEarly: false },
  content: () => Content({ hypervisor, oneConfig, adminGroup, selectDiskId }),
})

Content.propTypes = {
  hypervisor: PropTypes.any,
  data: PropTypes.any,
  setFormData: PropTypes.func,
  oneConfig: PropTypes.object,
  adminGroup: PropTypes.bool,
  selectDiskId: PropTypes.number,
  disk: PropTypes.object,
}

export default BasicConfiguration
