/* ------------------------------------------------------------------------- *
 * Copyright 2002-2026, OpenNebula Project, OpenNebula Systems               *
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

import { Box, Container, Stack } from '@mui/material'
import {
  ReactElement,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useHistory, useParams } from 'react-router'
import { useLocation } from 'react-router-dom'

import {
  ConsoleActionsSkeleton,
  ConsoleDisplaySkeleton,
  ConsoleHeaderSkeleton,
  HeaderVmInfo,
  SpiceActionButtons,
  SpiceDisplay,
} from '@ResourcesModule'
import { VmAPI, useGeneral, useGeneralApi, useViews } from '@FeaturesModule'
import { PATH, RESOURCE_NAMES } from '@ConstantsModule'
import { sentenceCase } from '@UtilsModule'

/** @returns {ReactElement} SPICE console container */
export const Spice = () => {
  const containerRef = useRef(null)
  const headerRef = useRef(null)
  const { id } = useParams()
  const location = useLocation()
  const { push: redirectTo } = useHistory()
  const { zone: selectedZone } = useGeneral()
  const { changeZone } = useGeneralApi()
  const { view, [RESOURCE_NAMES.VM]: vmView } = useViews()
  const [isZoneChanged, setIsZoneChanged] = useState(false)
  const [retry, setRetry] = useState(0)
  const [connection, setConnection] = useState({
    state: 'connecting',
    error: '',
  })
  const requestedZone = useMemo(
    () => new URLSearchParams(location.search).get('zone'),
    [location.search]
  )
  const isAvailableView = useMemo(
    () => view && Boolean(vmView?.actions?.spice),
    [view, vmView]
  )

  useEffect(() => {
    const selectRequestedZone = async () => {
      if (requestedZone && requestedZone !== selectedZone) {
        await changeZone(requestedZone)
      }
      setIsZoneChanged(true)
    }

    selectRequestedZone()
  }, [requestedZone, selectedZone, changeZone])

  const {
    data: vm,
    isError: vmInfoIsError,
    isFetching: isVmInfoFetching,
    isSuccess: isVmInfoSuccess,
  } = VmAPI.useGetVmQuery(
    { id },
    {
      refetchOnMountOrArgChange: true,
      skip: !id || !isAvailableView || !isZoneChanged,
    }
  )
  const isVmInfoReady = isVmInfoSuccess && !isVmInfoFetching
  const [createSession, sessionQuery] = VmAPI.useCreateSpiceSessionMutation()
  const {
    data: session,
    error: sessionError,
    isLoading: isSessionLoading,
  } = sessionQuery

  useEffect(() => {
    if (id && isVmInfoReady && isAvailableView && isZoneChanged) {
      createSession({ id })
    }
  }, [id, isVmInfoReady, isAvailableView, isZoneChanged, retry, createSession])

  useEffect(() => {
    if (vmInfoIsError || (view && !isAvailableView)) {
      redirectTo(PATH.DASHBOARD)
    }
  }, [vmInfoIsError, view, isAvailableView, redirectTo])

  const reconnect = useCallback(() => {
    sessionQuery.reset()
    setConnection({ state: 'connecting', error: '' })
    setRetry((current) => current + 1)
  }, [sessionQuery.reset])

  const connectionStatus =
    connection.state === 'error'
      ? 'error'
      : connection.state === 'connected'
      ? 'success'
      : 'default'
  const connectionState = sentenceCase(connection.state)
  const isSpiceReady = isVmInfoReady && Boolean(session)
  const hasConnectionError = Boolean(sessionError || connection.error)

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
        {vm ? (
          <HeaderVmInfo
            id={`${id}`}
            vm={vm}
            connectionState={connectionState}
            connectionStatus={connectionStatus}
            connectionType="SPICE"
          />
        ) : (
          <ConsoleHeaderSkeleton />
        )}
        <Stack
          direction={{ sm: 'row', md: 'column' }}
          alignItems={{ sm: 'center', md: 'end' }}
          flexGrow={{ sm: 1, md: 0 }}
          flexWrap="wrap"
          gap="1em"
        >
          {isSpiceReady || hasConnectionError ? (
            <SpiceActionButtons
              id={`${id}-spice`}
              handleReconnect={reconnect}
              isLoading={isSessionLoading}
            />
          ) : (
            <ConsoleActionsSkeleton widths={[36]} />
          )}
        </Stack>
      </Stack>
      <Box sx={{ position: 'relative', minHeight: 0 }}>
        {session ? (
          <SpiceDisplay
            key={session.websocket}
            session={session}
            onStatusChange={setConnection}
          />
        ) : (
          <ConsoleDisplaySkeleton />
        )}
      </Box>
    </Box>
  )
}
