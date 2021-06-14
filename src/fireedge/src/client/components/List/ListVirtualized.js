import * as React from 'react'
import PropTypes from 'prop-types'

import { useVirtual } from 'react-virtual'
import { debounce, makeStyles, Box, LinearProgress } from '@material-ui/core'

import { useNearScreen } from 'client/hooks'

const useStyles = makeStyles(theme => ({
  root: {
    height: '100%',
    overflow: 'auto',
    '&::-webkit-scrollbar': {
      width: 14
    },
    '&::-webkit-scrollbar-thumb': {
      backgroundClip: 'content-box',
      border: '4px solid transparent',
      borderRadius: 7,
      boxShadow: 'inset 0 0 0 10px',
      color: theme.palette.secondary.light
    }
  },
  container: {
    width: '100%',
    position: 'relative'
  },
  loading: {
    width: '100%',
    marginTop: 10
  }
}))

const ListVirtualized = ({
  canFetchMore,
  containerProps,
  data,
  isLoading,
  fetchMore,
  children
}) => {
  // STYLES
  const classes = useStyles()

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
    <Box ref={parentRef} className={classes.root}>
      <Box {...containerProps}
        className={classes.container}
        height={rowVirtualizer.totalSize}
      >
        {children(rowVirtualizer.virtualItems)}
      </Box>

      {!canFetchMore && (
        <LinearProgress
          ref={loaderRef}
          color='secondary'
          className={classes.loading}
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
