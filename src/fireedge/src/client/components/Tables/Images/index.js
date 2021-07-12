/* ------------------------------------------------------------------------- *
 * Copyright 2002-2021, OpenNebula Project, OpenNebula Systems               *
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
import React, { useEffect } from 'react'

import { useAuth } from 'client/features/Auth'
import { useFetch } from 'client/hooks'
import { useImage, useImageApi } from 'client/features/One'

import { SkeletonTable, EnhancedTable } from 'client/components/Tables'
import ImageColumns from 'client/components/Tables/Images/columns'
import ImageRow from 'client/components/Tables/Images/row'
import ImageDetail from 'client/components/Tables/Images/detail'

const ImagesTable = () => {
  const columns = React.useMemo(() => ImageColumns, [])

  const images = useImage()
  const { getImages } = useImageApi()
  const { filterPool } = useAuth()

  const { status, fetchRequest, loading, reloading, STATUS } = useFetch(getImages)
  const { INIT, PENDING } = STATUS

  useEffect(() => { fetchRequest() }, [filterPool])

  if (images?.length === 0 && [INIT, PENDING].includes(status)) {
    return <SkeletonTable />
  }

  return (
    <EnhancedTable
      columns={columns}
      data={images}
      isLoading={loading || reloading}
      getRowId={row => String(row.ID)}
      renderDetail={row => <ImageDetail id={row.ID} />}
      RowComponent={ImageRow}
    />
  )
}

export default ImagesTable
