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
import { PATH } from '@modules/components/path'
import { VmsTable } from '@modules/components/Tables'
import EmptyTab from '@modules/components/Tabs/EmptyTab'
import { T } from '@ConstantsModule'
import { ImageAPI } from '@FeaturesModule'
import PropTypes from 'prop-types'
import { ReactElement } from 'react'
import { generatePath, useHistory } from 'react-router-dom'

/**
 * Renders mainly Vms tab.
 *
 * @param {object} props - Props
 * @param {string} props.id - Image id
 * @returns {ReactElement} vms tab
 */
const VmsTab = ({ id }) => {
  const { data: image = {} } = ImageAPI.useGetImageQuery({ id })
  const path = PATH.INSTANCE.VMS.DETAIL
  const history = useHistory()

  const handleRowClick = (rowId) => {
    history.push(generatePath(path, { id: String(rowId) }))
  }

  return (
    <VmsTable.Table
      disableGlobalSort
      displaySelectedRows
      host={image}
      onRowClick={(row) => handleRowClick(row.ID)}
      noDataMessage={<EmptyTab label={T.NotVmsCurrently} />}
    />
  )
}

VmsTab.propTypes = {
  tabProps: PropTypes.object,
  id: PropTypes.string,
}

VmsTab.displayName = 'VmsTab'

export default VmsTab
