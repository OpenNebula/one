/* ------------------------------------------------------------------------- *
 * Copyright 2002-2022, OpenNebula Project, OpenNebula Systems               *
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
import { useDatastoreApi, useProvisionApi } from 'client/features/One'
import { useGeneralApi } from 'client/features/General'
import { ListCards } from 'client/components/List'
import { DatastoreCard } from 'client/components/Cards'

const Datastores = memo(
  ({ hidden, data, reloading, refetchProvision, disableAllActions }) => {
    const { datastores = [] } = data?.TEMPLATE?.BODY?.provision?.infrastructure

    const { enqueueSuccess } = useGeneralApi()
    const { deleteDatastore } = useProvisionApi()
    const { getDatastore } = useDatastoreApi()

    const { data: list, fetchRequestAll, loading } = useFetchAll()
    const fetchDatastores = () =>
      fetchRequestAll(datastores?.map(({ id }) => getDatastore(id)))

    useEffect(() => {
      !hidden && !list && fetchDatastores()
    }, [hidden])

    useEffect(() => {
      !reloading && !loading && fetchDatastores()
    }, [reloading])

    return (
      <ListCards
        list={list}
        isLoading={!list && loading}
        CardComponent={DatastoreCard}
        cardsProps={({ value: { ID } }) =>
          !disableAllActions && {
            actions: [
              {
                handleClick: () =>
                  deleteDatastore(ID)
                    .then(refetchProvision)
                    .then(() =>
                      enqueueSuccess(`Datastore deleted - ID: ${ID}`)
                    ),
                icon: <DeleteIcon color="error" />,
                cy: `provision-datastore-delete-${ID}`,
              },
            ],
          }
        }
        displayEmpty
        breakpoints={{ xs: 12, md: 6 }}
      />
    )
  },
  (prev, next) =>
    prev.hidden === next.hidden && prev.reloading === next.reloading
)

Datastores.propTypes = {
  data: PropTypes.object.isRequired,
  hidden: PropTypes.bool,
  refetchProvision: PropTypes.func,
  reloading: PropTypes.bool,
  disableAllActions: PropTypes.bool,
}

Datastores.defaultProps = {
  data: {},
  hidden: false,
  refetchProvision: () => undefined,
  reloading: false,
  disableAllActions: false,
}

Datastores.displayName = 'Datastores'

export default Datastores
