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
import { Box, Stack, Typography } from '@mui/material'
import { RESOURCE_NAMES } from 'client/constants'
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
import { PATH } from 'client/apps/sunstone/routes'

/** @returns {ReactElement} Guacamole container */
const Guacamole = () => {
  const { id, type = '' } = useParams()
  const { push: redirectTo } = useHistory()
  const { view, [RESOURCE_NAMES.VM]: vmView } = useViews()

  const isAvailableView = useMemo(
    () => view && vmView?.actions?.[type] === true,
    [view]
  )

  const { isError } = useGetGuacamoleSessionQuery(
    { id, type },
    { refetchOnMountOrArgChange: false, skip: !isAvailableView }
  )

  useEffect(() => {
    ;(isError || !isAvailableView) && redirectTo(PATH.DASHBOARD)
  }, [isError])

  const containerRef = useRef(null)
  const headerRef = useRef(null)

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
        <HeaderVmInfo id={id} type={type} />
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
