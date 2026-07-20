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
import { Box } from '@mui/material'
import { BoxIso, Db as DatastoreIcon, HardDrive } from 'iconoir-react'
import PropTypes from 'prop-types'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useFieldArray, useFormContext } from 'react-hook-form'

import {
  Button,
  CardBlock,
  CreateTypeDialog,
  EmptyContent,
  FormWithSchema,
  LabelSlot,
  Legend,
  MetadataSlot,
  ResourceActionConfirmation,
  TitleSlot,
} from '@ComponentsV2Module'

import { T, VM_ACTION_ENUM } from '@ConstantsModule'
import { useGeneralApi, useModalsApi } from '@FeaturesModule'
import { getDiskName } from '@ModelsModule'
import * as VirtualMachine from '@modules/resources/resources/VirtualMachine'
import {
  STEP_ID as EXTRA_ID,
  TabType,
} from '@modules/resources/resources/VmTemplate/Forms/CreateForm/Steps/ExtraConfiguration'
import {
  BOOT_ORDER_NAME,
  reorderBootAfterRemove,
} from '@modules/resources/resources/VmTemplate/Forms/CreateForm/Steps/ExtraConfiguration/booting'
import { mapNameByIndex } from '@modules/resources/resources/VmTemplate/Forms/CreateForm/Steps/ExtraConfiguration/schema'
import { FIELDS } from '@modules/resources/resources/VmTemplate/Forms/CreateForm/Steps/ExtraConfiguration/storage/schema'
import { CapacityDisksLabel } from '@modules/resources/resources/VmTemplate/Forms/Legend'
import {
  hasRestrictedAttributes,
  prettyBytes,
  stringToBoolean,
  xmlToJson,
  getImageType,
} from '@UtilsModule'

export const TAB_ID = 'DISK'

const mapNameFunction = mapNameByIndex('DISK')

const DISK_ACTIONS = {
  IMAGE: VM_ACTION_ENUM.ATTACH_DISK_IMAGE,
  VOLATILE: VM_ACTION_ENUM.ATTACH_DISK_VOLATILE,
}

const DISK_TYPE_OPTIONS = [
  {
    value: DISK_ACTIONS.VOLATILE,
    dataCy: 'vm-template-storage-volatile-disk',
    icon: HardDrive,
    title: T.Volatile,
    subtitle: T.VolatileDiskConcept,
  },
  {
    value: DISK_ACTIONS.IMAGE,
    dataCy: 'vm-template-storage-image-disk',
    icon: BoxIso,
    title: T.Image,
    subtitle: T.ImageDiskConcept,
  },
]

const diskFromFormData = (formData) => {
  const disk = formData?.template
    ? xmlToJson(formData.template)?.DISK
    : formData
  const imageType = getImageType({ TYPE: disk?.TYPE })

  return {
    ...disk,
    TYPE: imageType ?? disk?.TYPE,
  }
}

const formatValue = (value) =>
  value === undefined || value === null || value === '' ? '-' : String(value)
const formatSize = (value) => (+value ? prettyBytes(+value, 'MB') : '-')

const getSnapshotCount = (disk) =>
  [].concat(disk?.SNAPSHOTS)?.filter(Boolean)?.length ?? 0

const getDiskMetadata = (disk) => [
  [T.ID, formatValue(disk?.DISK_ID)],
  [T.Datastore, formatValue(disk?.DATASTORE)],
  [T.TargetDevice, formatValue(disk?.TARGET)],
  [T.Size, formatSize(disk?.SIZE)],
  [T.Monitoring, formatSize(disk?.MONITOR_SIZE)],
  [T.Context, stringToBoolean(disk?.IS_CONTEXT) ? T.Yes : T.No],
  [T.Snapshots, String(getSnapshotCount(disk))],
  [T.Serial, formatValue(disk?.SERIAL)],
]

const isImageDisk = (disk) => disk?.IMAGE || disk?.IMAGE_ID

const getDiskFormat = (disk) => {
  const format = String(disk?.FORMAT).toLowerCase()

  if (['raw', 'qcow2'].includes(format)) return format

  return isImageDisk(disk) ? formatValue(disk?.FORMAT) : 'raw'
}

