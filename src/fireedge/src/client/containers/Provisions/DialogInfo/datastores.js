import React, { memo, useEffect } from 'react'
import PropTypes from 'prop-types'

import DeleteIcon from '@material-ui/icons/Delete'

import { useProvision, useOpennebula, useFetchAll } from 'client/hooks'
import { ListCards } from 'client/components/List'
import { DatastoreCard } from 'client/components/Cards'

const Datastores = memo(({ hidden, data, fetchRequest }) => {
  const {
    datastores
  } = data?.TEMPLATE?.BODY?.provision?.infrastructure

  const { deleteDatastore } = useProvision()
  const { getDatastore } = useOpennebula()
  const { data: list, fetchRequestAll, loading } = useFetchAll()

  useEffect(() => {
    if (!hidden) {
      const requests = datastores?.map(getDatastore) ?? []
      fetchRequestAll(requests)
    }
  }, [datastores])

  useEffect(() => {
    if (!list && !hidden) {
      const requests = datastores?.map(getDatastore) ?? []
      fetchRequestAll(requests)
    }
  }, [hidden])

  return (
    <ListCards
      list={list}
      isLoading={!list && loading}
      CardComponent={DatastoreCard}
      cardsProps={({ value: { ID } }) => ({
        actions: [{
          handleClick: () => deleteDatastore({ id: ID })
            .then(() => fetchRequest(undefined, { reload: true })),
          icon: <DeleteIcon color='error' />,
          cy: `provision-datastore-delete-${ID}`
        }]
      })}
      displayEmpty
      breakpoints={{ xs: 12, md: 6 }}
    />
  )
}, (prev, next) =>
  prev.hidden === next.hidden && prev.data === next.data)

Datastores.propTypes = {
  data: PropTypes.object.isRequired,
  hidden: PropTypes.bool,
  fetchRequest: PropTypes.func
}

Datastores.defaultProps = {
  data: {},
  hidden: false,
  fetchRequest: () => undefined
}

Datastores.displayName = 'Datastores'

export default Datastores
