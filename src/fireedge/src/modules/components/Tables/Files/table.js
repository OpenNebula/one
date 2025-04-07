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
import MultipleTags from '@modules/components/MultipleTags'

import { StatusCircle } from '@modules/components/Status'
import EnhancedTable, {
  createColumns,
} from '@modules/components/Tables/Enhanced'
import WrapperRow from '@modules/components/Tables/Enhanced/WrapperRow'
import ImageColumns from '@modules/components/Tables/Images/columns'
import FileRow from '@modules/components/Tables/Files/row'
import { RESOURCE_NAMES, T } from '@ConstantsModule'
import { useViews, ImageAPI, useAuth } from '@FeaturesModule'
import { getImageState, getImageType, getColorFromString } from '@ModelsModule'
import { getResourceLabels } from '@UtilsModule'

const DEFAULT_DATA_CY = 'images'

/**
 * @param {object} props - Props
 * @returns {ReactElement} Images table
 */
const FilesTable = (props) => {
  const { labels = {} } = useAuth()
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

  const fmtData = useMemo(
    () =>
      data?.map((row) => ({
        ...row,
        TEMPLATE: {
          ...(row?.TEMPLATE ?? {}),
          LABELS: getResourceLabels(labels, row?.ID, RESOURCE_NAMES.FILE, true),
        },
      })),
    [data]
  )

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
    {
      header: T.Labels,
      id: 'labels',
      accessor: ({ TEMPLATE: { LABELS = [] } }) => {
        const fmtLabels = LABELS?.map((label) => ({
          text: label,
          dataCy: `label-${label}`,
          stateColor: getColorFromString(label),
        }))

        return <MultipleTags tags={fmtLabels} truncateText={10} />
      },
    },
    { header: T.Owner, id: 'owner', accessor: 'UNAME' },
    { header: T.Group, id: 'group', accessor: 'GNAME' },
  ]

  const { component, header } = WrapperRow(FileRow)

  return (
    <EnhancedTable
      columns={columns}
      data={fmtData}
      rootProps={rootProps}
      searchProps={searchProps}
      refetch={refetch}
      isLoading={isFetching}
      getRowId={(row) => String(row.ID)}
      RowComponent={component}
      headerList={header && listHeader}
      resourceType={RESOURCE_NAMES.FILE}
      {...rest}
    />
  )
}

FilesTable.propTypes = { ...EnhancedTable.propTypes }
FilesTable.displayName = 'FilesTable'

export default FilesTable
