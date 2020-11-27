import React, { memo, useEffect } from 'react'
import PropTypes from 'prop-types'

import DeleteIcon from '@material-ui/icons/Delete'

import useFetchAll from 'client/hooks/useFetchAll'
import useOpennebula from 'client/hooks/useOpennebula'
import ListCards from 'client/components/List/ListCards'
import { NetworkCard } from 'client/components/Cards'

const Networks = memo(({ hidden, data }) => {
  const {
    networks
  } = data?.TEMPLATE?.PROVISION_BODY?.provision?.infrastructure

  const { getVNetwork } = useOpennebula()
  const { data: list, fetchRequestAll, loading } = useFetchAll()

  useEffect(() => {
    if (!list && !hidden) {
      const reqs = networks?.map(({ id }) => getVNetwork({ id })) ?? []
      fetchRequestAll(reqs)
    }
  }, [hidden])

  return (
    <ListCards
      list={list}
      isLoading={loading}
      CardComponent={NetworkCard}
      cardsProps={({ value: { ID } }) => ({
        actions: [{
          handleClick: () => undefined,
          icon: DeleteIcon,
          cy: `provision-vnet-delete-${ID}`
        }]
      })}
      displayEmpty
      breakpoints={{ xs: 12, md: 6 }}
    />
  )
}, (prev, next) => prev.hidden === next.hidden)

Networks.propTypes = {
  data: PropTypes.object.isRequired,
  hidden: PropTypes.bool
}

Networks.defaultProps = {
  data: {},
  hidden: false
}

Networks.displayName = 'Networks'

export default Networks
