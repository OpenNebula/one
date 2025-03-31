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
// eslint-disable-next-line no-unused-vars
import { useMemo, ReactElement } from 'react'
import PropTypes from 'prop-types'
// eslint-disable-next-line no-unused-vars
import { useFormContext, FieldErrors } from 'react-hook-form'

import { BaseTab as Tabs } from '@modules/components/Tabs'
import Configuration from '@modules/components/Forms/Commons/VNetwork/Tabs/configuration'
import Addresses from '@modules/components/Forms/VNetwork/CreateForm/Steps/ExtraConfiguration/addresses'
import Security from '@modules/components/Forms/VNetwork/CreateForm/Steps/ExtraConfiguration/security'
import QoS from '@modules/components/Forms/VNetwork/CreateForm/Steps/ExtraConfiguration/qos'
import Context from '@modules/components/Forms/VNetwork/CreateForm/Steps/ExtraConfiguration/context'
import { Translate } from '@modules/components/HOC'

import { STEP_ID as GENERAL_ID } from '@modules/components/Forms/VNetwork/CreateForm/Steps/General'
import { SCHEMA } from '@modules/components/Forms/VNetwork/CreateForm/Steps/ExtraConfiguration/schema'
import { T, VirtualNetwork } from '@ConstantsModule'

import { Box } from '@mui/material'

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
export const TABS = [Configuration(STEP_ID), Addresses, Security, QoS, Context]

const Content = ({ isUpdate, isVnet, oneConfig, adminGroup }) => {
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
            isVnet={isVnet}
            driver={driver}
            oneConfig={oneConfig}
            adminGroup={adminGroup}
          />
        ),
        error: getError?.(errors[STEP_ID]),
      })),
    [totalErrors, driver]
  )

  return (
    <Box sx={{ height: 'auto', overflow: 'auto' }}>
      <Tabs addBorder tabs={tabs} />
    </Box>
  )
}

/**
 * Optional configuration about Virtual network.
 *
 * @param {VirtualNetwork} data - Virtual network
 * @returns {object} Optional configuration step
 */
const ExtraConfiguration = ({ data, oneConfig, adminGroup }) => {
  const isUpdate = data?.NAME !== undefined
  const isVnet = true

  return {
    id: STEP_ID,
    label: T.AdvancedOptions,
    resolver: SCHEMA(isUpdate, oneConfig, adminGroup),
    optionsValidate: { abortEarly: false },
    content: (formProps) =>
      Content({ ...formProps, isUpdate, oneConfig, adminGroup, isVnet }),
  }
}

Content.propTypes = {
  data: PropTypes.any,
  setFormData: PropTypes.func,
  isUpdate: PropTypes.bool,
  isVnet: PropTypes.bool,
  oneConfig: PropTypes.object,
  adminGroup: PropTypes.bool,
}

export default ExtraConfiguration
