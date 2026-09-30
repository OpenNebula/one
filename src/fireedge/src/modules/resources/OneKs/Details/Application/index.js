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

import PropTypes from 'prop-types'
import { ReactElement } from 'react'
import { useTheme } from '@mui/material'
import { Cancel, RefreshDouble, Trash } from 'iconoir-react'
import {
  DetailsDrawer as ResourceDetailsDrawer,
  InfoSlot,
  StatusTag,
  SummarySlot,
  Tag,
  ToggleGroup,
} from '@ComponentsModule'
import { T } from '@ConstantsModule'
import { getApplicationImage, getApplicationStateColor } from '@ModelsModule'
import { ApplicationImagePlaceholder } from '@modules/resources/OneKs/ApplicationImagePlaceholder'
import { ApplicationTabs } from '@modules/resources/OneKs/Details/Application/Tabs'

/**
 * Displays an installed application release in the cluster detail stack.
 *
 * @param {object} props - Drawer props
 * @param {object} props.application - Installed application
 * @param {boolean} props.isOpen - Whether the drawer is open
 * @param {boolean} props.isFetching - Whether details are loading
 * @param {boolean} props.isError - Whether fetching failed
 * @param {boolean} props.isUninstalling - Whether uninstall is running
 * @param {Function} props.onRefresh - Refresh details
 * @param {Function} props.onUninstall - Uninstall application
 * @param {Function} props.onClose - Close drawer
 * @returns {ReactElement} Application detail drawer
 */
export const Application = ({
  application = {},
  isOpen = false,
  isFetching = false,
  isError = false,
  isUninstalling = false,
  onRefresh,
  onUninstall,
  onClose,
}) => {
  const { palette } = useTheme()
  const releaseName = application?.release_name
  const applicationName = application?.metadata?.name
  const version = application?.version ?? '-'
  const resourceVersion = application?.resource_version
  const hasRelease = Boolean(application?.cluster_id && releaseName)

  return (
    <ResourceDetailsDrawer
      isOpen={isOpen}
      isLoading={isFetching}
      slots={[
        [
          InfoSlot,
          {
            title: applicationName ?? releaseName,
            id: applicationName ? releaseName : undefined,
            icon: getApplicationImage(application),
            iconFallback: <ApplicationImagePlaceholder />,
            labels: application?.id ? [[T.ID, application.id]] : [],
            dataCy: 'oneks-application-details',
            Toolbar: () => (
              <ToggleGroup
                size="medium"
                options={[
                  [
                    {
                      startIcon: <RefreshDouble width="16px" height="16px" />,
                      onClick: onRefresh,
                      value: 'refresh',
                      tooltip: T.Refresh,
                      isDisabled: !hasRelease || isFetching || isUninstalling,
                    },
                  ],
                  [
                    {
                      startIcon: (
                        <Trash
                          width="16px"
                          height="16px"
                          style={{
                            color: isUninstalling
                              ? palette.text.disabled
                              : palette.icon.error,
                          }}
                        />
                      ),
                      onClick: onUninstall,
                      value: 'uninstall',
                      title: T.Uninstall,
                      isDestructive: true,
                      isDisabled: !hasRelease || isUninstalling,
                    },
                    {
                      startIcon: <Cancel width="16px" height="16px" />,
                      onClick: onClose,
                      value: 'close',
                      tooltip: T.Close,
                    },
                  ],
                ]}
              />
            ),
          },
          (theme) => ({
            '&& .info-header .icon-container': {
              width: theme.scale[700],
              height: theme.scale[700],
              padding: 0,
              border: 0,
            },
            '&& .info-header .icon-container .avatar-image': {
              padding: 0,
              border: 0,
            },
          }),
        ],
        [
          SummarySlot,
          {
            labels: [
              [
                application?.state ? (
                  <StatusTag
                    key="application-state"
                    statusColor={getApplicationStateColor(application.state)}
                    statusName={application.state}
                  />
                ) : (
                  '-'
                ),
                T.State,
              ],
              [<Tag key="application-version" title={version} />, T.Version],
              [resourceVersion ?? '-', T.ResourceVersion],
            ],
          },
        ],
        [
          ApplicationTabs,
          { application, isError },
          { flex: '1 1 0', minHeight: 0 },
        ],
      ]}
    />
  )
}

Application.displayName = 'Application'
Application.propTypes = {
  application: PropTypes.object,
  isOpen: PropTypes.bool,
  isFetching: PropTypes.bool,
  isError: PropTypes.bool,
  isUninstalling: PropTypes.bool,
  onRefresh: PropTypes.func,
  onUninstall: PropTypes.func,
  onClose: PropTypes.func,
}
