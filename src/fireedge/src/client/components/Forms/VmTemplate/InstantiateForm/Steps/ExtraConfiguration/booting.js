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
import { SetStateAction } from 'react'
import PropTypes from 'prop-types'

import {
  NetworkAlt as NetworkIcon,
  BoxIso as ImageIcon,
  Check as CheckIcon,
  Square as BlankSquareIcon
} from 'iconoir-react'
import { Divider, makeStyles } from '@material-ui/core'
import { DragDropContext, Draggable, Droppable, DropResult } from 'react-beautiful-dnd'

import { Translate } from 'client/components/HOC'
import { Action } from 'client/components/Cards/SelectCard'
import { TAB_ID as STORAGE_ID } from 'client/components/Forms/VmTemplate/InstantiateForm/Steps/ExtraConfiguration/storage'
import { TAB_ID as NIC_ID } from 'client/components/Forms/VmTemplate/InstantiateForm/Steps/ExtraConfiguration/networking'
import { set } from 'client/utils'
import { T } from 'client/constants'

const useStyles = makeStyles(theme => ({
  container: {
    margin: '1em'
  },
  list: {
    padding: '1em'
  },
  item: {
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: '0.5em',
    padding: '1em',
    marginBottom: '1em',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5em',
    backgroundColor: theme.palette.background.default
  }
}))

/**
 * @param {string} id - Resource id: 'NIC<index>' or 'DISK<index>'
 * @param {Array} list - List of resources
 * @param {object} formData - Form data
 * @param {SetStateAction} setFormData - React set state action
 */
export const reorderBootAfterRemove = (id, list, formData, setFormData) => {
  const type = String(id).toLowerCase().replace(/\d+/g, '') // nic | disk
  const getIndexFromId = id => String(id).toLowerCase().replace(type, '')
  const idxToRemove = getIndexFromId(id)

  const ids = list
    .filter(resource => resource.NAME !== id)
    .map(resource => String(resource.NAME).toLowerCase())

  const newBootOrder = [...formData?.OS?.BOOT?.split(',').filter(Boolean)]
    .filter(bootId => !bootId.startsWith(type) || ids.includes(bootId))
    .map(bootId => {
      if (!bootId.startsWith(type)) return bootId

      const resourceId = getIndexFromId(bootId)

      return resourceId < idxToRemove
        ? bootId
        : `${type}${resourceId - 1}`
    })

  reorder(newBootOrder, setFormData)
}

/**
 * @param {string[]} newBootOrder - New boot order
 * @param {SetStateAction} setFormData - React set state action
 */
const reorder = (newBootOrder, setFormData) => {
  setFormData(prev => {
    const newData = set({ ...prev }, 'extra.OS.BOOT', newBootOrder.join(','))

    return { ...prev, extra: { ...prev.extra, OS: newData } }
  })
}

const Booting = ({ data, setFormData }) => {
  const classes = useStyles()
  const bootOrder = data?.OS?.BOOT?.split(',').filter(Boolean) ?? []

  const disks = data?.[STORAGE_ID]
    ?.map((disk, idx) => {
      const isVolatile = !disk?.IMAGE && !disk?.IMAGE_ID

      return {
        ID: `disk${idx}`,
        NAME: (
          <>
            <ImageIcon size={16} />
            {isVolatile
              ? <>{`${disk?.NAME}: `}<Translate word={T.VolatileDisk} /></>
              : [disk?.NAME, disk?.IMAGE].filter(Boolean).join(': ')}
          </>
        )
      }
    }) ?? []

  const nics = data?.[NIC_ID]
    ?.map((nic, idx) => ({
      ID: `nic${idx}`,
      NAME: (
        <>
          <NetworkIcon size={16} />
          {[nic?.NAME, nic.NETWORK].filter(Boolean).join(': ')}
        </>
      )
    })) ?? []

  const enabledItems = [...disks, ...nics]
    .filter(item => bootOrder.includes(item.ID))
    .sort((a, b) => bootOrder.indexOf(a.ID) - bootOrder.indexOf(b.ID))

  const restOfItems = [...disks, ...nics]
    .filter(item => !bootOrder.includes(item.ID))

  /** @param {DropResult} result - Drop result */
  const onDragEnd = result => {
    const { destination, source, draggableId } = result
    const newBootOrder = [...bootOrder]

    if (
      destination &&
      destination.index !== source.index &&
      newBootOrder.includes(draggableId)
    ) {
      newBootOrder.splice(source.index, 1) // remove current position
      newBootOrder.splice(destination.index, 0, draggableId) // set in new position

      reorder(newBootOrder, setFormData)
    }
  }

  const handleEnable = itemId => {
    const newBootOrder = [...bootOrder]
    const itemIndex = bootOrder.indexOf(itemId)

    itemIndex >= 0
      ? newBootOrder.splice(itemIndex, 1)
      : newBootOrder.push(itemId)

    reorder(newBootOrder, setFormData)
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className={classes.container}>
        <Droppable droppableId='booting'>
          {({ droppableProps, innerRef, placeholder }) => (
            <div
              {...droppableProps}
              ref={innerRef}
              className={classes.list}
            >
              {enabledItems.map(({ ID, NAME }, idx) => (
                <Draggable key={ID} draggableId={ID} index={idx}>
                  {({ draggableProps, dragHandleProps, innerRef }) => (
                    <div
                      {...draggableProps}
                      {...dragHandleProps}
                      ref={innerRef}
                      className={classes.item}
                    >
                      <Action
                        cy={ID}
                        icon={<CheckIcon size={15} />}
                        handleClick={() => handleEnable(ID)}
                      />
                      {NAME}
                    </div>
                  )}
                </Draggable>
              ))}
              {placeholder}
            </div>
          )}
        </Droppable>
        {restOfItems.length > 0 && <Divider />}
        {restOfItems.map(({ ID, NAME }) => (
          <div key={ID} className={classes.item}>
            <Action
              cy={ID}
              icon={<BlankSquareIcon size={15} />}
              handleClick={() => handleEnable(ID)}
            />
            {NAME}
          </div>
        ))}
      </div>
    </DragDropContext>
  )
}

Booting.propTypes = {
  data: PropTypes.any,
  setFormData: PropTypes.func
}

Booting.displayName = 'Booting'

export default Booting
