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
import PropTypes from 'prop-types'
import { useFieldArray } from 'react-hook-form'
import { Stack, Typography } from '@mui/material'
import AddressesIcon from 'iconoir-react/dist/Menu'

import { AddressRangeCard } from 'client/components/Cards'
import {
  AddAddressRangeAction,
  UpdateAddressRangeAction,
  DeleteAddressRangeAction,
} from 'client/components/Buttons'
import { Translate } from 'client/components/HOC'

import {
  STEP_ID as EXTRA_ID,
  TabType,
} from 'client/components/Forms/VNetwork/CreateForm/Steps/ExtraConfiguration'
import { mapNameByIndex } from 'client/components/Forms/VNetwork/CreateForm/Steps/ExtraConfiguration/schema'
import { T } from 'client/constants'

export const TAB_ID = 'AR'

const mapNameFunction = mapNameByIndex('AR')

const AddressesContent = ({ oneConfig, adminGroup }) => {
  const {
    fields: addresses,
    remove,
    update,
    append,
  } = useFieldArray({
    name: `${EXTRA_ID}.${TAB_ID}`,
    keyName: 'ID',
  })

  const handleCreateAction = (action) => {
    append(mapNameFunction(action, addresses.length))
  }

  const handleUpdate = (action, index) => {
    update(index, mapNameFunction(action, index))
  }

  const handleRemove = (index) => {
    remove(index)
  }

  return (
    <>
      <Stack flexDirection="row" gap="1em">
        <AddAddressRangeAction
          onSubmit={handleCreateAction}
          oneConfig={oneConfig}
          adminGroup={adminGroup}
        />
      </Stack>

      <Stack
        pb="1em"
        display="grid"
        gridTemplateColumns="repeat(auto-fit, minmax(300px, 0.5fr))"
        gap="1em"
        mt="1em"
      >
        {addresses?.map((ar, index) => {
          const key = ar.ID ?? ar.NAME
          const fakeValues = { ...ar, AR_ID: index }

          return (
            <AddressRangeCard
              key={key}
              ar={fakeValues}
              actions={
                <>
                  <UpdateAddressRangeAction
                    vm={{}}
                    ar={fakeValues}
                    onSubmit={(updatedAr) => handleUpdate(updatedAr, index)}
                    oneConfig={oneConfig}
                    adminGroup={adminGroup}
                  />
                  <DeleteAddressRangeAction
                    ar={fakeValues}
                    onSubmit={() => handleRemove(index)}
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

AddressesContent.propTypes = {
  oneConfig: PropTypes.object,
  adminGroup: PropTypes.bool,
}

const Content = ({ isUpdate, oneConfig, adminGroup }) =>
  isUpdate ? (
    <Typography variant="subtitle2">
      <Translate word={T.DisabledAddressRangeInForm} />
    </Typography>
  ) : (
    <AddressesContent oneConfig={oneConfig} adminGroup={adminGroup} />
  )

Content.propTypes = {
  isUpdate: PropTypes.bool,
  oneConfig: PropTypes.object,
  adminGroup: PropTypes.bool,
}

/** @type {TabType} */
const TAB = {
  id: 'addresses',
  name: T.Addresses,
  icon: AddressesIcon,
  Content,
  getError: (error) => !!error?.[TAB_ID],
}

export default TAB
