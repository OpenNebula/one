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
import { memo, JSXElementConstructor } from 'react'
import PropTypes from 'prop-types'
import { Stack } from '@mui/material'
import { Edit, Trash } from 'iconoir-react'

import ButtonToTriggerForm from 'client/components/Forms/ButtonToTriggerForm'
import SelectCard, { Action } from 'client/components/Cards/SelectCard'
import { ImageSteps, VolatileSteps } from 'client/components/Forms/Vm'
import { StatusCircle, StatusChip } from 'client/components/Status'
import { Translate } from 'client/components/HOC'

import { getState, getDiskType } from 'client/models/Image'
import { stringToBoolean } from 'client/models/Helper'
import { prettyBytes } from 'client/utils'
import { T } from 'client/constants'

/**
 * The disk item will be included in the VM Template.
 *
 * @param {object} props - Props
 * @param {number} props.index - Index in list
 * @param {object} props.item - Disk
 * @param {string} props.hypervisor - VM hypervisor
 * @param {string} props.handleRemove - Remove function
 * @param {string} props.handleUpdate - Update function
 * @returns {JSXElementConstructor} - Disk card
 */
const DiskItem = memo(
  ({ item, hypervisor, handleRemove, handleUpdate }) => {
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
      PERSISTENT,
    } = item

    const isVolatile = !IMAGE && !IMAGE_ID
    const isPersistent = stringToBoolean(PERSISTENT)
    const state = !isVolatile && getState({ STATE: IMAGE_STATE })
    const type = isVolatile ? TYPE : getDiskType(item)
    const originalSize = +ORIGINAL_SIZE
      ? prettyBytes(+ORIGINAL_SIZE, 'MB')
      : '-'
    const size = prettyBytes(+SIZE, 'MB')

    return (
      <SelectCard
        title={
          isVolatile ? (
            <>
              {`${NAME} - `}
              <Translate word={T.VolatileDisk} />
            </>
          ) : (
            <Stack
              component="span"
              direction="row"
              alignItems="center"
              gap="0.5em"
            >
              <StatusCircle color={state?.color} tooltip={state?.name} />
              {`${NAME}: ${IMAGE}`}
              {isPersistent && <StatusChip text="PERSISTENT" />}
            </Stack>
          )
        }
        subheader={
          <>
            {Object.entries({
              [DATASTORE]: DATASTORE,
              READONLY: stringToBoolean(READONLY),
              PERSISTENT: stringToBoolean(PERSISTENT),
              [isVolatile || ORIGINAL_SIZE === SIZE
                ? size
                : `${originalSize}/${size}`]: true,
              [type]: type,
            })
              .map(([k, v]) => (v ? `${k}` : ''))
              .filter(Boolean)
              .join(' | ')}
          </>
        }
        action={
          <>
            <Action
              data-cy={`remove-${NAME}`}
              tooltip={<Translate word={T.Remove} />}
              handleClick={handleRemove}
              color="error"
              icon={<Trash />}
            />
            <ButtonToTriggerForm
              buttonProps={{
                'data-cy': `edit-${NAME}`,
                icon: <Edit />,
                tooltip: <Translate word={T.Edit} />,
              }}
              options={[
                {
                  dialogProps: {
                    title: <Translate word={T.EditSomething} values={[NAME]} />,
                  },
                  form: () =>
                    isVolatile
                      ? VolatileSteps({ hypervisor }, item)
                      : ImageSteps({ hypervisor }, item),
                  onSubmit: handleUpdate,
                },
              ]}
            />
          </>
        }
      />
    )
  },
  (prev, next) => prev.item?.NAME === next.item?.NAME
)

DiskItem.propTypes = {
  index: PropTypes.number,
  item: PropTypes.object,
  hypervisor: PropTypes.string,
  handleRemove: PropTypes.func,
  handleUpdate: PropTypes.func,
}

DiskItem.displayName = 'DiskItem'

export default DiskItem
