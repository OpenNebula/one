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
import { STYLE_BUTTONS, T } from '@ConstantsModule'
import { VmAPI } from '@FeaturesModule'
import { jsonToXml } from '@ModelsModule'
import ButtonToTriggerForm from '@modules/components/Forms/ButtonToTriggerForm'
import { BackupConfigForm } from '@modules/components/Forms/Vm'
import { PATH } from '@modules/components/path'
import { BackupsTable } from '@modules/components/Tables'
import { Stack } from '@mui/material'
import PropTypes from 'prop-types'
import { ReactElement } from 'react'
import { generatePath, useHistory } from 'react-router-dom'

/**
 * Renders the list of backups from a VM.
 *
 * @param {object} props - Props
 * @param {string} props.id - Virtual Machine id
 * @param {object} props.oneConfig - OpenNEbula configuration
 * @param {boolean} props.adminGroup - If the user is admin
 * @returns {ReactElement} Backups tab
 */
const VmBackupTab = ({ id, oneConfig, adminGroup }) => {
  const { data: vm = {}, refetch, isFetching } = VmAPI.useGetVmQuery({ id })
  const path = PATH.STORAGE.BACKUPS.DETAIL
  const history = useHistory()

  const [updateConf] = VmAPI.useUpdateConfigurationMutation()

  const handleRowClick = (rowId) => {
    history.push(generatePath(path, { id: String(rowId) }))
  }

  const handleUpdateBackupConf = async (newConfiguration) => {
    const xml = jsonToXml(newConfiguration)
    await updateConf({ id, template: xml })
  }

  return (
    <>
      {/* <Backup oneConfig={oneConfig} adminGroup={adminGroup} /> */}
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="start"
        gap="1rem"
        marginBottom="1rem"
      >
        <ButtonToTriggerForm
          buttonProps={{
            'data-cy': 'backup-vm',
            label: T.BackupConfigVM,
            importance: STYLE_BUTTONS.IMPORTANCE.MAIN,
            size: STYLE_BUTTONS.SIZE.MEDIUM,
            type: STYLE_BUTTONS.TYPE.FILLED,
            disabled: isFetching,
          }}
          options={[
            {
              dialogProps: {
                title: T.BackupConfigVM,
                dataCy: 'modal-backup-vm',
              },
              form: () =>
                BackupConfigForm({
                  stepProps: { oneConfig, adminGroup, vm },
                  initialValues: vm,
                }),
              onSubmit: handleUpdateBackupConf,
            },
          ]}
        />
      </Stack>

      <BackupsTable.Table
        disableRowSelect
        disableGlobalSort
        refetchVm={refetch}
        isFetchingVm={isFetching}
        vm={vm}
        onRowClick={(row) => handleRowClick(row.ID)}
      />
    </>
  )
}

VmBackupTab.propTypes = {
  tabProps: PropTypes.object,
  id: PropTypes.string,
  oneConfig: PropTypes.object,
  adminGroup: PropTypes.bool,
}

VmBackupTab.displayName = 'VmBackupTab'

export default VmBackupTab
