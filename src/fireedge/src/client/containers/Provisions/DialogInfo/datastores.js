/* ------------------------------------------------------------------------- *
 * Copyright 2002-2024, OpenNebula Project, OpenNebula Systems               *
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

import {
  useGetProvisionQuery,
  useGetProvisionResourceQuery,
  useRemoveResourceMutation,
} from 'client/features/OneApi/provision'
import { useGeneralApi } from 'client/features/General'

import { DatastoresTable } from 'client/components/Tables'
import { DatastoreCard } from 'client/components/Cards'
import { SubmitButton } from 'client/components/FormControl'
import { T } from 'client/constants'

const Datastores = memo(
  ({ id }) => {
    const { enqueueSuccess } = useGeneralApi()

    const [
      removeResource,
      {
        isLoading: loadingRemove,
        isSuccess: successRemove,
        originalArgs: { id: deletedDatastoreId } = {},
      },
    ] = useRemoveResourceMutation()
    const { data } = useGetProvisionQuery(id)

    const provisionDatastores =
      data?.TEMPLATE?.BODY?.provision?.infrastructure?.datastores?.map(
        (datastore) => +datastore.id
      ) ?? []

    useEffect(() => {
      successRemove &&
        enqueueSuccess(T.SuccessDatastoreDeleted, deletedDatastoreId)
    }, [successRemove])

    return (
      <DatastoresTable
        disableGlobalSort
        disableRowSelect
        displaySelectedRows
        pageSize={5}
        useQuery={() =>
          useGetProvisionResourceQuery(
            { resource: 'datastore' },
            {
              selectFromResult: ({ data: result = [], ...rest }) => ({
                data: result?.filter((datastore) =>
                  provisionDatastores.includes(+datastore.ID)
                ),
                ...rest,
              }),
            }
          )
        }
        RowComponent={({ original: datastore, handleClick: _, ...props }) => (
          <DatastoreCard
            datastore={datastore}
            rootProps={props}
            actions={
              <SubmitButton
                data-cy={`provision-datastore-delete-${datastore.ID}`}
                icon={<DeleteIcon />}
                isSubmitting={loadingRemove}
                onClick={async () => {
                  removeResource({
                    provision: id,
                    id: datastore.ID,
                    resource: 'datastore',
                  })
                }}
              />
            }
          />
        )}
      />
    )
  },
  (prev, next) =>
    prev.hidden === next.hidden && prev.reloading === next.reloading
)

Datastores.propTypes = { id: PropTypes.string.isRequired }
Datastores.displayName = 'Datastores'

export default Datastores
