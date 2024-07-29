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
import { ReactElement, useMemo, useRef, useEffect } from 'react'
import { useParams, useHistory } from 'react-router'
import { Box, Stack, Container, Typography } from '@mui/material'

import { useViews } from 'client/features/Auth'
import { useGetGuacamoleSessionQuery } from 'client/features/OneApi/vm'

import {
  HeaderVmInfo,
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
import { GuacamoleLogo } from 'client/components/Icons'
import { PATH } from 'client/apps/sunstone/routes'
import { Tr } from 'client/components/HOC'
import { sentenceCase } from 'client/utils'
import { RESOURCE_NAMES, T } from 'client/constants'

/** @returns {ReactElement} Guacamole container */
const Guacamole = () => {
  const containerRef = useRef(null)
  const headerRef = useRef(null)

  const { id, type = '' } = useParams()
  const { push: redirectTo } = useHistory()
  const { view, [RESOURCE_NAMES.VM]: vmView } = useViews()

  const isAvailableView = useMemo(
    () => view && !!vmView?.actions?.[type] === true,
    [view]
  )

  const { isError: queryIsError } = useGetGuacamoleSessionQuery(
    { id, type },
    { refetchOnMountOrArgChange: false, skip: !isAvailableView }
  )

  useEffect(() => {
    ;(queryIsError || !isAvailableView) && redirectTo(PATH.DASHBOARD)
  }, [queryIsError])

  const {
    token,
    clientState,
    displayElement,
    isError,
    isConnected,
    ...session
  } = useGuacamoleSession(
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

  const colorStatus = useMemo(
    () =>
      isError ? 'error.main' : isConnected ? 'success.main' : 'text.secondary',
    [isError, isConnected]
  )

  const connectionState = useMemo(
    () => sentenceCase(clientState?.connectionState ?? ''),
    [clientState?.connectionState]
  )

  return (
    <Box
      ref={containerRef}
      sx={{
        height: '100%',
        display: 'grid',
        gridTemplateRows: 'auto 1fr',
        gap: '1em',
      }}
    >
      <Stack
        ref={headerRef}
        component={Container}
        direction={{ sm: 'column', md: 'row' }}
        alignItems="stretch"
        justifyContent="space-between"
        gap="1em"
        padding="1em"
      >
        <HeaderVmInfo id={id} type={type} />
        <Stack
          direction={{ sm: 'row', md: 'column' }}
          alignItems={{ sm: 'center', md: 'end' }}
          flexGrow={{ sm: 1, md: 0 }}
          flexWrap="wrap"
          gap="1em"
        >
          {connectionState && (
            <Stack
              title={`${Tr(T.GuacamoleState)}: ${connectionState}`}
              flexGrow={1}
              direction={{ sm: 'row-reverse', md: 'row' }}
              justifyContent="flex-end"
              alignItems="flex-end"
              gap="1em"
            >
              <Typography color={colorStatus} data-cy="state">
                {connectionState}
              </Typography>
              <GuacamoleLogo />
            </Stack>
          )}
          <Stack direction="row" alignItems="center" gap="1em">
            <GuacamoleReconnectButton {...session} />
            <GuacamoleScreenshotButton {...session} />
            <GuacamoleFullScreenButton {...session} />
            <GuacamoleCtrlAltDelButton {...session} />
          </Stack>
        </Stack>
      </Stack>
      {displayElement}
    </Box>
  )
}

export default Guacamole
