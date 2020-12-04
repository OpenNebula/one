import React, { memo, useEffect } from 'react'
import PropTypes from 'prop-types'

import DeleteIcon from '@material-ui/icons/Delete'

import { useProvision, useOpennebula, useFetchAll } from 'client/hooks'
import { ListCards } from 'client/components/List'
import { NetworkCard } from 'client/components/Cards'

const Networks = memo(({ hidden, data, fetchRequest }) => {
  const {
    networks
  } = data?.TEMPLATE?.PROVISION_BODY?.provision?.infrastructure

  const { deleteVNetwork } = useProvision()
  const { getVNetwork } = useOpennebula()
  const { data: list, fetchRequestAll, loading } = useFetchAll()

  useEffect(() => {
    if (!hidden) {
      const requests = networks?.map(getVNetwork) ?? []
      fetchRequestAll(requests)
    }
  }, [networks])

  useEffect(() => {
    if (!list && !hidden) {
      const requests = networks?.map(getVNetwork) ?? []
      fetchRequestAll(requests)
    }
  }, [hidden])

  return (
    <ListCards
      list={list}
      isLoading={!list && loading}
      CardComponent={NetworkCard}
      cardsProps={({ value: { ID } }) => ({
        actions: [{
          handleClick: () => deleteVNetwork({ id: ID })
            .then(() => fetchRequest(undefined, { reload: true })),
          icon: <DeleteIcon color='error' />,
          cy: `provision-vnet-delete-${ID}`
        }]
      })}
      displayEmpty
      breakpoints={{ xs: 12, md: 6 }}
    />
  )
}, (prev, next) =>
  prev.hidden === next.hidden && prev.data === next.data)

Networks.propTypes = {
  data: PropTypes.object.isRequired,
  hidden: PropTypes.bool,
  fetchRequest: PropTypes.func
}

Networks.defaultProps = {
  data: {},
  hidden: false,
  fetchRequest: () => undefined
}

Networks.displayName = 'Networks'

export default Networks
