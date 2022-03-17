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
import { ReactElement, useMemo, useRef, useEffect } from 'react'
import { useParams, useHistory } from 'react-router'
import { Box, Stack, Typography, Divider, Skeleton } from '@mui/material'

import { useGetVmQuery } from 'client/features/OneApi/vm'
import {
  useGuacamoleSession,
  GuacamoleDisplay,
  GuacamoleKeyboard,
  GuacamoleMouse,
  GuacamoleClipboard,
  GuacamoleCtrlAltDelButton,
  GuacamoleReconnectButton,
  GuacamoleFullScreenButton,
  GuacamoleScreenshotButton,
} from 'client/components/Consoles'
import { useViews } from 'client/features/Auth'
import { StatusCircle } from 'client/components/Status'
import MultipleTags from 'client/components/MultipleTags'
import { getIps, getState } from 'client/models/VirtualMachine'
import { timeFromMilliseconds } from 'client/models/Helper'
import { PATH } from 'client/apps/sunstone/routes'
import { RESOURCE_NAMES } from 'client/constants'

/** @returns {ReactElement} Guacamole container */
const Guacamole = () => {
  const { id, type = '' } = useParams()
  const { push: redirectTo } = useHistory()
  const { view, [RESOURCE_NAMES.VM]: vmView } = useViews()

  const containerRef = useRef(null)
  const headerRef = useRef(null)

  const { data: vm, isLoading, isError } = useGetVmQuery(id)

  const ips = getIps(vm)
  const { color: stateColor, name: stateName } = getState(vm) ?? {}
  const time = timeFromMilliseconds(+vm?.ETIME || +vm?.STIME)

  const { token, clientState, displayElement, ...session } =
    useGuacamoleSession(
      useMemo(
        () => ({
          id: `${id}-${type}`,
          container: containerRef.current,
          header: headerRef.current,
        }),
        [
          containerRef.current?.offsetWidth,
          containerRef.current?.offsetHeight,
          headerRef.current?.offsetWidth,
          headerRef.current?.offsetHeight,
        ]
      ),
      GuacamoleDisplay,
      GuacamoleMouse,
      GuacamoleKeyboard,
      GuacamoleClipboard
    )

  useEffect(() => {
    const noAction = vmView?.actions?.[type] !== true

    // token should be saved after click on console button from datatable
    if (noAction || !token || isError) {
      redirectTo(PATH.DASHBOARD)
    }
  }, [view, token])

  return (
    <Box
      ref={containerRef}
      sx={{
        height: '100%',
        display: 'grid',
        gridTemplateRows: 'auto 1fr',
      }}
    >
      <Stack ref={headerRef}>
        <Stack direction="row" justifyContent="space-between" gap="1em" px={2}>
          <Typography
            flexGrow={1}
            display="flex"
            alignItems="center"
            gap="0.5em"
          >
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
        <Stack direction="row" alignItems="center" gap="1em" my="1em">
          <GuacamoleCtrlAltDelButton {...session} />
          <GuacamoleReconnectButton {...session} />
          <GuacamoleScreenshotButton {...session} />
          <GuacamoleFullScreenButton {...session} />
          {clientState?.connectionState && (
            <Typography>{`State: ${clientState?.connectionState}`}</Typography>
          )}
        </Stack>
      </Stack>
      {displayElement}
    </Box>
  )
}

export default Guacamole
