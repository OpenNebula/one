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
