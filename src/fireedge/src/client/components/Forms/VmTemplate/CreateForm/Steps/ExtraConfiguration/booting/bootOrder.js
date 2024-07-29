/* ------------------------------------------------------------------------- *
 * Copyright 2002-2024, OpenNebula Project, OpenNebula Systems               *
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
import { useMemo, useState, JSXElementConstructor } from 'react'
import { useFormContext } from 'react-hook-form'

import { NetworkAlt as NetworkIcon, BoxIso as ImageIcon } from 'iconoir-react'
import { Stack, Checkbox, styled } from '@mui/material'
import {
  DragDropContext,
  Draggable,
  Droppable,
  DropResult,
} from 'react-beautiful-dnd'

import { Translate } from 'client/components/HOC'
import { STEP_ID as EXTRA_ID } from 'client/components/Forms/VmTemplate/CreateForm/Steps/ExtraConfiguration'
import { TAB_ID as OS_ID } from 'client/components/Forms/VmTemplate/CreateForm/Steps/ExtraConfiguration/booting'
import { TAB_ID as STORAGE_ID } from 'client/components/Forms/VmTemplate/CreateForm/Steps/ExtraConfiguration/storage'
import { TAB_ID as NIC_ID } from 'client/components/Forms/VmTemplate/CreateForm/Steps/ExtraConfiguration/networking'
import { T } from 'client/constants'

export const BOOT_ORDER_ID = 'BOOT'

/** @returns {string} Boot order path in form */
export const BOOT_ORDER_NAME = () => `${EXTRA_ID}.${OS_ID}.${BOOT_ORDER_ID}`

const BootItemDraggable = styled('div')(({ theme, disabled }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: '0.5em',
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: '0.5em',
  padding: '1em',
  backgroundColor: theme.palette.background.default,
  '&:before': {
    content: "''",
    display: 'block',
    width: 16,
    height: 10,
    background:
      !disabled &&
      `linear-gradient(
      to bottom,
      ${theme.palette.action.active} 4px,
      transparent 4px,
      transparent 6px,
      ${theme.palette.action.active} 6px
    )`,
  },
}))

/**
 * @param {string} id - Resource id: 'NIC<index>' or 'DISK<index>'
 * @param {Array} list - List of resources
 * @param {object} currentBootOrder - Current boot order
 * @returns {string} Updated boot order after remove
 */
export const reorderBootAfterRemove = (id, list, currentBootOrder) => {
  const type = String(id).toLowerCase().replace(/\d+/g, '') // nic | nic_alias | disk

  const getIndexFromId = (bootId) => `${bootId}`.toLowerCase().replace(type, '')

  const idxToRemove = getIndexFromId(id)

  const otherIds = list
    .filter((resource) => resource.NAME !== String(id))
    .map((resource) => String(resource.NAME).toLowerCase())

  const newBootOrder = [...currentBootOrder?.split(',').filter(Boolean)]
    .filter((bootId) => !bootId.startsWith(type) || otherIds.includes(bootId))
    .map((bootId) => {
      if (!bootId.startsWith(type)) return bootId

      const resourceId = getIndexFromId(bootId)

      return resourceId < idxToRemove ? bootId : `${type}${resourceId - 1}`
    })

  return newBootOrder.join(',')
}

/** @returns {JSXElementConstructor} Boot order component */
const BootOrder = () => {
  const { setValue, getValues } = useFormContext()
  const [bootOrder, setBootOrder] = useState(
    getValues(BOOT_ORDER_NAME())?.split(',')?.filter(Boolean) ?? []
  )

  const updateValues = (updatedBootOrder) => {
    setValue(BOOT_ORDER_NAME(), updatedBootOrder.join(','))
    setBootOrder(updatedBootOrder)
  }

  const disks = useMemo(
    () =>
      getValues(`${EXTRA_ID}.${STORAGE_ID}`)?.map((disk, idx) => {
        const isVolatile = !disk?.IMAGE && !disk?.IMAGE_ID

        return {
          ID: `disk${idx}`,
          NAME: (
            <>
              <ImageIcon />
              {isVolatile ? (
                <>
                  {`${disk?.NAME}: `}
                  <Translate word={T.VolatileDisk} />
                </>
              ) : (
                [disk?.NAME, disk?.IMAGE].filter(Boolean).join(': ')
              )}
            </>
          ),
        }
      }) ?? [],
    []
  )

  const nics = useMemo(() => {
    const nicId = `${EXTRA_ID}.${NIC_ID[0]}`
    const nicValues = getValues([nicId]).flat()

    return (
      nicValues?.map((nic, idx) => ({
        ID: `nic${idx}`,
        NAME: (
          <>
            <NetworkIcon />
            {[nic?.NAME, nic.NETWORK].filter(Boolean).join(': ')}
          </>
        ),
      })) ?? []
    )
  }, [])

  const enabledItems = [...disks, ...nics]
    .filter((item) => bootOrder.includes(item.ID))
    .sort((a, b) => bootOrder.indexOf(a.ID) - bootOrder.indexOf(b.ID))

  const restOfItems = [...disks, ...nics].filter(
    (item) => !bootOrder.includes(item.ID)
  )

  /** @param {DropResult} result - Drop result */
  const onDragEnd = async (result) => {
    const { destination, source, draggableId } = result
    const newBootOrder = [...bootOrder]

    if (
      destination &&
      destination.index !== source.index &&
      newBootOrder.includes(draggableId)
    ) {
      newBootOrder.splice(
        destination.index,
        0,
        newBootOrder.splice(source.index, 1)[0]
      )
      updateValues(newBootOrder)
    }
  }

  const handleEnable = (itemId) => {
    const newBootOrder = [...bootOrder]
    const itemIndex = bootOrder.indexOf(itemId)

    itemIndex >= 0
      ? newBootOrder.splice(itemIndex, 1)
      : newBootOrder.push(itemId)

    updateValues(newBootOrder)
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Stack gap="1em">
        <Droppable droppableId="booting">
          {({ droppableProps, innerRef, placeholder }) => (
            <Stack {...droppableProps} ref={innerRef} gap={1}>
              {[...enabledItems, ...restOfItems].map(({ ID, NAME }, idx) => {
                const disabled = !bootOrder.includes(ID)

                return (
                  <Draggable
                    key={ID}
                    isDragDisabled={disabled}
                    draggableId={ID}
                    index={idx}
                  >
                    {({
                      draggableProps,
                      dragHandleProps,
                      innerRef: dragRef,
                    }) => (
                      <BootItemDraggable
                        {...draggableProps}
                        {...dragHandleProps}
                        disabled={disabled}
                        ref={dragRef}
                      >
                        <Checkbox
                          checked={!disabled}
                          color="secondary"
                          data-cy={ID}
                          onChange={() => handleEnable(ID)}
                        />
                        {NAME}
                      </BootItemDraggable>
                    )}
                  </Draggable>
                )
              })}
              {placeholder}
            </Stack>
          )}
        </Droppable>
      </Stack>
    </DragDropContext>
  )
}

BootOrder.displayName = 'BootOrder'
export default BootOrder
