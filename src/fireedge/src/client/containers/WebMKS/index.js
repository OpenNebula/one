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
import { ReactElement, useEffect, useMemo } from 'react'
import { useHistory, useParams } from 'react-router'
import { Box, Stack, Typography, Container } from '@mui/material'

import { useViews } from 'client/features/Auth'
import { useGetVMRCSessionQuery } from 'client/features/OneApi/vcenter'
import {
  HeaderVmInfo,
  useWebMKSSession,
  // WebMKSKeyboard,
  WebMKSCtrlAltDelButton,
  WebMKSFullScreenButton,
} from 'client/components/Consoles'
import { WebMKSLogo } from 'client/components/Icons'
import { PATH } from 'client/apps/sunstone/routes'
import { Tr } from 'client/components/HOC'
import { sentenceCase } from 'client/utils'
import { RESOURCE_NAMES, T, VM_ACTIONS } from 'client/constants'

/** @returns {ReactElement} WebMKS container */
const WebMKS = () => {
  const { id } = useParams()
  const { push: redirectTo } = useHistory()
  const { view, [RESOURCE_NAMES.VM]: vmView } = useViews()
  const isAvailableView = useMemo(
    () => view && vmView?.actions?.[VM_ACTIONS.VMRC] === true,
    [view]
  )

  const { data: ticket, isError: queryIsError } = useGetVMRCSessionQuery(
    { id },
    { refetchOnMountOrArgChange: false, skip: !isAvailableView }
  )

  useEffect(() => {
    ;(queryIsError || !isAvailableView) && redirectTo(PATH.DASHBOARD)
  }, [queryIsError])

  const { ...session } = useWebMKSSession({ token: ticket })
  const { status, isError, isConnected, displayElement } = session

  const colorStatus = useMemo(
    () =>
      isError ? 'error.main' : isConnected ? 'success.main' : 'text.secondary',
    [isError, isConnected]
  )

  const connectionState = useMemo(() => sentenceCase(status ?? ''), [status])

  return (
    <Box
      sx={{
        height: '100%',
        display: 'grid',
        gridTemplateRows: 'auto 1fr',
        gap: '1em',
      }}
    >
      <Stack
        component={Container}
        direction={{ sm: 'column', md: 'row' }}
        alignItems="stretch"
        justifyContent="space-between"
        gap="1em"
        padding="1em"
      >
        <HeaderVmInfo id={id} type={VM_ACTIONS.VMRC} />
        <Stack
          direction={{ sm: 'row', md: 'column' }}
          alignItems={{ sm: 'center', md: 'end' }}
          flexGrow={{ sm: 1, md: 0 }}
          flexWrap="wrap"
          gap="1em"
        >
          {connectionState && (
            <Stack
              title={`${Tr(T.VMRCState)}: ${connectionState}`}
              flexGrow={1}
              direction={{ sm: 'row-reverse', md: 'row' }}
              justifyContent="flex-end"
              alignItems="flex-end"
              gap="1em"
            >
              <Typography color={colorStatus} data-cy="state">
                {connectionState}
              </Typography>
              <WebMKSLogo />
            </Stack>
          )}
          <Stack direction="row" alignItems="center" gap="1em">
            <WebMKSFullScreenButton {...session} />
            <WebMKSCtrlAltDelButton {...session} />
            {/* <WebMKSKeyboard {...session} /> */}
          </Stack>
        </Stack>
      </Stack>
      {displayElement}
    </Box>
  )
}

export default WebMKS
