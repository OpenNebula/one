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
import { ReactElement, useMemo } from 'react'
import PropTypes from 'prop-types'
import { Stack, FormControl } from '@mui/material'
import Legend from 'client/components/Forms/Legend'
import { BootOrder } from 'client/components/Forms/VmTemplate/CreateForm/Steps/ExtraConfiguration'
import FormWithSchema from 'client/components/Forms/FormWithSchema'
import { SECTIONS } from 'client/components/Forms/Vm/UpdateConfigurationForm/booting/schema'
import { HYPERVISORS, T } from 'client/constants'

/**
 * @param {object} props - Component props
 * @param {HYPERVISORS} props.hypervisor - VM hypervisor
 * @param {object} props.oneConfig - Config of oned.conf
 * @param {boolean} props.adminGroup - User is admin or not
 * @param {object} props.vm - VM template
 * @returns {ReactElement} OS section component
 */
const OsSection = ({ hypervisor, oneConfig, adminGroup, vm }) => {
  const enableBootOrder = !!vm?.TEMPLATE?.DISK || !!vm?.TEMPLATE?.NIC
  const sections = useMemo(
    () => SECTIONS({ hypervisor, oneConfig, adminGroup }),
    [hypervisor]
  )

  return (
    <Stack
      display="grid"
      gap="1em"
      sx={{ gridTemplateColumns: { sm: '1fr', md: '1fr 1fr' } }}
    >
      {enableBootOrder && (
        <FormControl
          component="fieldset"
          sx={{ width: '100%', gridColumn: '1 / span 2', gridRow: '1' }}
        >
          <Legend title={T.BootOrder} tooltip={T.BootOrderConcept} />
          <BootOrder />
        </FormControl>
      )}
      {sections.map(({ id, ...section }) => (
        <FormWithSchema key={id} cy={id} {...section} />
      ))}
    </Stack>
  )
}

OsSection.propTypes = {
  hypervisor: PropTypes.string,
  oneConfig: PropTypes.object,
  adminGroup: PropTypes.bool,
  vm: PropTypes.object,
}

export default OsSection
