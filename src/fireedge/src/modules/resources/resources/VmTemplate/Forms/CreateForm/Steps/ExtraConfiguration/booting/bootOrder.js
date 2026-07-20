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
import { useEffect, useMemo, useState, JSXElementConstructor } from 'react'
import { useFormContext } from 'react-hook-form'

import {
  NetworkAlt as NetworkIcon,
  BoxIso as ImageIcon,
  Drag as DragIcon,
} from 'iconoir-react'
import { Box } from '@mui/material'
import {
  DragDropContext,
  Draggable,
  Droppable,
  DropResult,
} from 'react-beautiful-dnd'

import { useTranslation } from '@ProvidersModule'
import { Checkbox, Text } from '@ComponentsV2Module'
import { STEP_ID as EXTRA_ID } from '@modules/resources/resources/VmTemplate/Forms/CreateForm/Steps/ExtraConfiguration'
import { TAB_ID as OS_ID } from '@modules/resources/resources/VmTemplate/Forms/CreateForm/Steps/ExtraConfiguration/booting'
import { TAB_ID as STORAGE_ID } from '@modules/resources/resources/VmTemplate/Forms/CreateForm/Steps/ExtraConfiguration/storage'
import { TAB_ID as NIC_ID } from '@modules/resources/resources/VmTemplate/Forms/CreateForm/Steps/ExtraConfiguration/networking'
import { T, TEXT_VARIANTS, TEXT_WEIGHTS } from '@ConstantsModule'
import { getBootOrderStyles } from '@modules/resources/resources/VmTemplate/Forms/CreateForm/Steps/ExtraConfiguration/booting/styles'

export const BOOT_ORDER_ID = 'BOOT'

/** @returns {string} Boot order path in form */
export const BOOT_ORDER_NAME = () => `${EXTRA_ID}.${OS_ID}.${BOOT_ORDER_ID}`

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
  const { translate } = useTranslation()
  const [bootOrder, setBootOrder] = useState(
    getValues(BOOT_ORDER_NAME())?.split(',')?.filter(Boolean) ?? []
  )

  const updateValues = (updatedBootOrder) => {
    setValue(BOOT_ORDER_NAME(), updatedBootOrder.join(','), {
      shouldDirty: true,
    })
    setBootOrder(updatedBootOrder)
  }

  const disks = useMemo(
    () =>
      getValues(`${EXTRA_ID}.${STORAGE_ID}`)?.map((disk, idx) => {
        const isVolatile = !disk?.IMAGE && !disk?.IMAGE_ID
        const id = disk?.DISK_ID ?? disk?.NAME?.match(/\d+/g)?.pop() ?? idx
        const diskId = `disk${id}`

        return {
          ID: diskId,
          ICON: ImageIcon,
          NAME: isVolatile
            ? `DISK${idx}: ${translate(T.VolatileDisk)}`
            : [`DISK${idx}`, disk?.IMAGE].filter(Boolean).join(': '),
        }
      }) ?? [],
    [getValues, translate]
  )

  const nics = useMemo(() => {
    const nicId = `${EXTRA_ID}.${NIC_ID[0]}`
    const nicValues = getValues([nicId])
      .flat()
      .filter((nic) => !!nic) // Strips internal undefined

    return (
      nicValues?.map((nic, idx) => ({
        ID: `nic${idx}`,
        ICON: NetworkIcon,
        NAME: [nic?.NAME, nic?.NETWORK].filter(Boolean).join(': '),
      })) ?? []
    )
  }, [getValues])

  const resources = useMemo(() => [...disks, ...nics], [disks, nics])
  const resourceIds = useMemo(() => resources.map(({ ID }) => ID), [resources])
  const resourcesById = useMemo(
    () => new Map(resources.map((resource) => [resource.ID, resource])),
    [resources]
  )
  const [itemOrder, setItemOrder] = useState(() => {
    const availableIds = new Set(resourceIds)

    return [
      ...bootOrder.filter((id) => availableIds.has(id)),
      ...resourceIds.filter((id) => !bootOrder.includes(id)),
    ]
  })

  useEffect(() => {
    setItemOrder((currentOrder) => {
      const currentIds = currentOrder.filter((id) => resourceIds.includes(id))
      const addedIds = resourceIds.filter((id) => !currentIds.includes(id))

      return [...currentIds, ...addedIds]
    })
  }, [resourceIds])

  const orderedItems = itemOrder
    .map((id) => resourcesById.get(id))
    .filter(Boolean)

  /** @param {DropResult} result - Drop result */
  const onDragEnd = ({ destination, source, draggableId }) => {
    if (!destination || destination.index === source.index) return

    const newItemOrder = [...itemOrder]
    const sourceIndex = newItemOrder.indexOf(draggableId)

    if (sourceIndex < 0) return

    const [movedItem] = newItemOrder.splice(sourceIndex, 1)
    const destinationIndex = Math.min(destination.index, newItemOrder.length)

    newItemOrder.splice(destinationIndex, 0, movedItem)
    setItemOrder(newItemOrder)

    const selectedItems = new Set(bootOrder)
    const newBootOrder = newItemOrder.filter((id) => selectedItems.has(id))

    if (newBootOrder.join(',') !== bootOrder.join(',')) {
      updateValues(newBootOrder)
    }
  }

  const handleEnable = (itemId) => {
    const selectedItems = new Set(bootOrder)

    selectedItems.has(itemId)
      ? selectedItems.delete(itemId)
      : selectedItems.add(itemId)

    updateValues(itemOrder.filter((id) => selectedItems.has(id)))
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Box sx={(theme) => getBootOrderStyles({ theme })}>
        <Droppable droppableId="booting">
          {({ droppableProps, innerRef, placeholder }) => (
            <div
              {...droppableProps}
              ref={innerRef}
              className="boot-order-droppable"
            >
              {orderedItems.map(({ ID, ICON: ResourceIcon, NAME }, idx) => {
                const isSelected = bootOrder.includes(ID)

                return (
                  <Draggable key={ID} draggableId={ID} index={idx}>
                    {(
                      { draggableProps, dragHandleProps, innerRef: dragRef },
                      { isDragging }
                    ) => (
                      <div
                        {...draggableProps}
                        {...dragHandleProps}
                        ref={dragRef}
                        data-cy={ID}
                        className={
                          'boot-order-item ' +
                          (isSelected
                            ? 'boot-order-item-selected'
                            : 'boot-order-item-unselected') +
                          (isDragging ? ' boot-order-item-dragging' : '')
                        }
                      >
                        <Box
                          className="boot-order-drag-handle"
                          aria-hidden="true"
                        >
                          <DragIcon />
                        </Box>
                        <Checkbox
                          className="boot-order-checkbox"
                          checked={isSelected}
                          inputProps={{ 'aria-label': NAME }}
                          onChange={() => handleEnable(ID)}
                        />
                        <Box className="boot-order-resource">
                          <ResourceIcon className="boot-order-resource-icon" />
                          <Text
                            className="boot-order-resource-name"
                            value={NAME}
                            variant={TEXT_VARIANTS.BODY_SMALL}
                            weight={TEXT_WEIGHTS.MEDIUM}
                          />
                        </Box>
                      </div>
                    )}
                  </Draggable>
                )
              })}
              {placeholder}
            </div>
          )}
        </Droppable>
      </Box>
    </DragDropContext>
  )
}

BootOrder.displayName = 'BootOrder'
export default BootOrder
