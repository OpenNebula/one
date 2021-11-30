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
import { useMemo } from 'react'
import PropTypes from 'prop-types'
import { useFormContext } from 'react-hook-form'
import { SystemShut as OsIcon } from 'iconoir-react'

import { useAuth } from 'client/features/Auth'
import { Translate } from 'client/components/HOC'

import Tabs from 'client/components/Tabs'
import { TabType } from 'client/components/Forms/VmTemplate/CreateForm/Steps/ExtraConfiguration'
import Storage from 'client/components/Forms/VmTemplate/CreateForm/Steps/ExtraConfiguration/storage'
import Networking from 'client/components/Forms/VmTemplate/CreateForm/Steps/ExtraConfiguration/networking'
import Placement from 'client/components/Forms/VmTemplate/CreateForm/Steps/ExtraConfiguration/placement'
import Scheduling from 'client/components/Forms/VmTemplate/CreateForm/Steps/ExtraConfiguration/scheduleAction'
import BootOrder from 'client/components/Forms/VmTemplate/CreateForm/Steps/ExtraConfiguration/booting/bootOrder'

import { STEP_ID as TEMPLATE_ID } from 'client/components/Forms/VmTemplate/InstantiateForm/Steps/VmTemplatesTable'
import { SCHEMA } from 'client/components/Forms/VmTemplate/InstantiateForm/Steps/ExtraConfiguration/schema'
import { getActionsAvailable as getSectionsAvailable } from 'client/models/Helper'
import { T } from 'client/constants'

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

const Content = ({ data, setFormData }) => {
  const {
    watch,
    formState: { errors },
    control,
  } = useFormContext()
  const { view, getResourceView } = useAuth()

  const hypervisor = useMemo(() => watch(`${TEMPLATE_ID}.0.HYPERVISOR`), [])

  const sectionsAvailable = useMemo(() => {
    const dialog = getResourceView('VM-TEMPLATE')?.dialogs?.instantiate_dialog

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
          // eslint-disable-next-line react/display-name
          renderContent: () => (
            <TabContent {...{ data, setFormData, hypervisor, control }} />
          ),
          error: getError?.(errors[STEP_ID]),
        })
      ),
    [totalErrors, view, control]
  )

  return <Tabs tabs={tabs} />
}

const ExtraConfiguration = (initialValues) => {
  const initialHypervisor = initialValues?.TEMPLATE?.HYPERVISOR

  return {
    id: STEP_ID,
    label: T.AdvancedOptions,
    resolver: (formData) => {
      const hypervisor =
        formData?.[TEMPLATE_ID]?.[0]?.TEMPLATE?.HYPERVISOR ?? initialHypervisor

      return SCHEMA(hypervisor)
    },
    optionsValidate: { abortEarly: false },
    content: Content,
  }
}

Content.propTypes = {
  data: PropTypes.any,
  setFormData: PropTypes.func,
}

export default ExtraConfiguration
