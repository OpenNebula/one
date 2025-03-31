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
import { ReactElement, useMemo } from 'react'

import { StatusCircle } from '@modules/components/Status'
import EnhancedTable, {
  createColumns,
} from '@modules/components/Tables/Enhanced'
import WrapperRow from '@modules/components/Tables/Enhanced/WrapperRow'
import ImageColumns from '@modules/components/Tables/Images/columns'
import ImageRow from '@modules/components/Tables/Images/row'
import { RESOURCE_NAMES, T } from '@ConstantsModule'
import { useViews, ImageAPI } from '@FeaturesModule'
import { getImageState, getImageType } from '@ModelsModule'

const DEFAULT_DATA_CY = 'images'

/**
 * @param {object} props - Props
 * @returns {ReactElement} Images table
 */
const FilesTable = (props) => {
  const { rootProps = {}, searchProps = {}, datastoreId, ...rest } = props ?? {}
  rootProps['data-cy'] ??= DEFAULT_DATA_CY
  searchProps['data-cy'] ??= `search-${DEFAULT_DATA_CY}`

  const { view, getResourceView } = useViews()
  const {
    data = [],
    isFetching,
    refetch,
  } = ImageAPI.useGetFilesQuery(undefined, {
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

  const listHeader = [
    {
      header: '',
      id: 'status-icon',
      accessor: (vm) => {
        const { color: stateColor, name: stateName } = getImageState(vm)

        return <StatusCircle color={stateColor} tooltip={stateName} />
      },
    },
    { header: T.ID, id: 'id', accessor: 'ID' },
    { header: T.Name, id: 'name', accessor: 'NAME' },
    { header: T.Datastore, id: 'datastore', accessor: 'DATASTORE' },
    {
      header: T.Type,
      id: 'type',
      accessor: (template) => getImageType(template),
    },
    { header: T.Owner, id: 'owner', accessor: 'UNAME' },
    { header: T.Group, id: 'group', accessor: 'GNAME' },
  ]

  const { component, header } = WrapperRow(ImageRow)

  return (
    <EnhancedTable
      columns={columns}
      data={useMemo(() => data, [data])}
      rootProps={rootProps}
      searchProps={searchProps}
      refetch={refetch}
      isLoading={isFetching}
      getRowId={(row) => String(row.ID)}
      RowComponent={component}
      headerList={header && listHeader}
      {...rest}
    />
  )
}

FilesTable.propTypes = { ...EnhancedTable.propTypes }
FilesTable.displayName = 'FilesTable'

export default FilesTable
