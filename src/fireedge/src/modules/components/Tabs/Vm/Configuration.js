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
import { ReactElement, useMemo } from 'react'
import PropTypes from 'prop-types'
import { Box, Stack } from '@mui/material'

import { VmAPI } from '@FeaturesModule'
import ButtonToTriggerForm from '@modules/components/Forms/ButtonToTriggerForm'
import { UpdateConfigurationForm } from '@modules/components/Forms/Vm'
import { List } from '@modules/components/Tabs/Common'

import {
  getHypervisor,
  isVmAvailableAction,
  getActionsAvailable,
  jsonToXml,
} from '@ModelsModule'
import {
  T,
  VM_ACTIONS,
  ATTR_CONF_CAN_BE_UPDATED,
  STYLE_BUTTONS,
} from '@ConstantsModule'

const { UPDATE_CONF } = VM_ACTIONS

/**
 * Renders configuration tab.
 *
 * @param {object} props - Props
 * @param {object|boolean} props.tabProps - Tab properties
 * @param {object} [props.tabProps.actions] - Actions from tab view yaml
 * @param {string} props.id - Virtual machine id
 * @param {object} props.oneConfig - OpenNEbula configuration
 * @param {boolean} props.adminGroup - If the user is admin
 * @returns {ReactElement} Configuration tab
 */
const VmConfigurationTab = ({
  tabProps: { actions } = {},
  id,
  oneConfig,
  adminGroup,
}) => {
  const [updateConf] = VmAPI.useUpdateConfigurationMutation()
  const { data: vm = {}, isFetching } = VmAPI.useGetVmQuery({ id })
  const { TEMPLATE, BACKUPS } = vm

  const hypervisor = useMemo(() => getHypervisor(vm), [vm])

  const isUpdateConfEnabled = useMemo(() => {
    const actionsByHypervisor = getActionsAvailable(actions, hypervisor)
    const actionsByState = actionsByHypervisor.filter((action) =>
      isVmAvailableAction(action, vm)
    )

    return actionsByState.includes?.(UPDATE_CONF)
  }, [vm])

  const sections = useMemo(() => {
    const filterSection = (section) => {
      const supported = ATTR_CONF_CAN_BE_UPDATED[section] || '*'
      const attributes = TEMPLATE[section] || BACKUPS[section] || {}
      const sectionAttributes = []

      const getAttrFromEntry = (key, value, idx) => {
        const isSupported = supported === '*' || supported.includes(key)
        const hasValue = typeof value === 'string' && value !== ''

        if (isSupported && hasValue) {
          const name = idx ? `${idx}.${key}` : key
          sectionAttributes.push({
            name,
            value,
            dataCy: name,
            canCopy: true,
            showActionsOnHover: true,
          })
        }
      }

      const addAttrFromAttributes = (attrs, keyAsIndex) => {
        for (const [key, value] of Object.entries(attrs)) {
          typeof value === 'object'
            ? addAttrFromAttributes(value, key)
            : getAttrFromEntry(key, value, keyAsIndex)
        }
      }

      addAttrFromAttributes(attributes)

      return sectionAttributes
    }

    return Object.keys(ATTR_CONF_CAN_BE_UPDATED).map(filterSection)
  }, [TEMPLATE])

  const handleUpdateConf = async (newConfiguration) => {
    const xml = jsonToXml(newConfiguration)
    await updateConf({ id, template: xml })
  }

  const [
    osAttributes,
    featuresAttributes,
    inputAttributes,
    graphicsAttributes,
    rawAttributes,
    contextAttributes,
    backupAttributes,
  ] = sections

  return (
    <Box padding={{ sm: '0.8em' }}>
      {isUpdateConfEnabled && (
        <ButtonToTriggerForm
          buttonProps={{
            'data-cy': 'update-conf',
            label: T.UpdateVmConfiguration,
            importance: STYLE_BUTTONS.IMPORTANCE.MAIN,
            size: STYLE_BUTTONS.SIZE.MEDIUM,
            type: STYLE_BUTTONS.TYPE.FILLED,
            disabled: isFetching,
          }}
          options={[
            {
              dialogProps: {
                title: T.UpdateVmConfiguration,
                dataCy: 'modal-update-conf',
              },
              form: () =>
                UpdateConfigurationForm({
                  stepProps: { hypervisor, oneConfig, adminGroup, vm },
                  initialValues: vm,
                }),
              onSubmit: handleUpdateConf,
            },
          ]}
        />
      )}

      <Stack
        display="grid"
        gap="1em"
        gridTemplateColumns="repeat(auto-fit, minmax(49%, 1fr))"
        marginTop="1em"
      >
        {osAttributes?.length > 0 && (
          <List title={T.OSAndCpu} list={osAttributes} />
        )}
        {backupAttributes?.length > 0 && (
          <List title={T.Backup} list={backupAttributes} />
        )}
        {featuresAttributes?.length > 0 && (
          <List title={T.Features} list={featuresAttributes} />
        )}
        {inputAttributes?.length > 0 && (
          <List title={T.Input} list={inputAttributes} />
        )}
        {graphicsAttributes?.length > 0 && (
          <List title={T.Graphics} list={graphicsAttributes} />
        )}
        {rawAttributes?.length > 0 && (
          <List title={T.Raw} list={rawAttributes} />
        )}
        {contextAttributes?.length > 0 && (
          <List
            title={T.Context}
            list={contextAttributes}
            containerProps={{
              sx: {
                gridColumnStart: '2',
                gridRow: `1 / ${sections.length}`,
              },
            }}
          />
        )}
      </Stack>
    </Box>
  )
}

VmConfigurationTab.propTypes = {
  tabProps: PropTypes.object,
  id: PropTypes.string,
  oneConfig: PropTypes.object,
  adminGroup: PropTypes.bool,
}

VmConfigurationTab.displayName = 'VmConfigurationTab'

export default VmConfigurationTab
