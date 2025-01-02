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
import { Avatar, Divider, Skeleton, Stack, Typography } from '@mui/material'
import PropTypes from 'prop-types'
import { ReactElement, useEffect, useMemo } from 'react'
import { useHistory } from 'react-router'

import { PATH } from '@modules/components'
import { Translate, TranslateProvider } from '@modules/components/HOC'
import { OpenNebulaLogo } from '@modules/components/Icons'
import MultipleTags from '@modules/components/MultipleTags'
import { StatusBadge } from '@modules/components/Status'
import { STATIC_FILES_URL, T, VM_ACTIONS } from '@ConstantsModule'
import { useGeneralApi, ServiceAPI, VmAPI } from '@FeaturesModule'
import {
  timeFromMilliseconds,
  getIps,
  getState,
  isVCenter,
} from '@ModelsModule'

/**
 * @param {object} props - Props
 * @param {string} props.id - VM id
 * @param {'vnc'|'ssh'|'rdp'|'vmrc'} props.type - Connection type
 * @returns {ReactElement} Header VM information for remote consoles
 */
const HeaderVmInfo = ({ id, type }) => {
  const { push: redirectTo } = useHistory()
  const { enqueueError } = useGeneralApi()

  const {
    data: vm,
    isSuccess,
    isLoading,
    isError,
  } = VmAPI.useGetVmQuery({ id })
  const [getService, { data: serviceFlow }] =
    ServiceAPI.useLazyGetServiceQuery()

  const ips = getIps(vm)
  const {
    color: stateColor,
    name: stateName,
    displayName: stateDisplayName,
  } = getState(vm) ?? {}
  const time = timeFromMilliseconds(+vm?.ETIME || +vm?.STIME)
  const isVMRC = useMemo(() => type === VM_ACTIONS.VMRC, [type])
  const serviceId = useMemo(() => vm?.USER_TEMPLATE?.SERVICE_ID, [vm])
  const srcLogo = useMemo(() => vm?.USER_TEMPLATE?.LOGO?.toLowerCase(), [vm])

  useEffect(() => {
    serviceId !== undefined && getService({ id: serviceId })
  }, [serviceId])

  useEffect(() => {
    isError && redirectTo(PATH.DASHBOARD)
  }, [isError])

  useEffect(() => {
    if (isVMRC && isSuccess && vm && !isVCenter(vm)) {
      enqueueError(T.ErrorVmNoLocatedVenter, [vm.ID, vm.NAME])
      redirectTo(PATH.DASHBOARD)
    }
  }, [isVMRC, isSuccess])

  return (
    <TranslateProvider>
      <Stack
        justifyContent="space-between"
        flexGrow={1}
        flexWrap="wrap"
        gap="1em"
      >
        <Stack direction="row" alignItems="flex-end" gap="0.5em">
          {isLoading ? (
            <>
              <Skeleton variant="circular" width={24} height={24} />
              <Skeleton height={30} sx={{ width: { xs: '100%', sm: '60%' } }} />
            </>
          ) : (
            <>
              <StatusBadge
                title={stateDisplayName ?? stateName}
                stateColor={stateColor}
              >
                {srcLogo ? (
                  <Avatar src={`${STATIC_FILES_URL}/${srcLogo}`} />
                ) : (
                  <OpenNebulaLogo width={38} height={38} disabledBetaText />
                )}
              </StatusBadge>
              <Typography noWrap component="span" variant="h6" data-cy="name">
                {vm?.NAME}
              </Typography>
              {serviceFlow && (
                <Typography noWrap component="span">
                  <Translate word={T.PartOf} />
                  {`: ${serviceFlow?.NAME}`}
                </Typography>
              )}
            </>
          )}
        </Stack>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          gap="0.5em"
          alignItems="baseline"
          divider={<Divider orientation="vertical" flexItem />}
        >
          {isLoading ? (
            <Skeleton
              variant="text"
              sx={{ width: { xs: '100%', sm: '50%', md: '25%' } }}
            />
          ) : (
            <>
              <Typography
                noWrap
                component="span"
                variant="body1"
                color="text.secondary"
                data-cy="id"
              >
                {`# ${vm?.ID}`}
              </Typography>
              <Typography noWrap variant="body1">
                <Translate
                  word={T.StartedOnTime}
                  values={[time.toFormat('ff')]}
                />
              </Typography>
            </>
          )}
          {isLoading ? (
            <Skeleton
              variant="text"
              sx={{ width: { xs: '100%', sm: '50%', md: '25%' } }}
            />
          ) : (
            !!ips?.length && (
              <Typography data-cy="ips">
                <MultipleTags tags={ips} clipboard />
              </Typography>
            )
          )}
        </Stack>
      </Stack>
    </TranslateProvider>
  )
}

HeaderVmInfo.propTypes = {
  id: PropTypes.string,
  type: PropTypes.oneOf(['vnc', 'ssh', 'rdp', 'vmrc']),
}

export default HeaderVmInfo
