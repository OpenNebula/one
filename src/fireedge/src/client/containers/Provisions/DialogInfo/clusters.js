import React, { memo, useEffect } from 'react'
import PropTypes from 'prop-types'

import useFetchAll from 'client/hooks/useFetchAll'
import useOpennebula from 'client/hooks/useOpennebula'
import ListCards from 'client/components/List/ListCards'
import { ClusterCard } from 'client/components/Cards'

const Clusters = memo(({ hidden, data }) => {
  const {
    clusters
  } = data?.TEMPLATE?.PROVISION_BODY?.provision?.infrastructure

  const { getCluster } = useOpennebula()
  const { data: list, fetchRequestAll, loading } = useFetchAll()

  useEffect(() => {
    if (!list && !hidden) {
      const reqs = clusters?.map(({ id }) => getCluster({ id }))
      fetchRequestAll(reqs)
    }
  }, [hidden])

  return (
    <ListCards
      list={list}
      isLoading={loading}
      CardComponent={ClusterCard}
      displayEmpty
      breakpoints={{ xs: 12, sm: 6, md: 4 }}
    />
  )
}, (prev, next) => prev.hidden === next.hiddfen)

Clusters.propTypes = {
  data: PropTypes.object.isRequired,
  hidden: PropTypes.bool
}

Clusters.defaultProps = {
  data: {},
  hidden: true
}

Clusters.displayName = 'Clusters'

export default Clusters
