import * as React from 'react'
import PropTypes from 'prop-types'

import { useVirtual } from 'react-virtual'
import { debounce, Box, LinearProgress } from '@material-ui/core'

import { useNearScreen } from 'client/hooks'

const ListVirtualized = ({
  canFetchMore,
  containerProps,
  data,
  isLoading,
  fetchMore,
  children
}) => {
  // OBSERVER
  const loaderRef = React.useRef()
  const { isNearScreen } = useNearScreen({
    distance: '100px',
    externalRef: isLoading ? null : loaderRef,
    once: false
  })

  // VIRTUALIZER
  const parentRef = React.useRef()
  const rowVirtualizer = useVirtual({
    size: data.length,
    parentRef,
    overscan: 20,
    estimateSize: React.useCallback(() => 40, []),
    keyExtractor: index => data[index]?.id
  })

  const debounceHandleNextPage = React.useCallback(debounce(fetchMore, 200), [])

  React.useEffect(() => {
    if (isNearScreen && !canFetchMore) debounceHandleNextPage()
  }, [isNearScreen, canFetchMore, debounceHandleNextPage])

  return (
    <Box ref={parentRef} height={1} overflow='auto'>
      <Box {...containerProps}
        height={`${rowVirtualizer.totalSize}px`}
        width={1}
        position='relative'
      >
        {children(rowVirtualizer.virtualItems)}
      </Box>

      {!canFetchMore && (
        <LinearProgress
          ref={loaderRef}
          color='secondary'
          style={{ width: '100%', marginTop: 10 }}
        />
      )}
    </Box>
  )
}

ListVirtualized.propTypes = {
  canFetchMore: PropTypes.bool,
  containerProps: PropTypes.object,
  data: PropTypes.arrayOf(PropTypes.any),
  isLoading: PropTypes.bool,
  fetchMore: PropTypes.func,
  children: PropTypes.func
}

ListVirtualized.defaultProps = {
  canFetchMore: false,
  containerProps: undefined,
  data: [],
  isLoading: false,
  fetchMore: () => undefined,
  children: () => undefined
}

export default ListVirtualized
