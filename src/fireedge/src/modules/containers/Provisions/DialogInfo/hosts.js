/* ------------------------------------------------------------------------- *
 * Copyright 2002-2025, OpenNebula Project, OpenNebula Systems               *
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
import { memo, useState } from 'react'
import PropTypes from 'prop-types'

import {
  Trash as DeleteIcon,
  Settings as ConfigureIcon,
  AddCircledOutline,
} from 'iconoir-react'
import { Stack, TextField } from '@mui/material'

import { ProvisionAPI, useGeneralApi } from '@FeaturesModule'

import {
  HostsTable,
  HostCard,
  Translate,
  SubmitButton,
  TranslateProvider,
} from '@ComponentsModule'
import { T } from '@ConstantsModule'

export const Hosts = memo(({ id, setTab, logTabId }) => {
  const [amount, setAmount] = useState(() => 1)
  const { enqueueInfo } = useGeneralApi()

  const [addHost, { isLoading: loadingAddHost }] =
    ProvisionAPI.useAddHostToProvisionMutation()
  const [configureHost, { isLoading: loadingConfigure }] =
    ProvisionAPI.useConfigureHostMutation()
  const [removeResource, { isLoading: loadingRemove }] =
    ProvisionAPI.useRemoveResourceMutation()
  const { data = {} } = ProvisionAPI.useGetProvisionQuery(id)

  const provisionHosts =
    data?.TEMPLATE?.BODY?.provision?.infrastructure?.hosts?.map(
      (host) => +host.id
    ) ?? []

  return (
    <>
      <TranslateProvider>
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
              data-cy="add-host"
              color="secondary"
              sx={{ ml: 1, display: 'flex', alignItems: 'flex-start' }}
              endicon={<AddCircledOutline />}
              label={<Translate word={T.AddHost} />}
              isSubmitting={loadingAddHost}
              onClick={async () => {
                addHost({ id, amount })
                enqueueInfo(T.InfoProvisionAddHost, [
                  amount,
                  amount > 1 ? 's' : '',
                ])
              }}
            />
          </Stack>
        </Stack>
        <HostsTable.Table
          disableGlobalSort
          disableRowSelect
          displaySelectedRows
          pageSize={5}
          useQuery={() =>
            ProvisionAPI.useGetProvisionResourceQuery(
              /* eslint-disable jsdoc/require-jsdoc */
              { resource: 'host' },
              {
                selectFromResult: ({ data: result = [], ...rest }) => ({
                  data: result?.filter((host) =>
                    provisionHosts.includes(+host.ID)
                  ),
                  ...rest,
                }),
              }
            )
          }
          RowComponent={({ original: host, handleClick: _, ...props }) => (
            <HostCard
              host={host}
              rootProps={props}
              actions={
                <>
                  <SubmitButton
                    data-cy={`provision-host-configure-${host.ID}`}
                    icon={<ConfigureIcon />}
                    isSubmitting={loadingConfigure}
                    onClick={async () => {
                      configureHost({ provision: id, id: host.ID })
                      enqueueInfo(T.InfoProvisionConfigureHost, host.ID)
                      setTab(logTabId)
                    }}
                  />
                  <SubmitButton
                    data-cy={`provision-host-delete-${host.ID}`}
                    icon={<DeleteIcon />}
                    isSubmitting={loadingRemove}
                    onClick={async () => {
                      removeResource({
                        provision: id,
                        id: host.ID,
                        resource: 'host',
                      })
                      enqueueInfo(T.InfoProvisionDeleteHost, host.ID)
                    }}
                  />
                </>
              }
            />
          )}
        />
      </TranslateProvider>
    </>
  )
})

Hosts.propTypes = {
  id: PropTypes.string.isRequired,
  setTab: PropTypes.func,
  logTabId: PropTypes.number,
}
Hosts.displayName = 'Hosts'
