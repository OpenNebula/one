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
import { useMemo } from 'react'
import PropTypes from 'prop-types'
import { useFormContext } from 'react-hook-form'
import { SystemShut as OsIcon } from 'iconoir-react'

import { useViews } from 'client/features/Auth'
import { Translate } from 'client/components/HOC'

import Tabs from 'client/components/Tabs'
import { TabType } from 'client/components/Forms/VmTemplate/CreateForm/Steps/ExtraConfiguration'
import Storage from 'client/components/Forms/VmTemplate/CreateForm/Steps/ExtraConfiguration/storage'
import Networking from 'client/components/Forms/VmTemplate/CreateForm/Steps/ExtraConfiguration/networking'
import Placement from 'client/components/Forms/VmTemplate/CreateForm/Steps/ExtraConfiguration/placement'
import Scheduling from 'client/components/Forms/VmTemplate/CreateForm/Steps/ExtraConfiguration/scheduleAction'
import BootOrder from 'client/components/Forms/VmTemplate/CreateForm/Steps/ExtraConfiguration/booting/bootOrder'

import { SCHEMA } from 'client/components/Forms/VmTemplate/InstantiateForm/Steps/ExtraConfiguration/schema'
import { getActionsAvailable as getSectionsAvailable } from 'client/models/Helper'
import { T, RESOURCE_NAMES, VmTemplate } from 'client/constants'

export const STEP_ID = 'extra'

/** @type {TabType[]} */
export const TABS = [
  Storage,
  Networking,
  Placement,
  Scheduling,
  {
    id: 'booting',
    name: T.OSBooting,
    icon: OsIcon,
    Content: BootOrder,
    getError: (error) => !!error?.OS,
  },
]

const Content = ({ data, setFormData, hypervisor, oneConfig, adminGroup }) => {
  const {
    formState: { errors },
    control,
  } = useFormContext()
  const { view, getResourceView } = useViews()

  const sectionsAvailable = useMemo(() => {
    const resource = RESOURCE_NAMES.VM_TEMPLATE
    const dialog = getResourceView(resource)?.dialogs?.instantiate_dialog

    return getSectionsAvailable(dialog, hypervisor)
  }, [view])

  const totalErrors = Object.keys(errors[STEP_ID] ?? {}).length

  const tabs = useMemo(
    () =>
      TABS.filter(({ id }) => sectionsAvailable.includes(id)).map(
        ({ Content: TabContent, name, getError, ...section }) => ({
          ...section,
          name,
          label: <Translate word={name} />,
          renderContent: () => (
            <TabContent
              {...{
                data,
                setFormData,
                hypervisor,
                control,
                oneConfig,
                adminGroup,
              }}
            />
          ),
          error: getError?.(errors[STEP_ID]),
        })
      ),
    [totalErrors, view, control]
  )

  return <Tabs tabs={tabs} />
}

/**
 * Optional configuration about VM Template.
 *
 * @param {VmTemplate} vmTemplate - VM Template
 * @returns {object} Optional configuration step
 */
const ExtraConfiguration = ({ data: vmTemplate, oneConfig, adminGroup }) => {
  const hypervisor = vmTemplate?.TEMPLATE?.HYPERVISOR

  return {
    id: STEP_ID,
    label: T.AdvancedOptions,
    resolver: SCHEMA,
    optionsValidate: { abortEarly: false },
    content: (props) =>
      Content({ ...props, hypervisor, oneConfig, adminGroup }),
  }
}

Content.propTypes = {
  data: PropTypes.any,
  setFormData: PropTypes.func,
  hypervisor: PropTypes.string,
  oneConfig: PropTypes.object,
  adminGroup: PropTypes.bool,
}

export default ExtraConfiguration
