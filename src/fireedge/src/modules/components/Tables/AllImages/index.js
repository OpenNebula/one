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
import { useMemo, ReactElement } from 'react'

import { useViews, ImageAPI } from '@FeaturesModule'

import EnhancedTable, {
  createColumns,
} from '@modules/components/Tables/Enhanced'
import ImageColumns from '@modules/components/Tables/AllImages/columns'
import ImageRow from '@modules/components/Tables/AllImages/row'
import { RESOURCE_NAMES } from '@ConstantsModule'

const DEFAULT_DATA_CY = 'allimages'

/**
 * @param {object} props - Props
 * @returns {ReactElement} Images table
 */
const AllImagesTable = (props) => {
  const { rootProps = {}, searchProps = {}, datastoreId, ...rest } = props ?? {}
  rootProps['data-cy'] ??= DEFAULT_DATA_CY
  searchProps['data-cy'] ??= `search-${DEFAULT_DATA_CY}`

  const { view, getResourceView } = useViews()
  const {
    data = [],
    isFetching,
    refetch,
  } = ImageAPI.useGetAllImagesQuery(undefined, {
    selectFromResult: (result) => ({
      ...result,
      data: result?.data?.filter((image) => {
        if (datastoreId) {
          return image?.DATASTORE_ID === datastoreId
        }

        return true
      }),
    }),
  })

  const columns = useMemo(
    () =>
      createColumns({
        filters: getResourceView(RESOURCE_NAMES.IMAGE)?.filters,
        columns: ImageColumns,
      }),
    [view]
  )

  return (
    <EnhancedTable
      columns={columns}
      data={useMemo(() => data, [data])}
      rootProps={rootProps}
      searchProps={searchProps}
      refetch={refetch}
      isLoading={isFetching}
      getRowId={(row) => String(row.ID)}
      RowComponent={ImageRow}
      {...rest}
    />
  )
}

AllImagesTable.propTypes = { ...EnhancedTable.propTypes }
AllImagesTable.displayName = 'AllImagesTable'

export default AllImagesTable
