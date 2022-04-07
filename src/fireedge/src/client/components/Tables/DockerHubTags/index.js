/* ------------------------------------------------------------------------- *
 * Copyright 2002-2022, OpenNebula Project, OpenNebula Systems               *
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
import { useMemo, useEffect, useState, useCallback, ReactElement } from 'react'
import PropTypes from 'prop-types'

import { useLazyGetDockerHubTagsQuery } from 'client/features/OneApi/marketplaceApp'

import EnhancedTable from 'client/components/Tables/Enhanced'
import DockerHubTagsRow from 'client/components/Tables/DockerHubTags/row'
import { MarketplaceApp } from 'client/constants'

const DEFAULT_DATA_CY = 'docker-tags'

const getNextPageFromUrl = (url) => {
  try {
    const { searchParams } = new URL(url)

    return searchParams.get('page')
  } catch {
    return undefined
  }
}

/**
 * @param {object} props - Props
 * @param {MarketplaceApp} props.app - Marketplace App
 * @returns {ReactElement} Datastores table
 */
const DockerHubTagsTable = ({ app, ...props } = {}) => {
  const appId = app?.ID
  const { rootProps = {}, searchProps = {}, ...rest } = props ?? {}
  rootProps['data-cy'] ??= DEFAULT_DATA_CY
  searchProps['data-cy'] ??= `search-${DEFAULT_DATA_CY}`

  const [tags, setTags] = useState(() => [])
  const [fetchRequest, { data: { next } = {}, isSuccess, isFetching }] =
    useLazyGetDockerHubTagsQuery()

  useEffect(() => {
    ;(async () => {
      if (!appId || (isSuccess && !next)) return

      const page = next ? getNextPageFromUrl(next) : undefined
      const { results = [] } = await fetchRequest({ id: appId, page }).unwrap()
      setTags((prev) => prev.concat(results))
    })()
  }, [appId, next])

  if (!appId) {
    return <>{'App ID is required'}</>
  }

  return (
    <EnhancedTable
      columns={useMemo(() => [{ accessor: 'name' }], [])}
      data={useMemo(() => tags, [tags])}
      rootProps={rootProps}
      searchProps={searchProps}
      refetch={fetchRequest}
      isLoading={isFetching}
      getRowId={useCallback((row) => String(row.name), [])}
      RowComponent={DockerHubTagsRow}
      {...rest}
    />
  )
}

DockerHubTagsTable.displayName = 'DockerHubTagsTable'

DockerHubTagsTable.propTypes = {
  ...EnhancedTable.propTypes,
  app: PropTypes.shape({
    ID: PropTypes.string,
  }),
}

export default DockerHubTagsTable
