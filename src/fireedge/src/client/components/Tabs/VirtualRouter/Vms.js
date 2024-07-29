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
import { ReactElement } from 'react'
import PropTypes from 'prop-types'
import { useHistory, generatePath } from 'react-router-dom'

import { PATH } from 'client/apps/sunstone/routesOne'

import { useGetVRouterQuery } from 'client/features/OneApi/vrouter'

import { VmsTable } from 'client/components/Tables'

/**
 * Renders mainly information tab.
 *
 * @param {object} props - Props
 * @param {string} props.id - Host id
 * @returns {ReactElement} Information tab
 */
const VmsInfoTab = ({ id }) => {
  const path = PATH.INSTANCE.VMS.DETAIL
  const history = useHistory()

  const { data: vroutertemplate = {} } = useGetVRouterQuery({ id })
  const { VMS } = vroutertemplate
  const filterVms = [VMS]?.flatMap(({ ID }) => ID) ?? []

  const handleRowClick = (rowId) => {
    history.push(generatePath(path, { id: String(rowId) }))
  }

  return (
    <VmsTable
      disableRowSelect
      disableGlobalSort
      filterData={filterVms}
      onRowClick={(row) => handleRowClick(row.ID)}
    />
  )
}

VmsInfoTab.propTypes = {
  tabProps: PropTypes.object,
  id: PropTypes.string,
}

VmsInfoTab.displayName = 'WildsInfoTab'

export default VmsInfoTab
