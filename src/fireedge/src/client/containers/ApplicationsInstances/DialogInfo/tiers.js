import React from 'react'
import PropTypes from 'prop-types'

import ListCards from 'client/components/List/ListCards'
import { TierCard } from 'client/components/Cards'

const TiersTab = ({ info }) => {
  const { roles = [] } = info.TEMPLATE.BODY

  return <ListCards list={roles} CardComponent={TierCard} />
}

TiersTab.propTypes = {
  info: PropTypes.object.isRequired
}

TiersTab.defaultProps = {
  info: {}
}

TiersTab.displayName = 'TiersTab'

export default TiersTab
