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
/* eslint-disable react/prop-types */
import { object, array, number } from 'yup'

import { StatusCircle, StatusChip } from 'client/components/Status'
import { Translate } from 'client/components/HOC'

import { getState } from 'client/models/Image'
import { stringToBoolean } from 'client/models/Helper'
import { T, INPUT_TYPES } from 'client/constants'
import { Field } from 'client/utils'

export const PARENT = 'DISK'

const addParentToField = ({ name, ...field }, idx) => ({
  ...field,
  name: [`${PARENT}[${idx}]`, name].join('.'),
})

const SIZE_FIELD = ({
  DISK_ID,
  IMAGE,
  IMAGE_ID,
  IMAGE_STATE,
  SIZE,
  PERSISTENT,
} = {}) => {
  const isVolatile = !IMAGE && !IMAGE_ID
  const isPersistent = stringToBoolean(PERSISTENT)
  const state = !isVolatile && getState({ STATE: IMAGE_STATE })

  return {
    name: 'SIZE',
    label: isVolatile ? (
      <>
        {`DISK ${DISK_ID}: `}
        <Translate word={T.VolatileDisk} />
      </>
    ) : (
      <span style={{ display: 'flex', alignItems: 'center', gap: '0.5em' }}>
        <StatusCircle color={state?.color} tooltip={state?.name} />
        {`DISK ${DISK_ID}: ${IMAGE}`}
        {isPersistent && <StatusChip text="PERSISTENT" />}
      </span>
    ),
    type: INPUT_TYPES.TEXT,
    htmlType: 'number',
    tooltip: isPersistent
      ? `Persistent image. The changes will be saved back to
        the datastore after the VM is terminated (ie goes into DONE state)`
      : `Non-persistent disk. The changes will be lost once
        the VM is terminated (ie goes into DONE state)`,
    validation: number()
      .positive()
      .min(0, 'Disk size field is required')
      .typeError('Disk must be a number')
      .required('Disk size field is required')
      .default(() => +SIZE),
    grid: { md: 12 },
    fieldProps: { disabled: isPersistent },
  }
}

/**
 * @param {object} [vmTemplate] - VM Template
 * @returns {Field[]} Section fields
 */
export const FIELDS = (vmTemplate) => {
  const disks = [vmTemplate?.TEMPLATE?.DISK ?? []].flat()

  return disks?.map(SIZE_FIELD).map(addParentToField)
}

export const SCHEMA = object({
  [PARENT]: array(
    object({
      [SIZE_FIELD().name]: SIZE_FIELD().validation,
    })
  ).ensure(),
})
