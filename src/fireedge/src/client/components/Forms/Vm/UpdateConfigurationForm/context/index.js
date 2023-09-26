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
import { ReactElement } from 'react'
import PropTypes from 'prop-types'

import ConfigurationSection from 'client/components/Forms/VmTemplate/CreateForm/Steps/ExtraConfiguration/context/configurationSection'
import FilesSection from 'client/components/Forms/VmTemplate/CreateForm/Steps/ExtraConfiguration/context/filesSection'
import ContextVarsSection from 'client/components/Forms/VmTemplate/CreateForm/Steps/ExtraConfiguration/context/contextVarsSection'

import { HYPERVISORS } from 'client/constants'

/**
 * @param {object} props - Component props
 * @param {HYPERVISORS} props.hypervisor - VM hypervisor
 * @param {object} props.oneConfig - OpenNEbula configuration
 * @param {boolean} props.adminGroup - If the user is admin
 * @returns {ReactElement} Context section component
 */
const ContextSection = ({ hypervisor, oneConfig, adminGroup }) => (
  <>
    <ConfigurationSection
      hypervisor={hypervisor}
      oneConfig={oneConfig}
      adminGroup={adminGroup}
    />
    <FilesSection
      hypervisor={hypervisor}
      oneConfig={oneConfig}
      adminGroup={adminGroup}
    />
    <ContextVarsSection
      hypervisor={hypervisor}
      oneConfig={oneConfig}
      adminGroup={adminGroup}
    />
  </>
)

ContextSection.propTypes = {
  hypervisor: PropTypes.string,
  oneConfig: PropTypes.object,
  adminGroup: PropTypes.bool,
}

export default ContextSection
