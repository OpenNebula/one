/* ------------------------------------------------------------------------- *
 * Copyright 2002-2021, OpenNebula Project, OpenNebula Systems               *
 *                                                                           *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may   *
 * not use this file except in compliance with the License. You may obtain   *
 * a copy of the License at                                                  *
 *                                                                           *
 * http://www.apache.org/licenses/LICENSE-2.0                                *
 *                                                                           *
 * Unless required by applicable law or agreed to in writing, software       *
 * distributed under the License is distributed on an "AS IS" BASIS,         *
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  *
 * See the License for the specific language governing permissions and       *
 * limitations under the License.                                            *
 * ------------------------------------------------------------------------- */
import React, { memo, useEffect } from 'react'
import PropTypes from 'prop-types'

import { Trash as DeleteIcon, Settings as ConfigureIcon } from 'iconoir-react'

import { useFetchAll } from 'client/hooks'
import { useHostApi, useProvisionApi } from 'client/features/One'
import { useGeneralApi } from 'client/features/General'
import { ListCards } from 'client/components/List'
import { HostCard } from 'client/components/Cards'

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
  data: PropTypes.object.isRequired,
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
