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
import { SystemShut as OsIcon } from 'iconoir-react'
import PropTypes from 'prop-types'
import { useMemo } from 'react'
import { useFormContext } from 'react-hook-form'

import { useViews } from '@FeaturesModule'
import { Translate } from '@modules/components/HOC'

import { TabType } from '@modules/components/Forms/VmTemplate/CreateForm/Steps/ExtraConfiguration'
import BootOrder from '@modules/components/Forms/VmTemplate/CreateForm/Steps/ExtraConfiguration/booting/bootOrder'
import Networking from '@modules/components/Forms/VmTemplate/CreateForm/Steps/ExtraConfiguration/networking'
import Placement from '@modules/components/Forms/VmTemplate/CreateForm/Steps/ExtraConfiguration/placement'
import Scheduling from '@modules/components/Forms/VmTemplate/CreateForm/Steps/ExtraConfiguration/scheduleAction'
import Storage from '@modules/components/Forms/VmTemplate/CreateForm/Steps/ExtraConfiguration/storage'
import Pci from '@modules/components/Forms/VmTemplate/CreateForm/Steps/ExtraConfiguration/pci'
import { BaseTab as Tabs } from '@modules/components/Tabs'

import { RESOURCE_NAMES, T, VmTemplate } from '@ConstantsModule'
import { getActionsAvailable as getSectionsAvailable } from '@ModelsModule'
import { SCHEMA } from '@modules/components/Forms/VmTemplate/InstantiateForm/Steps/ExtraConfiguration/schema'

export const STEP_ID = 'extra'

/** @type {TabType[]} */
export const TABS = [
  Storage,
  Networking,
  Pci,
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

const Content = ({
  data,
  setFormData,
  hypervisor,
  oneConfig,
  adminGroup,
  vmTemplate,
}) => {
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
                vmTemplate,
              }}
            />
          ),
          error: getError?.(errors[STEP_ID]),
        })
      ),
    [totalErrors, view, control]
  )

  return <Tabs addBorder tabs={tabs} />
}

/**
 * Optional configuration about VM Template.
 *
 * @param {VmTemplate} vmTemplate - VM Template
 * @returns {object} Optional configuration step
 */
const ExtraConfiguration = ({ vmTemplate, oneConfig, adminGroup }) => {
  const hypervisor = vmTemplate?.TEMPLATE?.HYPERVISOR

  return {
    id: STEP_ID,
    label: T.AdvancedOptions,
    resolver: SCHEMA,
    optionsValidate: { abortEarly: false },
    content: (props) =>
      Content({
        ...props,
        hypervisor,
        oneConfig,
        adminGroup,
        instantiate: true,
        vmTemplate: vmTemplate,
      }),
  }
}

Content.propTypes = {
  data: PropTypes.any,
  setFormData: PropTypes.func,
  hypervisor: PropTypes.string,
  oneConfig: PropTypes.object,
  adminGroup: PropTypes.bool,
  vmTemplate: PropTypes.any,
}

export default ExtraConfiguration
