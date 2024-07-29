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
// import { Stack } from '@mui/material'
import ClusterIcon from 'iconoir-react/dist/Server'
import { useFormContext, useWatch } from 'react-hook-form'

import { ClustersTable } from 'client/components/Tables'

import {
  STEP_ID as EXTRA_ID,
  TabType,
} from 'client/components/Forms/VNTemplate/CreateForm/Steps/ExtraConfiguration'
import { T } from 'client/constants'

import PropTypes from 'prop-types'

import { isRestrictedAttributes } from 'client/utils'

export const TAB_ID = 'CLUSTER'

const ClustersContent = ({ oneConfig, adminGroup }) => {
  const TAB_PATH = `${EXTRA_ID}.${TAB_ID}`

  const { setValue } = useFormContext()
  const clusters = useWatch({ name: TAB_PATH })

  const selectedRowIds = Array.isArray(clusters)
    ? clusters?.reduce((res, id) => ({ ...res, [id]: true }), {})
    : { [clusters]: true }

  const handleSelectedRows = (rows) => {
    const newValue = rows?.map((row) => row.original.ID) || []
    setValue(TAB_PATH, newValue)
  }

  const readOnly =
    !adminGroup &&
    isRestrictedAttributes(
      'CLUSTER',
      undefined,
      oneConfig?.VNET_RESTRICTED_ATTR
    )

  return (
    <ClustersTable
      disableGlobalSort
      displaySelectedRows
      pageSize={5}
      initialState={{ selectedRowIds }}
      onSelectedRowsChange={handleSelectedRows}
      readOnly={readOnly}
    />
  )
}

ClustersContent.propTypes = {
  oneConfig: PropTypes.object,
  adminGroup: PropTypes.bool,
}

/** @type {TabType} */
const TAB = {
  id: 'clusters',
  name: T.Clusters,
  icon: ClusterIcon,
  Content: ClustersContent,
  getError: (error) => !!error?.[TAB_ID],
}

export default TAB
