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
import { T, PATH } from '@ConstantsModule'
import { VmAPI, useModalsApi } from '@FeaturesModule'
import { BackupConfigForm } from '@modules/resources/resources/VirtualMachine/Forms'
import { BackupsTable } from '@modules/resources/Tables'
import { Stack } from '@mui/material'
import PropTypes from 'prop-types'
import { ReactElement } from 'react'
import { generatePath, useHistory } from 'react-router-dom'

import { SubmitButton } from '@ComponentsV2Module'

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
  const { showModal } = useModalsApi()

  const { data: vm = {}, refetch, isFetching } = VmAPI.useGetVmQuery({ id })
  const path = PATH.STORAGE.BACKUPS.DETAIL
  const history = useHistory()

  const [updateConf] = VmAPI.useUpdateConfigurationMutation()

  const handleRowClick = (rowId) => {
    history.push(generatePath(path, { id: String(rowId) }))
  }

  const handleUpdateBackupConf = async ({ template }) =>
    updateConf({ id, template })

  const handleOpenForm = () =>
    showModal({
      dialogProps: {
        title: T.BackupConfigVM,
        dataCy: 'modal-backup-vm',
      },

      onSubmit: handleUpdateBackupConf,

      form: BackupConfigForm({
        stepProps: { oneConfig, adminGroup, vm },
        initialValues: vm,
      }),
    })

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
        <SubmitButton
          data-cy={'backup-vm'}
          label={T.BackupConfigVM}
          disabled={isFetching}
          onClick={handleOpenForm}
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
