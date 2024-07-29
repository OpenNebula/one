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
// eslint-disable-next-line no-unused-vars
import PropTypes from 'prop-types'
// eslint-disable-next-line no-unused-vars
import { ReactElement, useMemo } from 'react'
// eslint-disable-next-line no-unused-vars
import { FieldErrors, useFormContext } from 'react-hook-form'

import Addresses from 'client/components/Forms/VNTemplate/CreateForm/Steps/ExtraConfiguration/addresses'
import Clusters from 'client/components/Forms/VNTemplate/CreateForm/Steps/ExtraConfiguration/clusters'
import Configuration from 'client/components/Forms/VNTemplate/CreateForm/Steps/ExtraConfiguration/configuration'
import Context from 'client/components/Forms/VNTemplate/CreateForm/Steps/ExtraConfiguration/context'
import QoS from 'client/components/Forms/VNTemplate/CreateForm/Steps/ExtraConfiguration/qos'
import { Translate } from 'client/components/HOC'
import Tabs from 'client/components/Tabs'

import { SCHEMA } from 'client/components/Forms/VNTemplate/CreateForm/Steps/ExtraConfiguration/schema'
import { STEP_ID as GENERAL_ID } from 'client/components/Forms/VNTemplate/CreateForm/Steps/General'
import { T, VirtualNetwork } from 'client/constants'

/**
 * @typedef {object} TabType
 * @property {string} id - Id will be to use in view yaml to hide/display the tab
 * @property {string} name - Label of tab
 * @property {ReactElement} Content - Content tab
 * @property {object} [icon] - Icon of tab
 * @property {boolean} [immutable] - If `true`, the section will not be displayed whe is updating
 * @property {function(FieldErrors):boolean} [getError] - Returns `true` if the tab contains an error in form
 */

export const STEP_ID = 'extra'

/** @type {TabType[]} */
export const TABS = [Configuration, Clusters, Addresses, QoS, Context]

const Content = ({ isUpdate, oneConfig, adminGroup }) => {
  const {
    watch,
    formState: { errors },
  } = useFormContext()

  const driver = useMemo(() => watch(`${GENERAL_ID}.VN_MAD`), [])

  const totalErrors = Object.keys(errors[STEP_ID] ?? {}).length

  const tabs = useMemo(
    () =>
      TABS.map(({ Content: TabContent, name, getError, ...section }) => ({
        ...section,
        name,
        label: <Translate word={name} />,
        renderContent: () => (
          <TabContent
            isUpdate={isUpdate}
            driver={driver}
            oneConfig={oneConfig}
            adminGroup={adminGroup}
          />
        ),
        error: getError?.(errors[STEP_ID]),
      })),
    [totalErrors, driver]
  )

  return <Tabs tabs={tabs} />
}

/**
 * Optional configuration about Virtual network.
 *
 * @param {VirtualNetwork} data - Virtual network
 * @returns {object} Optional configuration step
 */
const ExtraConfiguration = ({ data, oneConfig, adminGroup }) => {
  const isUpdate = data?.NAME !== undefined

  return {
    id: STEP_ID,
    label: T.AdvancedOptions,
    resolver: SCHEMA(isUpdate, oneConfig, adminGroup),
    optionsValidate: { abortEarly: false },
    content: (formProps) =>
      Content({ ...formProps, isUpdate, oneConfig, adminGroup }),
  }
}

Content.propTypes = {
  data: PropTypes.any,
  setFormData: PropTypes.func,
  isUpdate: PropTypes.bool,
  oneConfig: PropTypes.object,
  adminGroup: PropTypes.bool,
}

export default ExtraConfiguration
