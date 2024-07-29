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
import { memo, useEffect, useState } from 'react'
import PropTypes from 'prop-types'

import { Trash as DeleteIcon, AddCircledOutline } from 'iconoir-react'
import { Stack, TextField } from '@mui/material'

import { useGeneralApi } from 'client/features/General'
import {
  useGetProvisionQuery,
  useAddIpToProvisionMutation,
  useRemoveResourceMutation,
  useGetProvisionResourceQuery,
} from 'client/features/OneApi/provision'

import { VNetworksTable } from 'client/components/Tables'
import { NetworkCard } from 'client/components/Cards'
import { SubmitButton } from 'client/components/FormControl'
import { Translate } from 'client/components/HOC'
import { T } from 'client/constants'

const Networks = memo(({ id }) => {
  const [amount, setAmount] = useState(() => 1)
  const { enqueueSuccess } = useGeneralApi()

  const [addIp, { isLoading: loadingAddIp, isSuccess: successAddIp }] =
    useAddIpToProvisionMutation()
  const [
    removeResource,
    {
      isLoading: loadingRemove,
      isSuccess: successRemove,
      originalArgs: { id: vnetId } = {},
    },
  ] = useRemoveResourceMutation()
  const { data = {} } = useGetProvisionQuery(id)

  const provisionNetworks =
    data?.TEMPLATE?.BODY?.provision?.infrastructure?.networks?.map(
      (network) => +network.id
    ) ?? []

  useEffect(() => {
    successAddIp && enqueueSuccess(T.SuccessIPAdded, amount)
  }, [successAddIp])

  useEffect(() => {
    successRemove && enqueueSuccess(T.SuccessNetworkDeleted, vnetId)
  }, [successRemove])

  return (
    <>
      <Stack direction="row" mb="0.5em">
        <TextField
          type="number"
          inputProps={{ 'data-cy': 'amount' }}
          onChange={(event) => {
            const newAmount = event.target.value
            ;+newAmount > 0 && setAmount(newAmount)
          }}
          value={amount}
        />
        <Stack alignSelf="center">
          <SubmitButton
            data-cy="add-ip"
            color="secondary"
            endicon={<AddCircledOutline />}
            label={<Translate word={T.AddIP} />}
            sx={{ ml: 1, display: 'flex', alignItems: 'flex-start' }}
            isSubmitting={loadingAddIp}
            onClick={async () => await addIp({ id, amount })}
          />
        </Stack>
      </Stack>
      <VNetworksTable
        disableGlobalSort
        disableRowSelect
        displaySelectedRows
        pageSize={5}
        useQuery={() =>
          useGetProvisionResourceQuery(
            { resource: 'network' },
            {
              selectFromResult: ({ data: result = [], ...rest }) => ({
                data: result?.filter((vnet) =>
                  provisionNetworks.includes(+vnet.ID)
                ),
                ...rest,
              }),
            }
          )
        }
        RowComponent={({ original: vnet, handleClick: _, ...props }) => (
          <NetworkCard
            network={vnet}
            rootProps={props}
            actions={
              <>
                <SubmitButton
                  data-cy={`provision-vnet-delete-${vnet.ID}`}
                  icon={<DeleteIcon />}
                  isSubmitting={loadingRemove}
                  onClick={async () =>
                    await removeResource({
                      provision: id,
                      id: vnet.ID,
                      resource: 'network',
                    })
                  }
                />
              </>
            }
          />
        )}
      />
    </>
  )
})

Networks.propTypes = { id: PropTypes.string.isRequired }
Networks.displayName = 'Networks'

export default Networks
