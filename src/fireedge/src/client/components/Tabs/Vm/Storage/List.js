import * as React from 'react'
import PropTypes from 'prop-types'

import StorageItem from 'client/components/Tabs/Vm/Storage/Item'

const StorageList = ({ disks, actions }) => (
  <div style={{
    display: 'grid',
    gap: '1em',
    gridTemplateColumns: 'repeat(auto-fill, minmax(49%, 1fr))',
    paddingBlock: '0.8em'
  }}>
    {disks.map((disk, idx) => (
      <StorageItem
        key={idx}
        disk={disk}
        actions={actions}
      />
    ))}
  </div>
)

StorageList.propTypes = {
  disks: PropTypes.array,
  actions: PropTypes.object
}

StorageList.displayName = 'StorageList'

export default StorageList
