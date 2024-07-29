/* ------------------------------------------------------------------------- *
 * Copyright 2002-2024, OpenNebula Project, OpenNebula Systems               *
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
import { useRef, useCallback, useEffect } from 'react'
import PropTypes from 'prop-types'

import { useVirtual } from 'react-virtual'
import { debounce, Box, LinearProgress } from '@mui/material'
import makeStyles from '@mui/styles/makeStyles'

import { useNearScreen } from 'client/hooks'

const useStyles = makeStyles((theme) => ({
  root: {
    height: '100%',
    overflow: 'auto',
  },
  container: {
    width: '100%',
    position: 'relative',
  },
  loading: {
    width: '100%',
    marginTop: 10,
  },
}))

const ListVirtualized = ({
  canFetchMore,
  containerProps,
  data,
  isLoading,
  fetchMore,
  children,
}) => {
  // STYLES
  const classes = useStyles()

  // OBSERVER
  const loaderRef = useRef()
  const { isNearScreen } = useNearScreen({
    distance: '100px',
    externalRef: isLoading ? null : loaderRef,
    once: false,
  })

  // VIRTUALIZER
  const parentRef = useRef()
  const rowVirtualizer = useVirtual({
    size: data.length,
    parentRef,
    overscan: 20,
    estimateSize: useCallback(() => 40, []),
    keyExtractor: (index) => data[index]?.id,
  })

  const debounceHandleNextPage = useCallback(debounce(fetchMore, 200), [])

  useEffect(() => {
    if (isNearScreen && !canFetchMore) debounceHandleNextPage()
  }, [isNearScreen, canFetchMore, debounceHandleNextPage])

  return (
    <Box ref={parentRef} className={classes.root}>
      <Box
        {...containerProps}
        className={classes.container}
        height={rowVirtualizer.totalSize}
      >
        {children(rowVirtualizer.virtualItems)}
      </Box>

      {!canFetchMore && (
        <LinearProgress
          ref={loaderRef}
          color="secondary"
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
  children: PropTypes.func,
}

ListVirtualized.defaultProps = {
  canFetchMore: false,
  containerProps: undefined,
  data: [],
  isLoading: false,
  fetchMore: () => undefined,
  children: () => undefined,
}

export default ListVirtualized
