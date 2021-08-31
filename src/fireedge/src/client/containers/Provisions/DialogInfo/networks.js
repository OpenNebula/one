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
import { memo, useEffect } from 'react'
import PropTypes from 'prop-types'

import { Trash as DeleteIcon } from 'iconoir-react'

import { useFetchAll } from 'client/hooks'
import { useVNetworkApi, useProvisionApi } from 'client/features/One'
import { useGeneralApi } from 'client/features/General'
import { ListCards } from 'client/components/List'
import { NetworkCard } from 'client/components/Cards'

const Networks = memo(
  ({ hidden, data, reloading, refetchProvision, disableAllActions }) => {
    const {
      networks = []
    } = data?.TEMPLATE?.BODY?.provision?.infrastructure

    const { enqueueSuccess } = useGeneralApi()
    const { deleteVNetwork } = useProvisionApi()
    const { getVNetwork } = useVNetworkApi()

    const { data: list, fetchRequestAll, loading } = useFetchAll()
    const fetchVNetworks = () => fetchRequestAll(networks?.map(({ id }) => getVNetwork(id)))

    useEffect(() => {
      !hidden && !list && fetchVNetworks()
    }, [hidden])

    useEffect(() => {
      !reloading && !loading && fetchVNetworks()
    }, [reloading])

    return (
      <ListCards
        list={list}
        isLoading={!list && loading}
        CardComponent={NetworkCard}
        cardsProps={({ value: { ID } }) => !disableAllActions && ({
          actions: [{
            handleClick: () => deleteVNetwork(ID)
              .then(refetchProvision)
              .then(() => enqueueSuccess(`VNetwork deleted - ID: ${ID}`)),
            icon: <DeleteIcon color='error' />,
            cy: `provision-vnet-delete-${ID}`
          }]
        })}
        displayEmpty
        breakpoints={{ xs: 12, md: 6 }}
      />
    )
  }, (prev, next) =>
    prev.hidden === next.hidden && prev.reloading === next.reloading
)

Networks.propTypes = {
  data: PropTypes.object.isRequired,
  hidden: PropTypes.bool,
  refetchProvision: PropTypes.func,
  reloading: PropTypes.bool,
  disableAllActions: PropTypes.bool
}

Networks.defaultProps = {
  data: {},
  hidden: false,
  refetchProvision: () => undefined,
  reloading: false,
  disableAllActions: false
}

Networks.displayName = 'Networks'

export default Networks
