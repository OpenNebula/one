/* ------------------------------------------------------------------------- *
 * Copyright 2002-2022, OpenNebula Project, OpenNebula Systems               *
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
import { useFormContext } from 'react-hook-form'
import {
  SystemShut as OsIcon,
  DataTransferBoth as IOIcon,
  Folder as ContextIcon,
} from 'iconoir-react'

import InputOutput from 'client/components/Forms/Vm/UpdateConfigurationForm/inputOutput'
import Booting from 'client/components/Forms/Vm/UpdateConfigurationForm/booting'
import Context from 'client/components/Forms/Vm/UpdateConfigurationForm/context'

import Tabs from 'client/components/Tabs'
import { Translate } from 'client/components/HOC'
import { T, HYPERVISORS } from 'client/constants'

/**
 * @param {object} props - Component props
 * @param {HYPERVISORS} props.hypervisor - VM hypervisor
 * @returns {ReactElement} Form content component
 */
const Content = ({ hypervisor }) => {
  const {
    formState: { errors },
  } = useFormContext()

  const tabs = useMemo(
    () => [
      {
        id: 'booting',
        icon: OsIcon,
        label: <Translate word={T.OSAndCpu} />,
        renderContent: () => <Booting hypervisor={hypervisor} />,
        error: !!errors?.OS,
      },
      {
        id: 'input_output',
        icon: IOIcon,
        label: <Translate word={T.InputOrOutput} />,
        renderContent: () => <InputOutput hypervisor={hypervisor} />,
        error: ['GRAPHICS', 'INPUT'].some((id) => errors?.[id]),
      },
      {
        id: 'context',
        icon: ContextIcon,
        label: <Translate word={T.Context} />,
        renderContent: () => <Context hypervisor={hypervisor} />,
        error: !!errors?.CONTEXT,
      },
    ],
    [errors, hypervisor]
  )

  return <Tabs tabs={tabs} />
}

Content.propTypes = { hypervisor: PropTypes.string }

export default Content
