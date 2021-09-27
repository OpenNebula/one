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
import { useMemo } from 'react'
import PropTypes from 'prop-types'
import { useFormContext } from 'react-hook-form'
import { makeStyles } from '@material-ui/core'
import { Edit, Trash } from 'iconoir-react'

import { useListForm } from 'client/hooks'
import ButtonToTriggerForm from 'client/components/Forms/ButtonToTriggerForm'
import SelectCard, { Action } from 'client/components/Cards/SelectCard'
import { ImageSteps, VolatileSteps } from 'client/components/Forms/Vm'
import { StatusCircle, StatusChip } from 'client/components/Status'
import { Tr, Translate } from 'client/components/HOC'

import { STEP_ID as TEMPLATE_ID } from 'client/components/Forms/VmTemplate/InstantiateForm/Steps/VmTemplatesTable'
import { STEP_ID as EXTRA_ID } from 'client/components/Forms/VmTemplate/InstantiateForm/Steps/ExtraConfiguration'
import { SCHEMA as EXTRA_SCHEMA } from 'client/components/Forms/VmTemplate/InstantiateForm/Steps/ExtraConfiguration/schema'
import { reorderBootAfterRemove } from 'client/components/Forms/VmTemplate/InstantiateForm/Steps/ExtraConfiguration/booting'
import { getState, getDiskType } from 'client/models/Image'
import { stringToBoolean } from 'client/models/Helper'
import { prettyBytes } from 'client/utils'
import { T } from 'client/constants'

const useStyles = makeStyles({
  root: {
    paddingBlock: '1em',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, auto))',
    gap: '1em'
  }
})

export const TAB_ID = 'DISK'

const Storage = ({ data, setFormData }) => {
  const classes = useStyles()
  const { watch } = useFormContext()
  const { HYPERVISOR } = useMemo(() => watch(`${TEMPLATE_ID}[0]`) ?? {}, [])
  const disks = data?.[TAB_ID]

  const { handleSetList, handleRemove, handleSave } = useListForm({
    parent: EXTRA_ID,
    key: TAB_ID,
    list: disks,
    setList: setFormData,
    getItemId: item => item.NAME,
    addItemId: (item, _, itemIndex) => ({ ...item, NAME: `${TAB_ID}${itemIndex}` })
  })

  const reorderDisks = () => {
    const diskSchema = EXTRA_SCHEMA.pick([TAB_ID])
    const { [TAB_ID]: newList } = diskSchema.cast({ [TAB_ID]: data?.[TAB_ID] })

    handleSetList(newList)
  }

  return (
    <>
      <ButtonToTriggerForm
        buttonProps={{
          color: 'secondary',
          'data-cy': 'add-disk',
          label: Tr(T.AttachDisk)
        }}
        options={[
          {
            cy: 'attach-image-disk',
            name: T.Image,
            dialogProps: { title: T.AttachImage },
            form: () => ImageSteps({ hypervisor: HYPERVISOR }),
            onSubmit: handleSave
          },
          {
            cy: 'attach-volatile-disk',
            name: T.Volatile,
            dialogProps: { title: T.AttachVolatile },
            form: () => VolatileSteps({ hypervisor: HYPERVISOR }),
            onSubmit: handleSave
          }
        ]}
      />
      <div className={classes.root}>
        {disks?.map(item => {
          const {
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
              key={NAME}
              title={isVolatile ? (
                <>
                  {`${NAME} - `}
                  <Translate word={T.VolatileDisk} />
                </>
              ) : (
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5em' }}>
                  <StatusCircle color={state?.color} tooltip={state?.name} />
                  {`${NAME}: ${IMAGE}`}
                  {isPersistent && <StatusChip text='PERSISTENT' />}
                </span>
              )}
              subheader={<>
                {Object
                  .entries({
                    [DATASTORE]: DATASTORE,
                    READONLY: stringToBoolean(READONLY),
                    PERSISTENT: stringToBoolean(PERSISTENT),
                    [isVolatile || ORIGINAL_SIZE === SIZE ? size : `${originalSize}/${size}`]: true,
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
                    handleClick={() => {
                      handleRemove(NAME)
                      reorderDisks()
                      reorderBootAfterRemove(NAME, disks, data, setFormData)
                    }}
                    icon={<Trash size={18} />}
                  />
                  <ButtonToTriggerForm
                    buttonProps={{
                      'data-cy': `edit-${NAME}`,
                      icon: <Edit size={18} />,
                      tooltip: <Translate word={T.Edit} />
                    }}
                    options={[{
                      dialogProps: {
                        title: <Translate word={T.EditSomething} values={[NAME]} />
                      },
                      form: () => isVolatile
                        ? VolatileSteps({ hypervisor: HYPERVISOR }, item)
                        : ImageSteps({ hypervisor: HYPERVISOR }, item),
                      onSubmit: newValues => handleSave(newValues, NAME)
                    }]}
                  />
                </>
              }
            />
          )
        })}
      </div>
    </>
  )
}

Storage.propTypes = {
  data: PropTypes.any,
  setFormData: PropTypes.func
}

Storage.displayName = 'Storage'

export default Storage
