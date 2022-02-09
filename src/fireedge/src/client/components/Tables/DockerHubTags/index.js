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
/* eslint-disable jsdoc/require-jsdoc */
import { useMemo, useEffect, useState, useCallback } from 'react'
import PropTypes from 'prop-types'

import { useFetch } from 'client/hooks'
import { useMarketplaceAppApi } from 'client/features/One'

import EnhancedTable from 'client/components/Tables/Enhanced'
import DockerHubTagsRow from 'client/components/Tables/DockerHubTags/row'

const getNextPageFromUrl = (url) => {
  try {
    const { searchParams } = new URL(url)

    return searchParams.get('page')
  } catch {
    return undefined
  }
}

const DockerHubTagsTable = ({ app, ...props } = {}) => {
  const { getDockerHubTags } = useMarketplaceAppApi()
  const [tags, setTags] = useState(() => [])

  const {
    data: { next, results = [] } = {},
    fetchRequest,
    loading,
    status,
    STATUS: { INIT, FETCHED },
  } = useFetch(getDockerHubTags)

  useEffect(() => {
    const appId = app?.ID
    const requests = app?.ID && {
      [INIT]: () => fetchRequest({ id: appId }),
      [FETCHED]: () => {
        if (!next) return

        const page = getNextPageFromUrl(next)
        fetchRequest({ id: appId, page })
      },
    }

    requests[status]?.()
  }, [app?.ID, status])

  useEffect(() => {
    status === FETCHED && setTags((prev) => prev.concat(results))
  }, [status])

  const memoData = useMemo(() => tags, [tags?.length])

  const memoColumns = useMemo(() => [{ accessor: 'name' }], [])

  return (
    <EnhancedTable
      columns={memoColumns}
      data={memoData}
      isLoading={loading}
      getRowId={useCallback((row) => String(row.name), [])}
      RowComponent={DockerHubTagsRow}
      {...props}
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
