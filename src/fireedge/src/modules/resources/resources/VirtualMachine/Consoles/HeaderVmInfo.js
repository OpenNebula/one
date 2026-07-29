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
import { Box } from '@mui/material'
import { ReactElement, useEffect, useMemo } from 'react'
import { useHistory } from 'react-router'

import { DEFAULT_IMAGE, STATIC_FILES_URL, T, PATH } from '@ConstantsModule'
import { ServiceAPI, VmAPI, useGeneralApi } from '@FeaturesModule'
import { getIpv4s, getVirtualMachineState } from '@ModelsModule'
import { timeFromMilliseconds } from '@UtilsModule'
import { useTranslation } from '@ProvidersModule'
import { useClipboard } from '@HooksModule'
import { Badge, Tag, Tooltip } from '@ComponentsV2Module'
import { Check as CopiedIcon, Copy as CopyIcon } from 'iconoir-react'

import { OpenNebulaLogo } from '@modules/resources/Icons'
import PropTypes from 'prop-types'

const getHeaderInfoStyles = ({ theme }) => {
  const captionTypography = {
    color: 'text.body',
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: 400,
    fontSize: {
      xs: theme.fontSize.body.caption.mobile,
      sm: theme.fontSize.body.caption.tablet,
      md: theme.fontSize.body.caption.desktop,
    },
    lineHeight: {
      xs: theme.lineHeight.body.caption.mobile,
      sm: theme.lineHeight.body.caption.tablet,
      md: theme.lineHeight.body.caption.desktop,
    },
  }

  return {
    display: 'flex',
    flexDirection: 'row',
    flex: '1 0 0',
    justifyContent: 'center',
    alignItems: 'flex-start',
    minWidth: 0,

    '& .info-container': {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'flex-start',
      alignSelf: 'stretch',
      gap: `${theme.scale?.[100] ?? 4}px`,
      flex: '1 0 0',
      minWidth: 0,

      fontSize: {
        xs: theme.fontSize.body.sm.mobile,
        sm: theme.fontSize.body.sm.tablet,
        md: theme.fontSize.body.sm.desktop,
      },
      fontWeight: {
        xs: theme.fontWeight.body.sm.mobile,
        sm: theme.fontWeight.body.sm.tablet,
        md: theme.fontWeight.body.sm.desktop,
      },
      lineHeight: {
        xs: theme.lineHeight.body.sm.mobile,
        sm: theme.lineHeight.body.sm.tablet,
        md: theme.lineHeight.body.sm.desktop,
      },
    },

    '& .info-header': {
      display: 'flex',
      alignItems: 'center',
      gap: `${theme.scale?.[100] ?? 4}px`,
      minWidth: 0,

      '& .icon-container': {
        width: '40px',
        height: '40px',
        padding: '4px',
        flexShrink: 0,
        borderRadius: `${theme.borderRadius.xlg}px`,
        border: `${theme.borderWidth.sm}px solid ${theme.palette.border.primary}`,

        '& .info-icon': {
          width: '100%',
          height: '100%',
          aspectRatio: '1/1',
        },
      },

      '& .info-title, .info-id': {
        color: 'text.headings',
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: 700,
        fontSize: {
          xs: theme.fontSize.heading.h5.mobile,
          sm: theme.fontSize.heading.h5.tablet,
          md: theme.fontSize.heading.h5.desktop,
        },
        lineHeight: {
          xs: theme.lineHeight.heading.h5.mobile,
          sm: theme.lineHeight.heading.h5.tablet,
          md: theme.lineHeight.heading.h5.desktop,
        },
      },

      '& .info-id': {
        color: 'text.onDisabled',
      },
    },

    '& .info-ownership': {
      display: 'flex',
      gap: `${theme.scale?.[100] ?? 4}px`,
      alignItems: 'center',
      alignSelf: 'stretch',

      '& .region-label': {
        display: 'flex',
        gap: `${theme.scale?.[50] ?? 2}px`,

        '& .region-label--title, & .region-label--value': {
          ...captionTypography,
        },

        '& .region-label--title': {
          '&:not(:only-child)::after': {
            content: '":"',
          },
        },
      },
    },
  }
}

/**
 * @param {object} props - Props
 * @param {string} props.id - VM id
 * @param {object} props.vm - VM information
 * @param {string} props.connectionState - Guacamole connection state
 * @param {string} props.connectionStatus - Guacamole connection status
 * @returns {ReactElement} Header VM information for remote consoles
 */
