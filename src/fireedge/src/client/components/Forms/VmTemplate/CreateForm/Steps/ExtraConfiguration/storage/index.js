/* ------------------------------------------------------------------------- *
 * Copyright 2002-2021, OpenNebula Project, OpenNebula Systems               *
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
import { Stack } from '@mui/material'
import { Db as DatastoreIcon } from 'iconoir-react'
import { useFieldArray, useFormContext } from 'react-hook-form'

import ButtonToTriggerForm from 'client/components/Forms/ButtonToTriggerForm'
import { ImageSteps, VolatileSteps } from 'client/components/Forms/Vm'
import { FormWithSchema } from 'client/components/Forms'

import {
  STEP_ID as EXTRA_ID,
  TabType,
} from 'client/components/Forms/VmTemplate/CreateForm/Steps/ExtraConfiguration'
import { mapNameByIndex } from 'client/components/Forms/VmTemplate/CreateForm/Steps/ExtraConfiguration/schema'
import {
  BOOT_ORDER_NAME,
  reorderBootAfterRemove,
} from 'client/components/Forms/VmTemplate/CreateForm/Steps/ExtraConfiguration/booting'
import { FIELDS } from 'client/components/Forms/VmTemplate/CreateForm/Steps/ExtraConfiguration/storage/schema'
import { T } from 'client/constants'
import DiskItem from './DiskItem'

export const TAB_ID = 'DISK'

const mapNameFunction = mapNameByIndex('DISK')

const Storage = ({ hypervisor }) => {
  const { getValues, setValue } = useFormContext()
  const {
    fields: disks,
    append,
    update,
    replace,
  } = useFieldArray({
    name: `${EXTRA_ID}.${TAB_ID}`,
  })

  const removeAndReorder = (diskName) => {
    const updatedDisks = disks
      .filter(({ NAME }) => NAME !== diskName)
      .map(mapNameFunction)
    const currentBootOrder = getValues(BOOT_ORDER_NAME())
    const updatedBootOrder = reorderBootAfterRemove(
      diskName,
      disks,
      currentBootOrder
    )

    replace(updatedDisks)
    setValue(BOOT_ORDER_NAME(), updatedBootOrder)
  }

  const handleUpdate = (updatedDisk, index) => {
    update(index, mapNameFunction(updatedDisk, index))
  }

  return (
    <>
      <ButtonToTriggerForm
        buttonProps={{
          color: 'secondary',
          'data-cy': 'add-disk',
          label: T.AttachDisk,
          variant: 'outlined',
        }}
        options={[
          {
            cy: 'attach-image-disk',
            name: T.Image,
            dialogProps: { title: T.AttachImage },
            form: () => ImageSteps({ hypervisor }),
            onSubmit: (image) => append(mapNameFunction(image, disks.length)),
          },
          {
            cy: 'attach-volatile-disk',
            name: T.Volatile,
            dialogProps: { title: T.AttachVolatile },
            form: () => VolatileSteps({ hypervisor }),
            onSubmit: (image) => append(mapNameFunction(image, disks.length)),
          },
        ]}
      />
      <Stack
        pb="1em"
        display="grid"
        gap="1em"
        mt="1em"
        sx={{
          gridTemplateColumns: {
            sm: '1fr',
            md: 'repeat(auto-fit, minmax(300px, 0.5fr))',
          },
        }}
      >
        {disks?.map(({ id, ...item }, index) => (
          <DiskItem
            key={id ?? item?.NAME}
            item={item}
            handleRemove={() => removeAndReorder(item?.NAME)}
            handleUpdate={(updatedDisk) => handleUpdate(updatedDisk, index)}
          />
        ))}
      </Stack>
      <FormWithSchema
        cy={`create-vm-template-${EXTRA_ID}.storage-options`}
        fields={FIELDS}
        legend={T.StorageOptions}
        id={EXTRA_ID}
      />
    </>
  )
}

Storage.propTypes = {
  data: PropTypes.any,
  setFormData: PropTypes.func,
  hypervisor: PropTypes.string,
  control: PropTypes.object,
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
