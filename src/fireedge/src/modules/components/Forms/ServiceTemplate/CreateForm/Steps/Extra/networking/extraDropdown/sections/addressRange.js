/* ------------------------------------------------------------------------- *
 * Copyright 2002-2025, OpenNebula Project, OpenNebula Systems               *
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
/* eslint-disable react/prop-types */

import { useFieldArray } from 'react-hook-form'
import { Stack } from '@mui/material'
import AddressRangeCard from '@modules/components/Cards/AddressRangeCard'
import {
  AddAddressRangeAction,
  UpdateAddressRangeAction,
  DeleteAddressRangeAction,
} from '@modules/components/Buttons'
import { STEP_ID as EXTRA_ID } from '@modules/components/Forms/ServiceTemplate/CreateForm/Steps/Extra'

import { SECTION_ID as EXTRA_SECTION_ID } from '@modules/components/Forms/ServiceTemplate/CreateForm/Steps/Extra/networking/extraDropdown'

const SECTION_ID = 'AR'

const AddressRanges = ({ selectedNetwork }) => {
  const {
    fields: addressRanges,
    remove,
    append,
    update,
  } = useFieldArray({
    name: `${EXTRA_ID}.${EXTRA_SECTION_ID}.${selectedNetwork}.${SECTION_ID}`,
  })

  const handleSubmit = (data) => append(data)
  const handleUpdate = (idx, data) => update(idx, data)
  const handleRemove = (idx) => remove(idx)

  return (
    <>
      <AddAddressRangeAction onSubmit={handleSubmit} />
      <Stack direction="column" spacing={1}>
        {addressRanges?.map((ar, idx) => (
          <AddressRangeCard
            key={`ar-${idx}`}
            ar={ar}
            actions={
              <>
                <UpdateAddressRangeAction
                  ar={{ ...ar, AR_ID: idx }}
                  onSubmit={(updatedAr) => handleUpdate(idx, updatedAr)}
                />
                <DeleteAddressRangeAction
                  ar={{ ...ar, AR_ID: idx }}
                  onSubmit={handleRemove}
                />
              </>
            }
          />
        ))}
      </Stack>
    </>
  )
}

export const AR = {
  Section: AddressRanges,
  id: SECTION_ID,
}
