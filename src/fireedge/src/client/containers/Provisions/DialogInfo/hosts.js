import React, { memo, useEffect } from 'react'
import PropTypes from 'prop-types'

import DeleteIcon from '@material-ui/icons/Delete'
import ConfigureIcon from '@material-ui/icons/Build'

import useProvision from 'client/hooks/useProvision'
import useOpennebula from 'client/hooks/useOpennebula'
import useFetchAll from 'client/hooks/useFetchAll'
import ListCards from 'client/components/List/ListCards'
import { HostCard } from 'client/components/Cards'

const Hosts = memo(({ hidden, data, fetchRequest }) => {
  const {
    hosts
  } = data?.TEMPLATE?.PROVISION_BODY?.provision?.infrastructure

  const { configureHost, deleteHost } = useProvision()
  const { getHost } = useOpennebula()
  const { data: list, fetchRequestAll, loading } = useFetchAll()

  useEffect(() => {
    if (!hidden) {
      const requests = hosts?.map(getHost) ?? []
      fetchRequestAll(requests)
    }
  }, [hosts])

  useEffect(() => {
    if (!list && !hidden) {
      const requests = hosts?.map(getHost) ?? []
      fetchRequestAll(requests)
    }
  }, [hidden])

  return (
    <ListCards
      list={list}
      isLoading={!list && loading}
      CardComponent={HostCard}
      cardsProps={({ value: { ID } }) => ({
        actions: [
          {
            handleClick: () => configureHost({ id: ID }),
            icon: <ConfigureIcon />,
            cy: `provision-host-configure-${ID}`
          },
          {
            handleClick: () => deleteHost({ id: ID })
              .then(() => fetchRequest(undefined, { reload: true })),
            icon: <DeleteIcon />,
            cy: `provision-host-delete-${ID}`
          }
        ]
      })}
      displayEmpty
      breakpoints={{ xs: 12, md: 6 }}
    />
  )
}, (prev, next) =>
  prev.hidden === next.hidden && prev.data === next.data)

Hosts.propTypes = {
  data: PropTypes.object.isRequired,
  hidden: PropTypes.bool,
  fetchRequest: PropTypes.func
}

Hosts.defaultProps = {
  data: {},
  hidde: false,
  fetchRequest: () => undefined
}

Hosts.displayName = 'Hosts'

export default Hosts
