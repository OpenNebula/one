import * as React from 'react'
import PropTypes from 'prop-types'

import NetworkItem from 'client/components/Tabs/Vm/Network/Item'

const NetworkList = ({ nics, actions }) => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    gap: '1em',
    paddingBlock: '0.8em'
  }}>
    {nics.map((nic, idx) => (
      <NetworkItem key={idx} nic={nic} actions={actions} />
    ))}
  </div>
)

NetworkList.propTypes = {
  nics: PropTypes.array,
  actions: PropTypes.object
}

NetworkList.displayName = 'NetworkList'

export default NetworkList
