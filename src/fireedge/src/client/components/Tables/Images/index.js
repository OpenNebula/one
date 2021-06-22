import React, { useEffect } from 'react'

import { useAuth } from 'client/features/Auth'
import { useFetch } from 'client/hooks'
import { useImage, useImageApi } from 'client/features/One'

import { EnhancedTable } from 'client/components/Tables'
import ImageColumns from 'client/components/Tables/Images/columns'
import ImageRow from 'client/components/Tables/Images/row'

const ImagesTable = () => {
  const columns = React.useMemo(() => ImageColumns, [])

  const images = useImage()
  const { getImages } = useImageApi()
  const { filterPool } = useAuth()

  const { fetchRequest, loading, reloading } = useFetch(getImages)

  useEffect(() => { fetchRequest() }, [filterPool])

  return (
    <EnhancedTable
      columns={columns}
      data={images}
      isLoading={loading || reloading}
      getRowId={row => String(row.ID)}
      RowComponent={ImageRow}
    />
  )
}

export default ImagesTable
