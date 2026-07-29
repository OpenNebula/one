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
import { SkeletonLoading } from '@modules/componentsv2/primitives/Loaders'
import { ProgressBar } from '@modules/componentsv2/primitives/Progress/Bar'
import { Text } from '@modules/componentsv2/primitives/Text/Default'
import { getStyles } from '@modules/componentsv2/composed/Dashboard/Cards/CapacityCard/styles'
import { T, TEXT_VARIANTS, TEXT_WEIGHTS } from '@ConstantsModule'

const DEFAULT_SKELETON_ITEMS = 2

const getPercentage = ({ value, total, percentage }) => {
  if (percentage !== undefined && Number.isFinite(+percentage)) {
    return +percentage
  }

  return +total > 0 ? ((+value || 0) * 100) / +total : 0
}

const formatPercentage = (percentage) => Math.round(percentage * 10) / 10

/**
 * Loading placeholder that preserves the layout of a capacity item.
 *
 * @param {object} props - Component properties
 * @param {string} props.loadingLabel - Accessible loading description
 * @returns {Component} Dashboard capacity loading item
 */
const CapacitySkeletonItem = ({ loadingLabel }) => (
  <Box className="dashboard-capacity-card-item">
    <SkeletonLoading
      loading
      width="36%"
      height="1rem"
      ariaLabel={loadingLabel}
      className="dashboard-capacity-card-label"
    />
    <SkeletonLoading
      loading
      width="100%"
      height={12}
      borderRadius="round"
      className="dashboard-capacity-card-progress"
    />
  </Box>
)

CapacitySkeletonItem.propTypes = {
  loadingLabel: PropTypes.string,
}

/**
 * Dashboard card that displays one or more capacity values.
 *
 * @param {object} props - Component properties
 * @param {Component} props.title - Card title
 * @param {Component} props.titleTag - Tag rendered next to the title
 * @param {Component} props.adornment - Element rendered next to the title
 * @param {object[]} props.items - Capacity items
 * @param {boolean} props.isLoading - Whether card data is loading
 * @param {string} props.loadingLabel - Accessible loading description
 * @param {string|object} props.to - Optional internal navigation target
 * @param {string} props.className - Additional card class name
 * @param {object} ref - Forwarded ref
 * @returns {Component} Dashboard capacity card
 */
export const DashboardCapacityCard = forwardRef(
  (
    {
      title,
      titleTag,
      adornment,
      items = [],
      isLoading = false,
      loadingLabel = T.Loading,
      to,
      className = '',
    },
    ref
  ) => {
    const loadingItems = items.length
      ? items
      : Array.from({ length: DEFAULT_SKELETON_ITEMS }, () => ({}))

    return (
      <DashboardCard
        ref={ref}
        type="big"
        title={title}
        titleTag={
          titleTag && (
            <SkeletonLoading
              loading={isLoading}
              width={64}
              height={22}
              borderRadius="2xl"
            >
              {titleTag}
            </SkeletonLoading>
          )
        }
        to={to}
        adornment={adornment}
        className={`dashboard-capacity-card ${className}`}
      >
        <Box
          className="dashboard-capacity-card-content"
          aria-busy={isLoading}
          sx={(theme) => getStyles({ theme })}
        >
          <Box className="dashboard-capacity-card-items">
            {isLoading
              ? loadingItems.map((item, index) => (
                  <CapacitySkeletonItem
                    key={item.id ?? `dashboard-capacity-skeleton-${index}`}
                    loadingLabel={index === 0 ? loadingLabel : undefined}
                  />
                ))
              : items.map((item, index) => {
                  const percentage = getPercentage(item)
                  const percentageLabel = formatPercentage(percentage)

                  return (
                    <Box
                      key={item.id ?? index}
                      className="dashboard-capacity-card-item"
                    >
                      <Text
                        className="dashboard-capacity-card-label"
                        variant={TEXT_VARIANTS.CAPTION}
                        weight={TEXT_WEIGHTS.MEDIUM}
                        value={
                          <>
                            {item.label} :{' '}
                            {item.valueLabel ?? `${percentageLabel}%`}
                          </>
                        }
                      />

                      <ProgressBar
                        className="dashboard-capacity-card-progress"
                        size="medium"
                        value={percentage}
                      />
                    </Box>
                  )
                })}
          </Box>
        </Box>
      </DashboardCard>
    )
  }
)

DashboardCapacityCard.propTypes = {
  title: PropTypes.node.isRequired,
  titleTag: PropTypes.node,
  adornment: PropTypes.node,
  items: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      label: PropTypes.node.isRequired,
      ariaLabel: PropTypes.string,
      value: PropTypes.number,
      total: PropTypes.number,
      percentage: PropTypes.number,
      valueLabel: PropTypes.node,
    })
  ),
  isLoading: PropTypes.bool,
  loadingLabel: PropTypes.string,
  to: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  className: PropTypes.string,
}

DashboardCapacityCard.displayName = 'DashboardCapacityCard'
