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
import { Box, Container, Stack, Typography } from '@mui/material'
import { ReactElement, useEffect, useMemo, useRef, useState } from 'react'
import { useHistory, useParams } from 'react-router'
import { useLocation } from 'react-router-dom'

import {
  GuacamoleClipboard,
  GuacamoleCtrlAltDelButton,
  GuacamoleDisplay,
  GuacamoleDownloadConButton,
  GuacamoleFullScreenButton,
  GuacamoleKeyboard,
  GuacamoleLogo,
  GuacamoleMouse,
  GuacamoleReconnectButton,
  GuacamoleReconnectReadOnlyButton,
  GuacamoleSSHParams,
  GuacamoleScreenshotButton,
  HeaderVmInfo,
  PATH,
  Tr,
  TranslateProvider,
  useGuacamoleSession,
} from '@ComponentsModule'

import { VmAPI, useGeneral, useGeneralApi, useViews } from '@FeaturesModule'

import { RESOURCE_NAMES, T, VM_ACTIONS } from '@ConstantsModule'
import { sentenceCase } from '@UtilsModule'

/** @returns {ReactElement} Guacamole container */
export const Guacamole = () => {
  // set default zone for request
  const [isZoneChanged, setIsZoneChanged] = useState(false)

  const location = useLocation()
  const searchParams = new URLSearchParams(location.search)
  const zone = searchParams.get('zone')

  const { zone: selectedZone, defaultZone } = useGeneral()
  const { changeZone } = useGeneralApi()

  useEffect(() => {
    const handleChangeZone = async () => {
      if (zone && zone !== selectedZone) {
        await changeZone(zone)
      }
      setIsZoneChanged(true)
    }

    handleChangeZone()
  }, [zone, selectedZone, changeZone])

  const containerRef = useRef(null)
  const headerRef = useRef(null)

  const { id, type = '' } = useParams()
  const { push: redirectTo } = useHistory()
  const { view, [RESOURCE_NAMES.VM]: vmView } = useViews()

  const isAvailableView = useMemo(
    () => view && !!vmView?.actions?.[type] === true,
    [view]
  )

  const paramsGetGuacamoleSession = { id, type }

  const { isError: queryIsError, data } = VmAPI.useGetGuacamoleSessionQuery(
    paramsGetGuacamoleSession,
    {
      refetchOnMountOrArgChange: false,
      skip: !isAvailableView && !isZoneChanged,
    }
  )

  useEffect(() => {
    ;(queryIsError || !isAvailableView) && redirectTo(PATH.DASHBOARD)
  }, [queryIsError])

  const guacamoleOption = useMemo(
    () => ({
      type,
      vmID: id,
      id: `${id}-${type}`,
      container: containerRef.current,
      header: headerRef.current,
      zone: selectedZone,
      externalZone: `${selectedZone}` !== `${defaultZone}`,
    }),
    [
      selectedZone,
      containerRef.current?.offsetWidth,
      containerRef.current?.offsetHeight,
      headerRef.current?.offsetWidth,
      headerRef.current?.offsetHeight,
    ]
  )

  const {
    token,
    clientState,
    displayElement,
    isError,
    isConnected,
    ...session
  } = useGuacamoleSession(
    guacamoleOption,
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
    <TranslateProvider>
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
          {data && <HeaderVmInfo {...paramsGetGuacamoleSession} />}
          <Stack
            direction={{ sm: 'row', md: 'column' }}
            alignItems={{ sm: 'center', md: 'end' }}
            flexGrow={{ sm: 1, md: 0 }}
            flexWrap="wrap"
            gap="1em"
          >
            {data && connectionState && (
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
            {data && (
              <Stack direction="row" alignItems="center" gap="1em">
                {type === VM_ACTIONS.VNC && (
                  <GuacamoleReconnectReadOnlyButton {...session} />
                )}
                {type === VM_ACTIONS.SSH && <GuacamoleSSHParams {...session} />}
                {[VM_ACTIONS.VNC, VM_ACTIONS.RDP].includes(type) && (
                  <GuacamoleDownloadConButton
                    {...session}
                    typeConnection={type}
                  />
                )}
                <GuacamoleReconnectButton {...session} />
                <GuacamoleScreenshotButton {...session} />
                <GuacamoleFullScreenButton {...session} />
                <GuacamoleCtrlAltDelButton {...session} />
              </Stack>
            )}
          </Stack>
        </Stack>
        {data && displayElement}
      </Box>
    </TranslateProvider>
  )
}
