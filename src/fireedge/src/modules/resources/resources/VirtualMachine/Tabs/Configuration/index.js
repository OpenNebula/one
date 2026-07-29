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

import {
  T,
  VM_ACTION_ENUM,
  STYLE_BUTTONS,
  ATTR_CONF_CAN_BE_UPDATED,
} from '@ConstantsModule'
import { Button, DetailsCard } from '@ComponentsV2Module'
import { Box } from '@mui/material'
import PropTypes from 'prop-types'
import { Component } from 'react'
import { getStyles } from '@modules/resources/resources/VirtualMachine/Tabs/Configuration/styles'
import { VirtualMachine } from '@modules/resources/resources'
import { useModalsApi } from '@FeaturesModule'

/**
 * @param {object} root0 - Params
 * @param {object} root0.data - Tab specific data
 * @param {object} root0.config - Tab view configuration
 * @returns {Component} - VM Instances info tab
 */
export const Configuration = ({ data, config }) => {
  const { showModal } = useModalsApi()
  const { extendedVmData, selectedVm } = data || {}
  const vmForUpdateConfig = extendedVmData ?? selectedVm

  const { actions } = VirtualMachine.Actions.useActions({
    context:
      (fn) =>
      (params = {}) =>
        fn?.({
          id: selectedVm?.ID,
          ...params,
        }),
  })

  const [updateConfAction] = VirtualMachine.Actions.Utils.generateMenuOptions({
    keys: [VM_ACTION_ENUM.UPDATE_CONF],
    actions,
    vm: selectedVm,
    formContext: vmForUpdateConfig,
    viewConfig: config,
    showModal,
  })

  const getSectionOptions = (section, attributes = {}) => {
    const supported = ATTR_CONF_CAN_BE_UPDATED[section] || '*'
    const options = []

    const addOption = (key, value, prefix) => {
      const isSupported = supported === '*' || supported.includes(key)
      const hasValue =
        value !== undefined &&
        value !== null &&
        value !== '' &&
        typeof value !== 'object'

      if (!isSupported || !hasValue) return

      options.push([prefix ? `${prefix}.${key}` : key, value])
    }

    const walk = (attrs = {}, prefix) => {
      Object.entries(attrs || {}).forEach(([key, value]) => {
        if (typeof value === 'object' && value !== null) {
          walk(value, key)
        } else {
          addOption(key, value, prefix)
        }
      })
    }

    walk(attributes)

    return options
  }

  const { TEMPLATE = {}, BACKUPS = {} } = extendedVmData ?? {}

  const cards = Object.keys(ATTR_CONF_CAN_BE_UPDATED)
    .map((section) => {
      const attributes =
        section === 'BACKUP_CONFIG'
          ? BACKUPS?.BACKUP_CONFIG
          : TEMPLATE?.[section]

      return {
        title: T[section] ?? section,
        options: getSectionOptions(section, attributes),
      }
    })
    .filter(({ options }) => options.length)

  return (
    <Box sx={(theme) => getStyles({ theme })}>
      <Button {...updateConfAction} type={STYLE_BUTTONS.TYPE.SECONDARY} />
      <Box className="card-container">
        {cards?.map((card, idx) => (
          <DetailsCard key={idx} {...card} />
        ))}
      </Box>
    </Box>
  )
}

Configuration.propTypes = {
  data: PropTypes.object,
  config: PropTypes.object,
}

Configuration.id = 'configuration'
Configuration.title = T.Configuration