const getDiskTitleTags = (disk) =>
  [
    formatValue(disk?.TYPE) !== '-' && [
      formatValue(disk?.TYPE),
      'miscellaneous2',
    ],
    getDiskFormat(disk) !== '-' && [getDiskFormat(disk), 'miscellaneous4'],
  ].filter(Boolean)

const getDiskTags = (disk) =>
  [
    stringToBoolean(disk?.PERSISTENT) && [T.Persistent, 'information'],
    stringToBoolean(disk?.READONLY) && [T.ReadOnly, 'information'],
    stringToBoolean(disk?.SAVE) && [T.Save, 'information'],
    stringToBoolean(disk?.CLONE) && [T.Clone, 'information'],
  ].filter(Boolean)

const getDiskCardName = (disk) => {
  if (isImageDisk(disk)) return getDiskName(disk)

  return formatSize(disk?.SIZE)
}

const DiskTitleSlot = ({ labels = [], title }) => (
  <Box
    sx={(theme) => ({
      alignItems: 'center',
      alignSelf: 'stretch',
      display: 'flex',
      flexWrap: 'wrap',
      gap: `${theme.scale[100]}px`,
      maxWidth: '100%',
    })}
  >
    <TitleSlot title={title} />
    {labels.length > 0 && <LabelSlot labels={labels} />}
  </Box>
)

DiskTitleSlot.propTypes = {
  labels: PropTypes.array,
  title: PropTypes.string,
}

const StorageDiskCard = ({ actions, disk }) => {
  const tags = getDiskTags(disk)
  const slots = [
    [
      DiskTitleSlot,
      {
        labels: getDiskTitleTags(disk),
        title: getDiskCardName(disk),
      },
    ],
    [MetadataSlot, { labels: getDiskMetadata(disk) }],
    tags.length > 0 && [LabelSlot, { labels: tags }],
  ].filter(Boolean)

  return (
    <CardBlock
      actions={actions}
      dataCy={`disk-${disk?.DISK_ID}`}
      isSelectable={false}
      slots={slots}
    />
  )
}

StorageDiskCard.propTypes = {
  actions: PropTypes.array,
  disk: PropTypes.object,
}

const AttachDiskTypeDialog = ({ onCancel, onSelect }) => (
  <CreateTypeDialog
    title={T.AttachDisk}
    subtitle={T.ChooseDiskType}
    options={DISK_TYPE_OPTIONS}
    onCancel={onCancel}
    onChange={onSelect}
  />
)

AttachDiskTypeDialog.propTypes = {
  onCancel: PropTypes.func,
  onSelect: PropTypes.func,
}

