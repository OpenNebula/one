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
import { useMemo, SetStateAction } from 'react'
import PropTypes from 'prop-types'

import {
  NetworkAlt as NetworkIcon,
  BoxIso as ImageIcon,
  Check as CheckIcon,
  Square as BlankSquareIcon
} from 'iconoir-react'
import { Divider, makeStyles } from '@material-ui/core'
import { DragDropContext, Draggable, Droppable, DropResult } from 'react-beautiful-dnd'
import { useFormContext } from 'react-hook-form'

import { Translate } from 'client/components/HOC'
import { Action } from 'client/components/Cards/SelectCard'
import { STEP_ID as TEMPLATE_ID } from 'client/components/Forms/VmTemplate/InstantiateForm/Steps/VmTemplatesTable'
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
 * @param {string[]} newBootOrder - New boot order
 * @param {SetStateAction} setFormData - New boot order
 */
export const reorder = (newBootOrder, setFormData) => {
  setFormData(prev => {
    const newData = set({ ...prev }, 'extra.OS.BOOT', newBootOrder.join(','))

    return { ...prev, extra: { ...prev.extra, OS: newData } }
  })
}

const Booting = ({ data, setFormData }) => {
  const classes = useStyles()
  const { watch } = useFormContext()
  const bootOrder = data?.OS?.BOOT?.split(',').filter(Boolean) ?? []

  const disks = useMemo(() => {
    const templateSeleted = watch(`${TEMPLATE_ID}[0]`)
    const listOfDisks = [templateSeleted?.TEMPLATE?.DISK ?? []].flat()

    return listOfDisks?.map(disk => {
      const { DISK_ID, IMAGE, IMAGE_ID } = disk
      const isVolatile = !IMAGE && !IMAGE_ID

      const name = isVolatile
        ? <>`DISK ${DISK_ID}: `<Translate word={T.VolatileDisk} /></>
        : `DISK ${DISK_ID}: ${IMAGE}`

      return {
        ID: `disk${DISK_ID}`,
        NAME: (
          <>
            <ImageIcon size={16} />
            {name}
          </>
        )
      }
    })
  }, [])

  const nics = data?.[NIC_ID]
    ?.map((nic, idx) => ({ ...nic, NAME: nic?.NAME ?? `NIC${idx}` }))
    ?.map((nic, idx) => ({
      ID: `nic${idx}`,
      NAME: (
        <>
          <NetworkIcon size={16} />
          {[nic?.NAME ?? `NIC${idx}`, nic.NETWORK].filter(Boolean).join(': ')}
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
