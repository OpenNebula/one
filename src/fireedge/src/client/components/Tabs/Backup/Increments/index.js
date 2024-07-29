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
import { useGetImageQuery } from 'client/features/OneApi/image'
import { IncrementsTable } from 'client/components/Tables'

/**
 * Renders mainly Increments tab.
 *
 * @param {object} props - Props
 * @param {string} props.id - Image id
 * @returns {ReactElement} Increments tab
 */
const IncrementsTab = ({ id }) => {
  const { data: image = {} } = useGetImageQuery({ id })
  const increments = image?.BACKUP_INCREMENTS?.INCREMENT
    ? Array.isArray(image.BACKUP_INCREMENTS.INCREMENT)
      ? image.BACKUP_INCREMENTS.INCREMENT
      : [image.BACKUP_INCREMENTS.INCREMENT]
    : []

  return (
    <IncrementsTable
      disableGlobalSort
      disableRowSelect
      increments={increments || []}
    />
  )
}

IncrementsTab.propTypes = {
  tabProps: PropTypes.object,
  id: PropTypes.string,
}

IncrementsTab.displayName = 'IncrementsTab'

export default IncrementsTab