const Storage = ({ hypervisor, oneConfig, adminGroup, vmTemplate }) => {
  const [isAttachDiskTypeDialogOpen, setAttachDiskTypeDialogOpen] =
    useState(false)
  const {
    enqueueSuccess,
    setModifiedFields,
    setFieldPath,
    initModifiedFields,
  } = useGeneralApi()
  const { showModal } = useModalsApi()
  const { getValues, setValue } = useFormContext()

  const {
    fields: disks = [],
    append,
    update,
    replace,
  } = useFieldArray({
    name: `${EXTRA_ID}.${TAB_ID}`,
  })

  useEffect(() => {
    setFieldPath(`extra.Storage`)
    initModifiedFields([...disks.map(() => ({}))])
  }, [])

  const totalFieldsCount = useMemo(() => disks?.length, [disks])

  const cardDisks = useMemo(
    () =>
      disks?.map(({ id, ...disk }, index) => ({
        ...disk,
        id,
        DISK_ID: index,
      })) ?? [],
    [disks]
  )

  const handleFieldPathChange = useCallback(() => {
    setModifiedFields({}, { batch: false })
  }, [setModifiedFields])

  const getFormConfig = useCallback(
    (disk, selectDiskId) => ({
      stepProps: { hypervisor, oneConfig, adminGroup, selectDiskId },
      initialValues: disk,
    }),
    [adminGroup, hypervisor, oneConfig]
  )

  const getDiskSteps = useCallback(
    (action) =>
      action === DISK_ACTIONS.VOLATILE
        ? VirtualMachine.Forms.VolatileSteps
        : VirtualMachine.Forms.ImageSteps,
    []
  )

  const getEditDiskAction = (disk) =>
    !disk?.IMAGE && !disk?.IMAGE_ID ? DISK_ACTIONS.VOLATILE : DISK_ACTIONS.IMAGE

  const notifyDiskSuccess = useCallback(
    (message, fallbackMessage, disk) => {
      const diskName = getDiskCardName(disk)

      setTimeout(
        () => enqueueSuccess(message ?? fallbackMessage, [diskName]),
        0
      )
    },
    [enqueueSuccess]
  )

  // Delay execution until next event loop tick to ensure state updates
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setFieldPath(`extra.Storage.${totalFieldsCount}`)
    }, 0)

    return () => clearTimeout(timeoutId)
  }, [totalFieldsCount])

  const handleAppend = useCallback(
    (newDisk) => {
      const disk = mapNameFunction(diskFromFormData(newDisk), disks.length)

      append(disk)
      notifyDiskSuccess(
        T.SuccessVMTemplateDiskAttached,
        'Disk attached successfully - %s',
        disk
      )
    },
    [append, disks.length, notifyDiskSuccess]
  )

  const handleUpdate = useCallback(
    (updatedDisk, index) => {
      const disk = mapNameFunction(diskFromFormData(updatedDisk), index)

      update(index, disk)
      setFieldPath(`extra.Storage.${totalFieldsCount}`)
      notifyDiskSuccess(
        T.SuccessVMTemplateDiskUpdated,
        'Disk updated successfully - %s',
        disk
      )
    },
    [notifyDiskSuccess, setFieldPath, totalFieldsCount, update]
  )

  const removeAndReorder = useCallback(
    (disk) => {
      setFieldPath(`extra.Storage.${disk?.DISK_ID}`)
      setModifiedFields({ __flag__: 'DELETE' })

      const updatedDisks = disks
        .filter(({ id }) => id !== disk?.id)
        .map(mapNameFunction)
      const currentBootOrder = getValues(BOOT_ORDER_NAME())
      const updatedBootOrder = reorderBootAfterRemove(
        disk?.NAME,
        disks,
        currentBootOrder
      )

      replace(updatedDisks)
      setValue(BOOT_ORDER_NAME(), updatedBootOrder)
      setFieldPath(`extra.OsCpu`)
      setModifiedFields({ OS: { BOOT: true } })
      notifyDiskSuccess(
        T.SuccessVMTemplateDiskDetached,
        'Disk detached successfully - %s',
        disk
      )
    },
    [
      disks,
      getValues,
      notifyDiskSuccess,
      replace,
      setFieldPath,
      setModifiedFields,
      setValue,
    ]
  )

  const openAttachDiskForm = useCallback(
    (action) => {
      const title = T[action]
      const { stepProps, initialValues } = getFormConfig(
        undefined,
        disks.length
      )

      showModal({
        id: `vm-template-storage-${action}`,
        isFormDialog: true,
        name: title,
        dialogProps: {
          title,
          dataCy: `modal-${action}`,
          steps: getDiskSteps(action),
          stepProps,
          initialValues,
        },
        onSubmit: (newDisk) => {
          handleFieldPathChange()

          return handleAppend(newDisk)
        },
      })
    },
    [
      disks.length,
      getDiskSteps,
      getFormConfig,
      handleAppend,
      handleFieldPathChange,
      showModal,
    ]
  )

  const openEditDiskForm = useCallback(
    (disk) => {
      const diskName = getDiskName(disk)
      const title = `${T.Edit}: ${diskName}`
      const action = getEditDiskAction(disk)
      const { stepProps, initialValues } = getFormConfig(disk, disk?.DISK_ID)

      showModal({
        id: `vm-template-storage-edit-disk-${disk?.DISK_ID}`,
        isFormDialog: true,
        name: title,
        dialogProps: {
          title,
          dataCy: 'modal-edit-disk',
          steps: getDiskSteps(action),
          stepProps,
          initialValues,
          update: true,
        },
        onSubmit: (updatedDisk) => {
          handleFieldPathChange()

          return handleUpdate(updatedDisk, disk?.DISK_ID)
        },
      })
    },
    [
      getDiskSteps,
      getFormConfig,
      handleFieldPathChange,
      handleUpdate,
      showModal,
    ]
  )

  const openDetachDiskConfirm = useCallback(
    (disk) => {
      const diskName = getDiskName(disk)

      showModal({
        id: `vm-template-storage-detach-disk-${disk?.DISK_ID}`,
        isConfirmDialog: true,
        dialogProps: {
          title: `${T.DetachSomething} #${disk?.DISK_ID} - ${diskName}`,
          dataCy: 'modal-detach-disk',
          description: (
            <ResourceActionConfirmation
              description={T['resource.detach.confirmation']}
              resources={{ ID: disk?.DISK_ID, NAME: diskName }}
              resourceType={T.Disk}
            />
          ),
          confirmLabel: T.Detach,
          confirmButtonProps: {
            isDestructive: true,
          },
        },
        onSubmit: () => removeAndReorder(disk),
      })
    },
    [removeAndReorder, showModal]
  )

  const getDiskActions = useCallback(
    (disk) => {
      const disableDetach =
        !adminGroup &&
        hasRestrictedAttributes(disk, 'DISK', oneConfig?.VM_RESTRICTED_ATTR)

      return [
        {
          title: T.Edit,
          tooltip: T.Edit,
          dataCy: `disk-edit-${disk?.DISK_ID}`,
          onClick: () => openEditDiskForm(disk),
        },
        {
          title: T[VM_ACTION_ENUM.DETACH_DISK],
          dataCy: `disk-detach-${disk?.DISK_ID}`,
          tooltip: disableDetach
            ? T.DetachRestricted
            : T[VM_ACTION_ENUM.DETACH_DISK],
          isDisabled: disableDetach,
          onClick: () => openDetachDiskConfirm(disk),
        },
      ]
    },
    [
      adminGroup,
      oneConfig?.VM_RESTRICTED_ATTR,
      openDetachDiskConfirm,
      openEditDiskForm,
    ]
  )

  const openAttachDiskTypeDialog = useCallback(
    () => setAttachDiskTypeDialogOpen(true),
    []
  )

  const closeAttachDiskTypeDialog = useCallback(
    () => setAttachDiskTypeDialogOpen(false),
    []
  )

  const handleSelectDiskType = useCallback(
    (action) => {
      closeAttachDiskTypeDialog()
      openAttachDiskForm(action)
    },
    [closeAttachDiskTypeDialog, openAttachDiskForm]
  )

  return (
    <div>
      <FormWithSchema
        cy={`${EXTRA_ID}-storage-options`}
        fields={FIELDS}
        legend={T.StorageOptions}
        id={EXTRA_ID}
        rootProps={{
          sx: {
            border: 0,
            m: 0,
            minWidth: 0,
            minInlineSize: 0,
            p: 0,
            width: '100%',
          },
        }}
        columns={[FIELDS]}
      />
      {vmTemplate && <CapacityDisksLabel data={vmTemplate} />}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1em',
          mt: '1em',
          width: '100%',
        }}
      >
        <Legend title={T.Disks} />
        <Button
          data-cy="vm-template-storage-attach-disk"
          type="secondary"
          onClick={openAttachDiskTypeDialog}
        >
          {T.AttachDisk}
        </Button>
      </Box>
      {isAttachDiskTypeDialogOpen && (
        <AttachDiskTypeDialog
          onCancel={closeAttachDiskTypeDialog}
          onSelect={handleSelectDiskType}
        />
      )}
      <Box sx={{ mt: '1em' }}>
        {cardDisks.length ? (
          <Box
            sx={{
              display: 'grid',
              gap: '1em',
              gridTemplateColumns: {
                xs: '1fr',
                md: 'repeat(2, minmax(0, 1fr))',
              },
            }}
          >
            {cardDisks.map((disk) => (
              <StorageDiskCard
                actions={getDiskActions(disk)}
                key={disk?.id ?? `${disk?.NAME}-${disk?.DISK_ID}`}
                disk={disk}
              />
            ))}
          </Box>
        ) : (
          <EmptyContent
            subtitle={T.AttachedDisksWillAppearHere}
            title={T.NoDisks}
          />
        )}
      </Box>
    </div>
  )
}

Storage.propTypes = {
  data: PropTypes.any,
  setFormData: PropTypes.func,
  hypervisor: PropTypes.string,
  control: PropTypes.object,
  oneConfig: PropTypes.object,
  adminGroup: PropTypes.bool,
  vmTemplate: PropTypes.any,
}

/** @type {TabType} */
const TAB = {
  id: 'storage',
  name: T.Storage,
  icon: DatastoreIcon,
  Content: Storage,
  getError: (error) => !!error?.[TAB_ID],
}

export default TAB
