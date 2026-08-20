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
import { ReactElement, useEffect, useMemo, useRef, useState } from 'react'
import { useHistory, useParams } from 'react-router'
import { useLocation } from 'react-router-dom'
import { SkeletonLoading } from '@ComponentsModule'

import {
  GuacamoleActionButtons,
  GuacamoleClipboard,
  GuacamoleDisplay,
  GuacamoleKeyboard,
  GuacamoleMouse,
  HeaderVmInfo,
  useGuacamoleSession,
} from '@ResourcesModule'

import { VmAPI, useGeneral, useGeneralApi, useViews } from '@FeaturesModule'

import { RESOURCE_NAMES, PATH } from '@ConstantsModule'
import { sentenceCase } from '@UtilsModule'

const HeaderVmInfoSkeleton = () => (
  <Stack direction="row" alignItems="center" gap="0.75em" flexGrow={1}>
    <SkeletonLoading loading variant="rounded" width={38} height={38} />
    <Stack gap="0.35em" minWidth={0} flexGrow={1}>
      <SkeletonLoading loading height={30} width={{ xs: '100%', sm: '60%' }} />
      <SkeletonLoading loading height={16} width={{ xs: '80%', sm: '35%' }} />
    </Stack>
  </Stack>
)

const GuacamoleActionsSkeleton = () => (
  <Stack direction="row" alignItems="center" gap="0.5em" flexWrap="wrap">
    <SkeletonLoading loading variant="rounded" width={74} height={34} />
    <SkeletonLoading loading variant="rounded" width={112} height={34} />
    <SkeletonLoading loading variant="rounded" width={36} height={34} />
  </Stack>
)

const GuacamoleDisplaySkeleton = () => (
  <Box
    sx={{
      width: '100%',
      height: '100%',
      minHeight: '16rem',
      display: 'flex',
    }}
  >
    <SkeletonLoading
      loading
      variant="rounded"
      width="100%"
      height="100%"
      borderRadius="xlg"
    />
  </Box>
)

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
    () => view && Boolean(vmView?.actions?.[type]),
    [type, view, vmView]
  )

  const paramsGetGuacamoleSession = { id, type }

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

  const { isError: queryIsError, data } = VmAPI.useGetGuacamoleSessionQuery(
    paramsGetGuacamoleSession,
    {
      refetchOnMountOrArgChange: false,
      skip: !id || !isAvailableView || !isZoneChanged || !isVmInfoReady,
    }
  )

  const isGuacamoleReady = isVmInfoReady && Boolean(data)

  useEffect(() => {
    ;(queryIsError || vmInfoIsError || (view && !isAvailableView)) &&
      redirectTo(PATH.DASHBOARD)
  }, [queryIsError, vmInfoIsError, view, isAvailableView, redirectTo])

  const guacamoleOption = useMemo(
    () => ({
      type,
      vmID: id,
      id: `${id}-${type}`,
      container: containerRef.current,
      header: headerRef.current,
      zone: selectedZone,
      externalZone: `${selectedZone}` !== `${defaultZone}`,
      isReady: isGuacamoleReady,
    }),
    [
      selectedZone,
      isGuacamoleReady,
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

  const connectionStatus = useMemo(
    () => (isError ? 'error' : isConnected ? 'success' : 'default'),
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
        {vm ? (
          <HeaderVmInfo
            {...paramsGetGuacamoleSession}
            vm={vm}
            connectionState={connectionState}
            connectionStatus={connectionStatus}
          />
        ) : (
          <HeaderVmInfoSkeleton />
        )}
        <Stack
          direction={{ sm: 'row', md: 'column' }}
          alignItems={{ sm: 'center', md: 'end' }}
          flexGrow={{ sm: 1, md: 0 }}
          flexWrap="wrap"
          gap="1em"
        >
          {isGuacamoleReady && (
            <GuacamoleActionButtons {...session} typeConnection={type} />
          )}
          {!isGuacamoleReady && <GuacamoleActionsSkeleton />}
        </Stack>
      </Stack>
      {isGuacamoleReady ? displayElement : <GuacamoleDisplaySkeleton />}
    </Box>
  )
}
