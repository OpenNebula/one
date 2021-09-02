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
import * as yup from 'yup'

import { StatusCircle, StatusChip } from 'client/components/Status'
import { Translate } from 'client/components/HOC'

import { getState } from 'client/models/Image'
import { stringToBoolean } from 'client/models/Helper'
import { T, INPUT_TYPES } from 'client/constants'

const SIZE = ({
  DISK_ID,
  IMAGE,
  IMAGE_ID,
  IMAGE_STATE,
  SIZE,
  PERSISTENT
} = {}) => {
  const isVolatile = !IMAGE && !IMAGE_ID
  const isPersistent = stringToBoolean(PERSISTENT)
  const state = !isVolatile && getState({ STATE: IMAGE_STATE })

  return {
    name: `DISK[${DISK_ID}].SIZE`,
    label: isVolatile ? (
      <>
        {`DISK ${DISK_ID}: `}
        <Translate word={T.VolatileDisk} />
      </>
    ) : (
      <span style={{ display: 'flex', alignItems: 'center', gap: '0.5em' }}>
        <StatusCircle color={state?.color} tooltip={state?.name} />
        {`DISK ${DISK_ID}: ${IMAGE}`}
        {isPersistent && <StatusChip text='PERSISTENT' />}
      </span>
    ),
    type: INPUT_TYPES.TEXT,
    htmlType: 'number',
    tooltip: isPersistent
      ? `Persistent image. The changes will be saved back to
        the datastore after the VM is terminated (ie goes into DONE state)`
      : `Non-persistent disk. The changes will be lost once
        the VM is terminated (ie goes into DONE state)`,
    validation: yup
      .number()
      .positive()
      .min(0, 'Disk size field is required')
      .typeError('Disk must be a number')
      .required('Disk size field is required')
      .default(() => +SIZE),
    grid: { md: 12 }
  }
}

export const FIELDS = vmTemplate => {
  const { TEMPLATE: { DISK } = {} } = vmTemplate ?? {}
  const disks = [DISK].flat().filter(Boolean)

  return disks?.map(SIZE)
}

export const SCHEMA = yup.object({
  DISK: yup
    .array(yup.object({
      SIZE: SIZE().validation
    }))
    .transform(DISK => [DISK].flat().filter(Boolean))
})