const HeaderVmInfo = ({
  id,
  vm: vmData,
  connectionState = '',
  connectionStatus = 'default',
}) => {
  const { translate } = useTranslation()
  const { push: redirectTo } = useHistory()
  const { enqueueError } = useGeneralApi()
  const { copy, isCopied } = useClipboard()

  const {
    data: queryVm,
    isSuccess: queryIsSuccess,
    isError,
  } = VmAPI.useGetVmQuery(
    { id },
    {
      skip: Boolean(vmData) || !id,
    }
  )
  const [getService, { data: serviceFlow }] =
    ServiceAPI.useLazyGetServiceQuery()

  const vm = vmData ?? queryVm
  const isSuccess = Boolean(vmData) || queryIsSuccess
  const ips = getIpv4s(vm)
  const { name: stateName, displayName: stateDisplayName } =
    getVirtualMachineState(vm) ?? {}
  const timeValue = +vm?.REGTIME || +vm?.ETIME || +vm?.STIME
  const time = timeValue ? timeFromMilliseconds(timeValue) : undefined
  const serviceId = useMemo(() => vm?.USER_TEMPLATE?.SERVICE_ID, [vm])
  const srcLogo = useMemo(() => vm?.USER_TEMPLATE?.LOGO?.toLowerCase(), [vm])

  useEffect(() => {
    serviceId !== undefined && getService({ id: serviceId })
  }, [serviceId])

  useEffect(() => {
    isError && redirectTo(PATH.DASHBOARD)
  }, [isError])

  useEffect(() => {
    if (!isSuccess && vm) {
      enqueueError(T.ErrorVmNoLocatedVenter, [vm.ID, vm.NAME])
      redirectTo(PATH.DASHBOARD)
    }
  }, [isSuccess])

  if (!vm) return null

  const logo = srcLogo && `${STATIC_FILES_URL}/${srcLogo}`

  return (
    <Box sx={(theme) => getHeaderInfoStyles({ theme })}>
      <Box className="info-container">
        <Box className="info-header">
          <Tooltip title={stateDisplayName ?? stateName}>
            <Box className="icon-container" sx={{ flexShrink: 0 }}>
              {logo ? (
                <img
                  className="info-icon"
                  src={logo}
                  alt=""
                  onError={(e) => {
                    e.target.onerror = null
                    e.target.src = DEFAULT_IMAGE
                  }}
                />
              ) : (
                <OpenNebulaLogo width={32} height={32} disabledBetaText />
              )}
            </Box>
          </Tooltip>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: '2px',
              minWidth: 0,
            }}
          >
            {serviceFlow?.NAME && (
              <Box
                component="span"
                sx={(theme) => ({
                  alignSelf: 'flex-start',
                  px: `${theme.scale?.[100] ?? 4}px`,
                  py: `${theme.scale?.[25] ?? 1}px`,
                  borderRadius: `${theme.borderRadius?.sm ?? 4}px`,
                  bgcolor: 'surface.action',
                  color: 'text.onAction',
                  fontSize: theme.fontSize?.body?.caption?.desktop,
                  fontWeight: 600,
                  lineHeight: 1,
                })}
              >
                {serviceFlow?.NAME}
              </Box>
            )}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                flexWrap: 'wrap',
                columnGap: '0.35em',
                rowGap: '0.25em',
                minWidth: 0,
              }}
            >
              <Box
                className="info-title"
                data-cy="name"
                sx={{
                  maxWidth: { xs: '54vw', md: '34vw' },
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {vm?.NAME}
              </Box>
              <Box className="info-id" data-cy="id">
                {`#${vm?.ID}`}
              </Box>
              {connectionState && (
                <Tag
                  status={connectionStatus}
                  title={connectionState}
                  startIcon={<Badge status={connectionStatus} type="dot" />}
                />
              )}
              {connectionState && (
                <Tag status="information" title="Guacamole" />
              )}
            </Box>
          </Box>
        </Box>
        {time && (
          <Box className="info-ownership">
            <Box className="region-label">
              <span className="region-label--title">
                {translate(T.Registered)}
              </span>
              <span className="region-label--value">{time.toFormat('ff')}</span>
            </Box>
          </Box>
        )}
        {!!ips?.length && (
          <Box
            data-cy="ips"
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '4px',
              minWidth: 0,
            }}
          >
            {ips.map((ip) => (
              <Tag
                key={ip}
                title={ip}
                endIcon={isCopied(ip) ? <CopiedIcon /> : <CopyIcon />}
                onClick={() => copy(ip)}
              />
            ))}
          </Box>
        )}
      </Box>
    </Box>
  )
}

HeaderVmInfo.propTypes = {
  id: PropTypes.string.isRequired,
  vm: PropTypes.object,
  connectionState: PropTypes.string,
  connectionStatus: PropTypes.string,
}

HeaderVmInfo.displayName = 'HeaderVmInfo'

export default HeaderVmInfo
