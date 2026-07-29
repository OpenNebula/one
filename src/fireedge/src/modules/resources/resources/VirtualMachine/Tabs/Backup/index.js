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

import { STYLE_BUTTONS, T, VM_ACTION_ENUM } from '@ConstantsModule'
import { Button, Table } from '@ComponentsV2Module'
import { Box } from '@mui/material'
import PropTypes from 'prop-types'
import { Component, useMemo } from 'react'
import { getStyles } from '@modules/resources/resources/VirtualMachine/Tabs/Backup/styles'
import { VirtualMachine } from '@modules/resources/resources'
import { useModalsApi } from '@FeaturesModule'
import { vmbackupsTable } from '@ModelsModule'

/**
 * @param {object} root0 - Params
 * @param {object} root0.data - Tab specific data
 * @param {object} root0.config - Tab view configuration
 * @returns {Component} - VM Instances info tab
 */
export const Backup = ({ data, config }) => {
  const { showModal } = useModalsApi()
  const {
    selectedVm,
    extendedVmData,
    backups = [],
    isFetchingBackups = false,
  } = data || {}
  const vmForBackupConfig = extendedVmData ?? selectedVm

  const { actions, isLoading: isPerformingAction } =
    VirtualMachine.Actions.useActions({
      context:
        (fn) =>
        (params = {}) =>
          fn?.({
            id: selectedVm?.ID,
            ...params,
          }),
    })

  const backupActions = useMemo(
    () => ({
      ...actions,
      [VM_ACTION_ENUM.BACKUP_CONFIGURE]: {
        ...actions?.[VM_ACTION_ENUM.BACKUP_CONFIGURE],
        form: () =>
          actions?.[VM_ACTION_ENUM.BACKUP_CONFIGURE]?.form?.(vmForBackupConfig),
      },
    }),
    [actions, vmForBackupConfig]
  )

  const [configureBackupOption] =
    VirtualMachine.Actions.Utils.generateMenuOptions({
      keys: [VM_ACTION_ENUM.BACKUP_CONFIGURE],
      actions: backupActions,
      vm: vmForBackupConfig,
      viewConfig: config,
      showModal,
    })

  return (
    <Box sx={(theme) => getStyles({ theme })}>
      <Button {...configureBackupOption} type={STYLE_BUTTONS.TYPE.SECONDARY} />
      <Box className="table-container">
        <Table
          columns={vmbackupsTable.columns()}
          data={backups}
          isLoading={isFetchingBackups || isPerformingAction}
          emptyContentProps={{
            title: T.NoBackups,
            subtitle: T.VmBackupsWillAppearHere,
          }}
          size="medium"
          isEnableSearchBar
          isEnableSort
          isEnableFilters
        />
      </Box>
    </Box>
  )
}

Backup.propTypes = {
  data: PropTypes.object,
  config: PropTypes.object,
}

Backup.id = 'backup'
Backup.title = T.Backup
