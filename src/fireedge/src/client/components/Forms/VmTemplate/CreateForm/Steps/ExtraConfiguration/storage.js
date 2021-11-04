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
/* eslint-disable jsdoc/require-jsdoc */
import PropTypes from 'prop-types'
import { Stack } from '@mui/material'
import { Db as DatastoreIcon, Edit, Trash } from 'iconoir-react'
import { useFormContext, useFieldArray } from 'react-hook-form'

import ButtonToTriggerForm from 'client/components/Forms/ButtonToTriggerForm'
import SelectCard, { Action } from 'client/components/Cards/SelectCard'
import { ImageSteps, VolatileSteps } from 'client/components/Forms/Vm'
import { StatusCircle, StatusChip } from 'client/components/Status'
import { Translate } from 'client/components/HOC'

import { STEP_ID as EXTRA_ID, TabType } from 'client/components/Forms/VmTemplate/CreateForm/Steps/ExtraConfiguration'
import { mapNameByIndex } from 'client/components/Forms/VmTemplate/CreateForm/Steps/ExtraConfiguration/schema'
import { BOOT_ORDER_NAME, reorderBootAfterRemove } from 'client/components/Forms/VmTemplate/CreateForm/Steps/ExtraConfiguration/booting'
import { getState, getDiskType } from 'client/models/Image'
import { stringToBoolean } from 'client/models/Helper'
import { prettyBytes } from 'client/utils'
import { T } from 'client/constants'

export const TAB_ID = 'DISK'

const mapNameFunction = mapNameByIndex('DISK')

const Storage = ({ hypervisor }) => {
  const { getValues, setValue } = useFormContext()
  const { fields: disks, replace, update, append } = useFieldArray({
    name: `${EXTRA_ID}.${TAB_ID}`
  })

  const removeAndReorder = diskName => {
    const updatedDisks = disks.filter(({ NAME }) => NAME !== diskName).map(mapNameFunction)
    const currentBootOrder = getValues(BOOT_ORDER_NAME())
    const updatedBootOrder = reorderBootAfterRemove(diskName, disks, currentBootOrder)

    replace(updatedDisks)
    setValue(BOOT_ORDER_NAME(), updatedBootOrder)
  }

  return (
    <>
      <ButtonToTriggerForm
        buttonProps={{
          color: 'secondary',
          'data-cy': 'add-disk',
          label: T.AttachDisk,
          variant: 'outlined'
        }}
        options={[
          {
            cy: 'attach-image-disk',
            name: T.Image,
            dialogProps: { title: T.AttachImage },
            form: () => ImageSteps({ hypervisor }),
            onSubmit: image => append(mapNameFunction(image, disks.length))
          },
          {
            cy: 'attach-volatile-disk',
            name: T.Volatile,
            dialogProps: { title: T.AttachVolatile },
            form: () => VolatileSteps({ hypervisor }),
            onSubmit: image => append(mapNameFunction(image, disks.length))
          }
        ]}
      />
      <Stack
        pb='1em'
        display='grid'
        gridTemplateColumns='repeat(auto-fit, minmax(300px, 0.5fr))'
        gap='1em'
        mt='1em'
      >
        {disks?.map((item, index) => {
          const {
            id,
            NAME,
            TYPE,
            IMAGE,
            IMAGE_ID,
            IMAGE_STATE,
            ORIGINAL_SIZE,
            SIZE = ORIGINAL_SIZE,
            READONLY,
            DATASTORE,
            PERSISTENT
          } = item

          const isVolatile = !IMAGE && !IMAGE_ID
          const isPersistent = stringToBoolean(PERSISTENT)
          const state = !isVolatile && getState({ STATE: IMAGE_STATE })
          const type = isVolatile ? TYPE : getDiskType(item)
          const originalSize = +ORIGINAL_SIZE ? prettyBytes(+ORIGINAL_SIZE, 'MB') : '-'
          const size = prettyBytes(+SIZE, 'MB')

          return (
            <SelectCard
              key={id ?? NAME}
              title={isVolatile ? (
                <>
                  {`${NAME} - `}
                  <Translate word={T.VolatileDisk} />
                </>
              ) : (
                <Stack component='span' alignItems='center' gap='0.5em'>
                  <StatusCircle color={state?.color} tooltip={state?.name} />
                  {`${NAME}: ${IMAGE}`}
                  {isPersistent && <StatusChip text='PERSISTENT' />}
                </Stack>
              )}
              subheader={<>
                {Object
                  .entries({
                    [DATASTORE]: DATASTORE,
                    READONLY: stringToBoolean(READONLY),
                    PERSISTENT: stringToBoolean(PERSISTENT),
                    [isVolatile || ORIGINAL_SIZE === SIZE
                      ? size : `${originalSize}/${size}`]: true,
                    [type]: type
                  })
                  .map(([k, v]) => v ? `${k}` : '')
                  .filter(Boolean)
                  .join(' | ')
                }
              </>}
              action={
                <>
                  <Action
                    data-cy={`remove-${NAME}`}
                    tooltip={<Translate word={T.Remove} />}
                    handleClick={() => removeAndReorder(NAME, index)}
                    icon={<Trash />}
                  />
                  <ButtonToTriggerForm
                    buttonProps={{
                      'data-cy': `edit-${NAME}`,
                      icon: <Edit />,
                      tooltip: <Translate word={T.Edit} />
                    }}
                    options={[{
                      dialogProps: {
                        title: <Translate word={T.EditSomething} values={[NAME]} />
                      },
                      form: () => isVolatile
                        ? VolatileSteps({ hypervisor }, item)
                        : ImageSteps({ hypervisor }, item),
                      onSubmit: updatedDisk =>
                        update(index, mapNameFunction(updatedDisk, index))
                    }]}
                  />
                </>
              }
            />
          )
        })}
      </Stack>
    </>
  )
}

Storage.propTypes = {
  data: PropTypes.any,
  setFormData: PropTypes.func,
  hypervisor: PropTypes.string,
  control: PropTypes.object
}

/** @type {TabType} */
const TAB = {
  id: 'storage',
  name: T.Storage,
  icon: DatastoreIcon,
  Content: Storage,
  getError: error => !!error?.[TAB_ID]
}

export default TAB
