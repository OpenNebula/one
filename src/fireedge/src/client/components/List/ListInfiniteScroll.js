import React, { useRef, useEffect, useCallback, createRef } from 'react'
import PropTypes from 'prop-types'

import { debounce, LinearProgress } from '@material-ui/core'
import { useList, useNearScreen } from 'client/hooks'

const ListInfiniteScroll = ({ list, renderResult }) => {
  const gridRef = createRef()
  const { loading, shortList, finish, reset, setLength } = useList({
    list,
    initLength: 50
  })

  const loaderRef = useRef()
  const { isNearScreen } = useNearScreen({
    distance: '100px',
    externalRef: loading ? null : loaderRef,
    once: false
  })

  useEffect(() => {
    reset(list)
    gridRef.current.scrollIntoView({ block: 'start' })
  }, [list])

  const debounceHandleNextPage = useCallback(
    debounce(() => setLength(prevLength => prevLength + 20), 200),
    [setLength]
  )

  useEffect(() => {
    if (isNearScreen && !finish) debounceHandleNextPage()
  }, [isNearScreen, finish, debounceHandleNextPage])

  return (
    <div style={{ overflowY: 'auto', padding: 10 }}>
      <div
        ref={gridRef}
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gridGap: 10
        }}
      >
        {shortList?.map(renderResult)}
      </div>
      {!finish && (
        <LinearProgress
          ref={loaderRef}
          style={{ width: '100%', marginTop: 10 }}
        />
      )}
    </div>
  )
}

ListInfiniteScroll.propTypes = {
  list: PropTypes.arrayOf(PropTypes.any),
  renderResult: PropTypes.func
}

ListInfiniteScroll.defaultProps = {
  list: [],
  renderResult: () => null
}

export default ListInfiniteScroll
