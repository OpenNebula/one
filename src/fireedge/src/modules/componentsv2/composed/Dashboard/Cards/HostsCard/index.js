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
import PropTypes from 'prop-types'
import { Component, forwardRef } from 'react'

import { DashboardCard } from '@modules/componentsv2/composed/Dashboard/Card'
import { getStyles } from '@modules/componentsv2/composed/Dashboard/Cards/HostsCard/styles'
import { StatusTag } from '@modules/componentsv2/composed/Status/Tag'
import { Button } from '@modules/componentsv2/primitives/Buttons/Default'
import { SkeletonLoading } from '@modules/componentsv2/primitives/Loaders'
import { ProgressBar } from '@modules/componentsv2/primitives/Progress/Bar'
import { Text } from '@modules/componentsv2/primitives/Text/Default'
import { T, TEXT_VARIANTS, TEXT_WEIGHTS } from '@ConstantsModule'

const DEFAULT_SKELETON_ROWS = 2
const HOST_METRICS = ['cpu', 'memory']

/**
 * Loading placeholder that preserves the layout of a host row.
 *
 * @param {object} props - Component properties
 * @param {string} props.loadingLabel - Accessible loading description
 * @returns {Component} Dashboard host loading row
 */
const HostSkeletonRow = ({ loadingLabel }) => (
  <Box className="dashboard-hosts-card-row dashboard-hosts-card-row-skeleton">
    <Box className="dashboard-hosts-card-information">
      <Box className="dashboard-hosts-card-name-row">
        <SkeletonLoading
          loading
          width="48%"
          height="1.25rem"
          ariaLabel={loadingLabel}
        />
        <SkeletonLoading loading width={72} height={22} borderRadius="2xl" />
      </Box>
      <SkeletonLoading loading width="72%" height="1rem" />
    </Box>

    {HOST_METRICS.map((metric) => (
      <Box key={metric} className="dashboard-hosts-card-metric">
        <SkeletonLoading loading width="48%" height="1rem" />
        <SkeletonLoading loading width="100%" height={8} borderRadius="round" />
      </Box>
    ))}
  </Box>
)

HostSkeletonRow.propTypes = {
  loadingLabel: PropTypes.string,
}

/**
 * Dashboard card that displays the current hosts and their capacity.
 *
 * @param {object} props - Component properties
 * @param {Component} props.title - Card title
 * @param {Component} props.adornment - Element rendered next to the title
 * @param {object[]} props.hosts - Normalized hosts to display
 * @param {boolean} props.isLoading - Whether host data is loading
 * @param {string} props.loadingLabel - Accessible loading description
 * @param {boolean} props.isNavigable - Whether host rows are interactive
 * @param {string} props.className - Additional card class name
 * @param {object} ref - Forwarded ref
 * @returns {Component} Dashboard hosts card
 */
export const DashboardHostsCard = forwardRef(
  (
    {
      title,
      adornment,
      hosts = [],
      isLoading = false,
      loadingLabel = T.Loading,
      isNavigable = true,
      className = '',
    },
    ref
  ) => (
    <DashboardCard
      ref={ref}
      type="big"
      title={title}
      adornment={adornment}
      className={`dashboard-hosts-card ${className}`}
    >
      <Box
        className="dashboard-hosts-card-content"
        aria-busy={isLoading}
        sx={(theme) => getStyles({ theme })}
      >
        {isLoading
          ? Array.from({ length: DEFAULT_SKELETON_ROWS }, (_, index) => (
              <HostSkeletonRow
                key={`dashboard-hosts-card-skeleton-${index}`}
                loadingLabel={index === 0 ? loadingLabel : undefined}
              />
            ))
          : hosts.map((host) => {
              const HostRow = isNavigable ? Button : Box
              const navigationProps = isNavigable
                ? {
                    type: 'transparent',
                    size: 'medium',
                    onClick: host.onClick,
                    'aria-label': host.ariaLabel,
                  }
                : {}

              return (
                <HostRow
                  key={host.id}
                  className="dashboard-hosts-card-row"
                  {...navigationProps}
                >
                  <Box className="dashboard-hosts-card-information">
                    <Box className="dashboard-hosts-card-name-row">
                      <Text
                        className="dashboard-hosts-card-name"
                        variant={TEXT_VARIANTS.BODY_SMALL}
                        weight={TEXT_WEIGHTS.MEDIUM}
                        value={host.name}
                      />
                      <StatusTag
                        statusName={host.status.name}
                        statusColor={host.status.color}
                        titleClassName="tag-title"
                      />
                    </Box>
                    <Text
                      className="dashboard-hosts-card-metadata"
                      variant={TEXT_VARIANTS.CAPTION}
                      value={host.metadata.join(' · ')}
                    />
                  </Box>

                  {[host.cpu, host.memory].map((metric) => (
                    <Box
                      key={metric.label}
                      className="dashboard-hosts-card-metric"
                    >
                      <Text
                        className="dashboard-hosts-card-metric-label"
                        variant={TEXT_VARIANTS.CAPTION}
                        weight={TEXT_WEIGHTS.MEDIUM}
                        value={`${metric.label} : ${metric.detail}`}
                      />
                      <ProgressBar
                        size="small"
                        value={metric.value}
                        aria-label={metric.ariaLabel}
                      />
                    </Box>
                  ))}
                </HostRow>
              )
            })}
      </Box>
    </DashboardCard>
  )
)

const metricPropType = PropTypes.shape({
  label: PropTypes.string.isRequired,
  detail: PropTypes.string.isRequired,
  value: PropTypes.number.isRequired,
  ariaLabel: PropTypes.string,
})

DashboardHostsCard.propTypes = {
  title: PropTypes.node.isRequired,
  adornment: PropTypes.node,
  hosts: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      name: PropTypes.string.isRequired,
      status: PropTypes.shape({
        name: PropTypes.string.isRequired,
        color: PropTypes.string.isRequired,
      }).isRequired,
      metadata: PropTypes.arrayOf(PropTypes.string).isRequired,
      cpu: metricPropType.isRequired,
      memory: metricPropType.isRequired,
      onClick: PropTypes.func.isRequired,
      ariaLabel: PropTypes.string.isRequired,
    })
  ),
  isLoading: PropTypes.bool,
  loadingLabel: PropTypes.string,
  isNavigable: PropTypes.bool,
  className: PropTypes.string,
}

DashboardHostsCard.displayName = 'DashboardHostsCard'
