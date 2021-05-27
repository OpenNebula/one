import React, { memo, useEffect } from 'react'
import PropTypes from 'prop-types'

import DeleteIcon from '@material-ui/icons/Delete'
import ConfigureIcon from '@material-ui/icons/Settings'

import { useFetchAll } from 'client/hooks'
import { useHostApi, useProvisionApi } from 'client/features/One'
import { useGeneralApi } from 'client/features/General'
import { ListCards } from 'client/components/List'
import { HostCard } from 'client/components/Cards'
import * as Types from 'client/types/provision'

const Hosts = memo(
  ({ hidden, data, reloading, refetchProvision, disableAllActions }) => {
    const {
      hosts = []
    } = data?.TEMPLATE?.BODY?.provision?.infrastructure

    const { enqueueSuccess, enqueueInfo } = useGeneralApi()
    const { configureHost, deleteHost } = useProvisionApi()
    const { getHost } = useHostApi()

    const { data: list, fetchRequestAll, loading } = useFetchAll()
    const fetchHosts = () => fetchRequestAll(hosts?.map(({ id }) => getHost(id)))

    useEffect(() => {
      !hidden && !list && fetchHosts()
    }, [hidden])

    useEffect(() => {
      !reloading && !loading && fetchHosts()
    }, [reloading])

    return (
      <ListCards
        list={list}
        isLoading={!list && loading}
        CardComponent={HostCard}
        cardsProps={({ value: { ID } }) => !disableAllActions && ({
          actions: [
            {
              handleClick: () => configureHost(ID)
                .then(() => enqueueInfo(`Configuring host - ID: ${ID}`))
                .then(refetchProvision),
              icon: <ConfigureIcon />,
              cy: `provision-host-configure-${ID}`
            },
            {
              handleClick: () => deleteHost(ID)
                .then(refetchProvision)
                .then(() => enqueueSuccess(`Host deleted - ID: ${ID}`)),
              icon: <DeleteIcon color='error' />,
              cy: `provision-host-delete-${ID}`
            }
          ]
        })}
        displayEmpty
        breakpoints={{ xs: 12, md: 6 }}
      />
    )
  }, (prev, next) =>
    prev.hidden === next.hidden && prev.reloading === next.reloading)

Hosts.propTypes = {
  data: Types.Provision.isRequired,
  hidden: PropTypes.bool,
  refetchProvision: PropTypes.func,
  reloading: PropTypes.bool,
  disableAllActions: PropTypes.bool
}

Hosts.defaultProps = {
  data: {},
  hidden: false,
  refetchProvision: () => undefined,
  reloading: false,
  disableAllActions: false
}

Hosts.displayName = 'Hosts'

export default Hosts
