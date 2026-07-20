/* ------------------------------------------------------------------------- *
 * Copyright 2002-2026, OpenNebula Project, OpenNebula Systems               *
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
import PropTypes from 'prop-types'
import { useMemo, useState } from 'react'
import { useFormContext } from 'react-hook-form'
import { Box } from '@mui/material'
import { Settings as ConfigurationsIcon } from 'iconoir-react'

import Addresses from '@modules/resources/resources/VnTemplate/Forms/CreateForm/Steps/Configuration/addresses'
import Clusters from '@modules/resources/resources/VnTemplate/Forms/CreateForm/Steps/Configuration/clusters'
import NetworkConfiguration from '@modules/resources/Forms/Commons/VNetwork/Tabs/configuration'
import { FIELDS_INSTANTIATE } from '@modules/resources/Forms/Commons/VNetwork/Tabs/configuration/schema'
import Context from '@modules/resources/resources/VnTemplate/Forms/CreateForm/Steps/Configuration/context'
import QoS from '@modules/resources/resources/VnTemplate/Forms/CreateForm/Steps/Configuration/qos'
import Security from '@modules/resources/resources/VnTemplate/Forms/CreateForm/Steps/Configuration/security'
import { FormWithSchema, Tabs } from '@ComponentsV2Module'

import { useViews } from '@FeaturesModule'
import { SCHEMA } from '@modules/resources/resources/VnTemplate/Forms/CreateForm/Steps/Configuration/schema'
import { STEP_ID } from '@modules/resources/resources/VnTemplate/Forms/CreateForm/Steps/Configuration/constants'
import { STEP_ID as GENERAL_ID } from '@modules/resources/resources/VnTemplate/Forms/CreateForm/Steps/General'
import { RESOURCE_NAMES, T } from '@ConstantsModule'

/**
 * @typedef {object} TabType
 * @property {string} id - Id will be to use in view yaml to hide/display the tab
 * @property {string} name - Label of tab
 * @property {object} Content - Content tab
 * @property {object} [icon] - Icon of tab
 * @property {boolean} [immutable] - If `true`, the section will not be displayed whe is updating
 * @property {function(object):boolean} [getError] - Returns `true` if the tab contains an error in form
 */

const InstantiateNetworkConfigurationContent = (stepId) => {
  const InnerComponent = ({ oneConfig, adminGroup }) => (
    <FormWithSchema
      id={stepId}
      cy="configuration"
      fields={FIELDS_INSTANTIATE(oneConfig, adminGroup, true)}
    />
  )

  InnerComponent.displayName = 'InstantiateNetworkConfigurationContent'
  InnerComponent.propTypes = {
    oneConfig: PropTypes.object,
    adminGroup: PropTypes.bool,
  }

  return InnerComponent
}

const InstantiateNetworkConfiguration = (stepId) => ({
  id: 'configuration',
  name: T.Configuration,
  icon: ConfigurationsIcon,
  Content: InstantiateNetworkConfigurationContent(stepId),
  getError: (error) => FIELDS_INSTANTIATE().some(({ name }) => error?.[name]),
})

const getTabs = (isInstantiate) => [
  isInstantiate
    ? InstantiateNetworkConfiguration(STEP_ID)
    : NetworkConfiguration(STEP_ID),
  Clusters,
  Addresses,
  Security,
  QoS,
  Context,
]

const INSTANTIATE_TAB_ALIASES = {
  addresses: 'address',
}

const isInstantiateTabEnabled = (instantiateTabs, tabId) => {
  const yamlTabId = INSTANTIATE_TAB_ALIASES[tabId] ?? tabId

  return instantiateTabs?.[yamlTabId]?.enabled === true
}

const Content = ({
  isUpdate,
  oneConfig,
  adminGroup,
  tabIds,
  isInstantiate,
}) => {
  const [selected, setSelected] = useState(0)
  const {
    watch,
    formState: { errors },
  } = useFormContext()
  const { getResourceView } = useViews()

  const driver = useMemo(() => watch(`${GENERAL_ID}.VN_MAD`), [])

  const stepErrors = errors[STEP_ID]
  const availableTabs = useMemo(() => getTabs(isInstantiate), [isInstantiate])
  const instantiateTabs = useMemo(
    () =>
      isInstantiate
        ? getResourceView(RESOURCE_NAMES.VN_TEMPLATE)?.['instantiate-tabs'] ??
          {}
        : {},
    [getResourceView, isInstantiate]
  )
  const visibleTabs = useMemo(
    () =>
      availableTabs.filter(
        ({ id, immutable }) =>
          (!tabIds || tabIds.includes(id)) &&
          (!isInstantiate || isInstantiateTabEnabled(instantiateTabs, id)) &&
          !(isUpdate && immutable)
      ),
    [availableTabs, instantiateTabs, isInstantiate, isUpdate, tabIds]
  )

  const tabs = useMemo(
    () =>
      visibleTabs.map(
        ({ Content: TabContent, name, getError, ...section }) => ({
          ...section,
          name,
          title: name,
          getError,
          Content: () => (
            <TabContent
              isUpdate={isUpdate}
              driver={driver}
              oneConfig={oneConfig}
              adminGroup={adminGroup}
              isInstantiate={isInstantiate}
            />
          ),
        })
      ),
    [driver, visibleTabs]
  )

  const {
    id: activeId,
    name: activeName,
    Content: ActiveContent,
  } = tabs[selected] ?? tabs[0] ?? {}

  return (
    <Box sx={{ height: 'auto', overflow: 'auto' }}>
      <Tabs
        type="line"
        defaultSelect={0}
        options={tabs.map(({ id, title, getError }, idx) => ({
          dataCy: id && `tab-${id}`,
          title,
          error: !!getError?.(stepErrors),
          value: idx,
        }))}
        onChange={(idx) => setSelected(idx)}
      />
      {ActiveContent && (
        <Box
          key={`tab-${activeId ?? activeName}`}
          data-cy={`tab-content-${activeId ?? activeName}`}
        >
          <ActiveContent />
        </Box>
      )}
    </Box>
  )
}

/**
 * Optional configuration about Virtual network.
 *
 * @param {object} root0 - Props
 * @param {object} root0.data - Virtual network
 * @param {object} root0.oneConfig - Open Nebula configuration
 * @param {boolean} root0.adminGroup - If the user belongs to oneadmin group
 * @param {boolean} root0.isUpdate - If `true`, the form is being updated
 * @param {string[]} root0.tabIds - Configuration tabs included in the step
 * @param {boolean} root0.isInstantiate - If `true`, the form is instantiating
 * @returns {object} Optional configuration step
 */
const Configuration = ({
  data,
  oneConfig,
  adminGroup,
  isUpdate: update,
  tabIds,
  isInstantiate,
}) => {
  const isUpdate = update ?? data?.NAME !== undefined

  return {
    id: STEP_ID,
    label: T.AdvancedOptions,
    resolver: SCHEMA(
      isUpdate,
      oneConfig,
      adminGroup,
      undefined,
      tabIds,
      isInstantiate
    ),
    optionsValidate: { abortEarly: false },
    content: (formProps) =>
      Content({
        ...formProps,
        isUpdate,
        oneConfig,
        adminGroup,
        tabIds,
        isInstantiate,
      }),
  }
}

Content.propTypes = {
  isUpdate: PropTypes.bool,
  oneConfig: PropTypes.object,
  adminGroup: PropTypes.bool,
  tabIds: PropTypes.arrayOf(PropTypes.string),
  isInstantiate: PropTypes.bool,
}

export { STEP_ID }

export default Configuration
