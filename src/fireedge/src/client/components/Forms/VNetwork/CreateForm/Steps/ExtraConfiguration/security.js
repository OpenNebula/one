/* ------------------------------------------------------------------------- *
 * Copyright 2002-2023, OpenNebula Project, OpenNebula Systems               *
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
// import { Stack } from '@mui/material'
import { useFormContext, useWatch } from 'react-hook-form'
import SecurityIcon from 'iconoir-react/dist/HistoricShield'

import { SecurityGroupsTable } from 'client/components/Tables'

import {
  STEP_ID as EXTRA_ID,
  TabType,
} from 'client/components/Forms/VNetwork/CreateForm/Steps/ExtraConfiguration'
import { T } from 'client/constants'

export const TAB_ID = 'SECURITY_GROUPS'

const SecurityContent = () => {
  const TAB_PATH = `${EXTRA_ID}.${TAB_ID}`

  const { setValue } = useFormContext()
  const secGroups = useWatch({ name: TAB_PATH })

  const selectedRowIds = secGroups?.reduce(
    (res, id) => ({ ...res, [id]: true }),
    {}
  )

  const handleSelectedRows = (rows) => {
    const newValue = rows?.map((row) => row.original.ID) || []
    setValue(TAB_PATH, newValue)
  }

  return (
    <SecurityGroupsTable
      disableGlobalSort
      displaySelectedRows
      pageSize={5}
      initialState={{ selectedRowIds }}
      onSelectedRowsChange={handleSelectedRows}
    />
  )
}

/** @type {TabType} */
const TAB = {
  id: 'security',
  name: T.Security,
  icon: SecurityIcon,
  Content: SecurityContent,
  getError: (error) => !!error?.[TAB_ID],
}

export default TAB
