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
// eslint-disable-next-line no-unused-vars
import { useMemo, JSXElementConstructor } from 'react'
import PropTypes from 'prop-types'
// eslint-disable-next-line no-unused-vars
import { useFormContext, FieldErrors } from 'react-hook-form'

import { useAuth } from 'client/features/Auth'
import { Tr, Translate } from 'client/components/HOC'

import Tabs from 'client/components/Tabs'
import Storage from 'client/components/Forms/VmTemplate/CreateForm/Steps/ExtraConfiguration/storage'
import Networking from 'client/components/Forms/VmTemplate/CreateForm/Steps/ExtraConfiguration/networking'
import Placement from 'client/components/Forms/VmTemplate/CreateForm/Steps/ExtraConfiguration/placement'
import ScheduleAction from 'client/components/Forms/VmTemplate/CreateForm/Steps/ExtraConfiguration/scheduleAction'
import Booting from 'client/components/Forms/VmTemplate/CreateForm/Steps/ExtraConfiguration/booting'
import Context from 'client/components/Forms/VmTemplate/CreateForm/Steps/ExtraConfiguration/context'
import InputOutput from 'client/components/Forms/VmTemplate/CreateForm/Steps/ExtraConfiguration/inputOutput'
import Numa from 'client/components/Forms/VmTemplate/CreateForm/Steps/ExtraConfiguration/numa'

import { STEP_ID as GENERAL_ID } from 'client/components/Forms/VmTemplate/CreateForm/Steps/General'
import { SCHEMA } from 'client/components/Forms/VmTemplate/CreateForm/Steps/ExtraConfiguration/schema'
import { getActionsAvailable as getSectionsAvailable } from 'client/models/Helper'
import { T } from 'client/constants'

/**
 * @typedef {object} TabType
 * @property {string} id - Id will be to use in view yaml to hide/display the tab
 * @property {string} name - Label of tab
 * @property {JSXElementConstructor} Content - Content tab
 * @property {object} [icon] - Icon of tab
 * @property {function(FieldErrors):boolean} [getError] - Returns `true` if the tab contains an error in form
 */

export const STEP_ID = 'extra'

/** @type {TabType[]} */
export const TABS = [
  Storage,
  Networking,
  Booting,
  InputOutput,
  Context,
  ScheduleAction,
  Placement,
  Numa,
]

const Content = ({ data, setFormData }) => {
  const {
    watch,
    formState: { errors },
    control,
  } = useFormContext()
  const { view, getResourceView } = useAuth()

  const hypervisor = useMemo(() => watch(`${GENERAL_ID}.HYPERVISOR`), [])

  const sectionsAvailable = useMemo(() => {
    const dialog = getResourceView('VM-TEMPLATE')?.dialogs?.create_dialog

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

  return tabs.length > 0 ? <Tabs tabs={tabs} /> : <span>{Tr(T.Empty)}</span>
}

const ExtraConfiguration = () => ({
  id: STEP_ID,
  label: T.AdvancedOptions,
  resolver: (formData) => {
    const hypervisor = formData?.[GENERAL_ID]?.HYPERVISOR

    return SCHEMA(hypervisor)
  },
  optionsValidate: { abortEarly: false },
  content: Content,
})

Content.propTypes = {
  data: PropTypes.any,
  setFormData: PropTypes.func,
}

export default ExtraConfiguration
