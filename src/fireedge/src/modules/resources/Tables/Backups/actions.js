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
import { Typography } from '@mui/material'
import { Group, Trash } from 'iconoir-react'
import { useMemo } from 'react'

import { ImageAPI, useViews } from '@FeaturesModule'

import {
  ChangeGroupForm,
  ChangeUserForm,
} from '@modules/resources/resources/VirtualMachine/Forms'
import {
  GlobalAction,
  createActions,
} from '@modules/resources/Tables/Enhanced/Utils'
import * as BackupsResource from '@modules/resources/resources/Backups'

import { IMAGE_ACTIONS, RESOURCE_NAMES, T } from '@ConstantsModule'
import {
  getBackupDiskIds,
  getBackupIncrements,
  getBackupRestoreOptions,
  getBackupVmIds,
  isVmAvailableAction,
} from '@ModelsModule'
import { Translate } from '@ProvidersModule'

const isDisabled = (action) => (rows) =>
  !isVmAvailableAction(
    action,
    rows.map(({ original }) => original)
  )

const ListImagesNames = ({ rows = [] }) =>
  rows?.map?.(({ id, original }) => {
    const { ID, NAME } = original

    return (
      <Typography
        key={`image-${id}`}
        variant="inherit"
        component="span"
        display="block"
      >
        {`#${ID} ${NAME}`}
      </Typography>
    )
  })

const SubHeader = (rows) => <ListImagesNames rows={rows} />

const MessageToConfirmAction = (rows) => (
  <>
    <ListImagesNames rows={rows} />
    <Translate word={T.DoYouWantProceed} />
  </>
)

/**
 * Generates the actions to operate resources on Backup table.
 *
 * @param {object} props - datatable props
 * @param {Function} props.setSelectedRows - set selected rows
 * @returns {GlobalAction} - Actions
 */
const Actions = (props = {}) => {
  const { setSelectedRows } = props
  const { view, getResourceView } = useViews()
  const [changeOwnership] = ImageAPI.useChangeImageOwnershipMutation()
  const [restoreBackup] = ImageAPI.useRestoreBackupMutation()
  const [deleteImage] = ImageAPI.useRemoveImageMutation()

  const resourcesView = getResourceView(RESOURCE_NAMES.BACKUP)?.actions

  const backupActions = useMemo(
    () =>
      createActions({
        filters: resourcesView,
        actions: [
          {
            accessor: IMAGE_ACTIONS.RESTORE,
            dataCy: `image-${IMAGE_ACTIONS.RESTORE}`,
            label: T.Restore,
            tooltip: T.Restore,
            selected: { max: 1 },
            options: [
              {
                dialogProps: {
                  title: T.RestoreBackup,
                  dataCy: 'modal-select-cluster',
                },
                form: (row) => {
                  const backup = row?.[0]?.original
                  const increments = getBackupIncrements(backup)
                  const backupDiskIds = getBackupDiskIds(backup)
                  const vmsId = getBackupVmIds(backup)

                  return BackupsResource.Forms.RestoreForm({
                    stepProps: {
                      increments,
                      backupDiskIds,
                      vmsId,
                      disableImageSelection: true,
                    },
                    initialValues: {
                      increments: increments,
                      backupDiskIds: backupDiskIds,
                    },
                  })
                },
                onSubmit: (rows) => async (formData) => {
                  const ids = rows?.map?.(({ original }) => original?.ID)
                  const options = getBackupRestoreOptions(formData)

                  await Promise.all(
                    ids.map((id) =>
                      restoreBackup({
                        id: id,
                        datastore: formData.datastore,
                        options,
                      })
                    )
                  )
                },
              },
            ],
          },
          {
            tooltip: T.Ownership,
            iconOnly: Group,
            selected: true,
            dataCy: 'image-ownership',
            options: [
              {
                accessor: IMAGE_ACTIONS.CHANGE_OWNER,
                disabled: isDisabled(IMAGE_ACTIONS.CHANGE_OWNER),
                name: T.ChangeOwner,
                dialogProps: {
                  title: T.ChangeOwner,
                  subheader: SubHeader,
                  dataCy: `modal-${IMAGE_ACTIONS.CHANGE_OWNER}`,
                  validateOn: 'onSubmit',
                },
                form: ChangeUserForm,
                onSubmit: (rows) => async (newOwnership) => {
                  const ids = rows?.map?.(({ original }) => original?.ID)
                  await Promise.all(
                    ids.map((id) => changeOwnership({ id, ...newOwnership }))
                  )
                },
              },
              {
                accessor: IMAGE_ACTIONS.CHANGE_GROUP,
                disabled: isDisabled(IMAGE_ACTIONS.CHANGE_GROUP),
                name: T.ChangeGroup,
                dialogProps: {
                  title: T.ChangeGroup,
                  subheader: SubHeader,
                  dataCy: `modal-${IMAGE_ACTIONS.CHANGE_GROUP}`,
                  validateOn: 'onSubmit',
                },
                form: ChangeGroupForm,
                onSubmit: (rows) => async (newOwnership) => {
                  const ids = rows?.map?.(({ original }) => original?.ID)
                  await Promise.all(
                    ids.map((id) => changeOwnership({ id, ...newOwnership }))
                  )
                },
              },
            ],
          },
          {
            accessor: IMAGE_ACTIONS.DELETE,
            tooltip: T.Delete,
            iconOnly: Trash,
            selected: { min: 1 },
            dataCy: `image_${IMAGE_ACTIONS.DELETE}`,
            options: [
              {
                isConfirmDialog: true,
                dialogProps: {
                  title: T.Delete,
                  dataCy: `modal-${IMAGE_ACTIONS.DELETE}`,
                  children: MessageToConfirmAction,
                },
                onSubmit: (rows) => async () => {
                  const ids = rows?.map?.(({ original }) => original?.ID)
                  await Promise.all(ids.map((id) => deleteImage({ id })))
                  setSelectedRows && setSelectedRows([])
                },
              },
            ],
          },
        ],
      }),
    [view]
  )

  return backupActions
}

export default Actions
