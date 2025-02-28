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
// import { Stack } from '@mui/material'
import SecurityIcon from 'iconoir-react/dist/HistoricShield'
import { useFormContext, useWatch } from 'react-hook-form'

import { SecurityGroupsTable } from '@modules/components/Tables'

import {
  STEP_ID as EXTRA_ID,
  TabType,
} from '@modules/components/Forms/VNetwork/CreateForm/Steps/ExtraConfiguration'
import { T } from '@ConstantsModule'

import PropTypes from 'prop-types'

import { isRestrictedAttributes } from '@UtilsModule'

export const TAB_ID = 'SECURITY_GROUPS'

const SecurityContent = ({ oneConfig, adminGroup }) => {
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

  const readOnly =
    !adminGroup &&
    isRestrictedAttributes(
      'SECURITY_GROUPS',
      undefined,
      oneConfig?.VNET_RESTRICTED_ATTR
    )

  return (
    <SecurityGroupsTable.Table
      disableGlobalSort
      displaySelectedRows
      pageSize={5}
      initialState={{ selectedRowIds }}
      onSelectedRowsChange={handleSelectedRows}
      readOnly={readOnly}
    />
  )
}

SecurityContent.propTypes = {
  oneConfig: PropTypes.object,
  adminGroup: PropTypes.bool,
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
