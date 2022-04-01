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
import { ReactElement, useEffect, useMemo } from 'react'
import { useHistory, useParams } from 'react-router'
import { Box, Stack, Typography } from '@mui/material'
import { RESOURCE_NAMES, VM_ACTIONS } from 'client/constants'
import { useViews } from 'client/features/Auth'

import { useGetVMRCSessionQuery } from 'client/features/OneApi/vcenter'
import {
  HeaderVmInfo,
  useWebMKSSession,
  // WebMKSKeyboard,
  WebMKSCtrlAltDelButton,
  WebMKSFullScreenButton,
} from 'client/components/Consoles'
import { PATH } from 'client/apps/sunstone/routes'
import { sentenceCase } from 'client/utils'

/** @returns {ReactElement} WebMKS container */
const WebMKS = () => {
  const { id } = useParams()
  const { push: redirectTo } = useHistory()
  const { view, [RESOURCE_NAMES.VM]: vmView } = useViews()
  const isAvailableView = useMemo(
    () => view && vmView?.actions?.[VM_ACTIONS.VMRC] === true,
    [view]
  )

  const { data: ticket, isError } = useGetVMRCSessionQuery(
    { id },
    { refetchOnMountOrArgChange: false, skip: !isAvailableView }
  )

  useEffect(() => {
    ;(isError || !isAvailableView) && redirectTo(PATH.DASHBOARD)
  }, [isError])

  const { ...session } = useWebMKSSession({ token: ticket })
  const { status, displayElement } = session

  return (
    <Box display="grid" gridTemplateRows="auto 1fr" width={1} height={1}>
      <Stack>
        <HeaderVmInfo id={id} type={VM_ACTIONS.VMRC} />
        <Stack direction="row" alignItems="center" gap="1em" my="1em">
          <WebMKSCtrlAltDelButton {...session} />
          <WebMKSFullScreenButton {...session} />
          {/* <WebMKSKeyboard {...session} /> */}
          <Typography>{sentenceCase(status)}</Typography>
        </Stack>
      </Stack>
      {displayElement}
    </Box>
  )
}

export default WebMKS
