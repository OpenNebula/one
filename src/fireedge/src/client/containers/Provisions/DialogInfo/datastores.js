import React, { memo, useEffect } from 'react'
import PropTypes from 'prop-types'

import DeleteIcon from '@material-ui/icons/Delete'

import useFetchAll from 'client/hooks/useFetchAll'
import useOpennebula from 'client/hooks/useOpennebula'
import ListCards from 'client/components/List/ListCards'
import { DatastoreCard } from 'client/components/Cards'

const Datastores = memo(({ hidden, data }) => {
  const {
    datastores
  } = data?.TEMPLATE?.PROVISION_BODY?.provision?.infrastructure

  const { getDatastore } = useOpennebula()
  const { data: list, fetchRequestAll, loading } = useFetchAll()

  useEffect(() => {
    if (!list && !hidden) {
      const reqs = datastores?.map(({ id }) => getDatastore({ id })) ?? []
      fetchRequestAll(reqs)
    }
  }, [hidden])

  return (
    <ListCards
      list={list}
      isLoading={loading}
      CardComponent={DatastoreCard}
      cardsProps={({ value: { ID } }) => ({
        actions: [{
          handleClick: () => undefined,
          icon: DeleteIcon,
          cy: `provision-datastore-delete-${ID}`
        }]
      })}
      displayEmpty
      breakpoints={{ xs: 12, md: 6 }}
    />
  )
}, (prev, next) => prev.hidden === next.hidden)

Datastores.propTypes = {
  data: PropTypes.object.isRequired,
  hidden: PropTypes.bool
}

Datastores.defaultProps = {
  data: {},
  hidden: false
}

Datastores.displayName = 'Datastores'

export default Datastores
