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
import { ReactElement, useEffect } from 'react'
import PropTypes from 'prop-types'
import { useHistory } from 'react-router'
import { Stack, Typography, Divider, Skeleton } from '@mui/material'

import { useGetVmQuery } from 'client/features/OneApi/vm'
import { useGeneralApi } from 'client/features/General'
import { StatusCircle } from 'client/components/Status'
import MultipleTags from 'client/components/MultipleTags'
import { getIps, getState, isVCenter } from 'client/models/VirtualMachine'
import { timeFromMilliseconds } from 'client/models/Helper'
import { PATH } from 'client/apps/sunstone/routes'
import { VM_ACTIONS } from 'client/constants'

/**
 * @param {object} props - Props
 * @param {string} props.id - VM id
 * @param {'vnc'|'ssh'|'rdp'|'vmrc'} props.type - Connection type
 * @returns {ReactElement} Header VM information for remote consoles
 */
const HeaderVmInfo = ({ id, type }) => {
  const { push: redirectTo } = useHistory()
  const { enqueueError } = useGeneralApi()

  const { data: vm, isSuccess, isLoading, isError } = useGetVmQuery(id)

  const ips = getIps(vm)
  const { color: stateColor, name: stateName } = getState(vm) ?? {}
  const time = timeFromMilliseconds(+vm?.ETIME || +vm?.STIME)

  useEffect(() => {
    isError && redirectTo(PATH.DASHBOARD)
  }, [isError])

  useEffect(() => {
    if (type === VM_ACTIONS.VMRC && isSuccess && vm && !isVCenter(vm)) {
      enqueueError(`${vm.ID} - ${vm.NAME} is not located on vCenter Host`)
      redirectTo(PATH.DASHBOARD)
    }
  }, [isSuccess])

  return (
    <Stack direction="row" justifyContent="space-between" gap="1em" px={2}>
      <Typography flexGrow={1} display="flex" alignItems="center" gap="0.5em">
        {isLoading ? (
          <>
            <Skeleton variant="circular" width={12} height={12} />
            <Skeleton variant="text" width="60%" />
          </>
        ) : (
          <>
            <StatusCircle color={stateColor} tooltip={stateName} />
            {`# ${vm?.ID} - ${vm?.NAME}`}
          </>
        )}
      </Typography>
      <Stack
        flexGrow={1}
        direction="row"
        justifyContent="flex-end"
        divider={<Divider orientation="vertical" flexItem />}
        gap="1em"
      >
        {isLoading ? (
          <Skeleton variant="text" width="60%" />
        ) : (
          <Typography>{`Started on: ${time.toFormat('ff')}`}</Typography>
        )}
        {isLoading ? (
          <Skeleton variant="text" width="40%" />
        ) : (
          !!ips?.length && (
            <Typography>
              <MultipleTags tags={ips} />
            </Typography>
          )
        )}
      </Stack>
    </Stack>
  )
}

HeaderVmInfo.propTypes = {
  id: PropTypes.string,
  type: PropTypes.oneOf(['vnc', 'ssh', 'rdp', 'vmrc']),
}

export default HeaderVmInfo
