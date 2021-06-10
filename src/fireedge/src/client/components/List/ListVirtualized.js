import * as React from 'react'
import PropTypes from 'prop-types'

import { useVirtual } from 'react-virtual'
import { Box } from '@material-ui/core'

const ListVirtualized = ({ list = [] }) => {
  const parentRef = React.useRef()

  const rowVirtualizer = useVirtual({
    size: list.length,
    parentRef,
    overscan: 20,
    estimateSize: React.useCallback(() => 35, []),
    keyExtractor: index => list[index]?.ID
  })

  return (
    <Box>
      <div
        ref={parentRef}
        style={{
          height: '150px',
          overflow: 'auto'
        }}
      >
        <div
          style={{
            height: `${rowVirtualizer.totalSize}px`,
            width: '100%',
            position: 'relative'
          }}
        >
          {rowVirtualizer.virtualItems.map(virtualRow => {
            console.log(virtualRow)
            return (
              <div
                key={virtualRow.index}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`
                }}
              >
              Row {virtualRow.index}
              </div>
            )
          })}
        </div>
      </div>
    </Box>
  )
}

ListVirtualized.propTypes = {
  list: PropTypes.arrayOf(PropTypes.any)
}

ListVirtualized.defaultProps = {
  list: []
}

export default ListVirtualized
