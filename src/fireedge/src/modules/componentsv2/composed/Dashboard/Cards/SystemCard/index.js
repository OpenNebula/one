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
import { NavArrowRight } from 'iconoir-react'
import PropTypes from 'prop-types'
import { Component, forwardRef } from 'react'

import { DashboardCard } from '@modules/componentsv2/composed/Dashboard/Card'
import { getStyles } from '@modules/componentsv2/composed/Dashboard/Cards/SystemCard/styles'
import { Button } from '@modules/componentsv2/primitives/Buttons/Default'
import { SkeletonLoading } from '@modules/componentsv2/primitives/Loaders'
import { Text } from '@modules/componentsv2/primitives/Text/Default'
import { T, TEXT_VARIANTS, TEXT_WEIGHTS } from '@ConstantsModule'

const DEFAULT_SKELETON_ITEMS = 2

/**
 * Loading placeholder that preserves the layout of a system item.
 *
 * @param {object} props - Component properties
 * @param {string} props.loadingLabel - Accessible loading description
 * @param {boolean} props.isNavigable - Whether navigation is represented
 * @returns {Component} Dashboard system loading item
 */
const SystemSkeletonItem = ({ loadingLabel, isNavigable }) => (
  <Box className="dashboard-system-card-item dashboard-system-card-item-skeleton">
    <SkeletonLoading
      loading
      width={28}
      height={28}
      borderRadius="xlg"
      ariaLabel={loadingLabel}
    />
    <Box className="dashboard-system-card-item-content">
      <SkeletonLoading loading width="48%" height="1.25rem" />
      <SkeletonLoading loading width={24} height="1.5rem" />
    </Box>
    {isNavigable && <SkeletonLoading loading width={12} height={16} />}
  </Box>
)

SystemSkeletonItem.propTypes = {
  loadingLabel: PropTypes.string,
  isNavigable: PropTypes.bool,
}

/**
 * Dashboard card with links to system resources and their current totals.
 *
 * @param {object} props - Component properties
 * @param {Component} props.title - Card title
 * @param {Component} props.adornment - Element rendered next to the title
 * @param {object[]} props.items - Navigable system resources
 * @param {boolean} props.isLoading - Whether card data is loading
 * @param {string} props.loadingLabel - Accessible loading description
 * @param {boolean} props.isNavigable - Whether resource rows are interactive
 * @param {string} props.className - Additional card class name
 * @param {object} ref - Forwarded ref
 * @returns {Component} Dashboard system card
 */
export const DashboardSystemCard = forwardRef(
  (
    {
      title,
      adornment,
      items = [],
      isLoading = false,
      loadingLabel = T.Loading,
      isNavigable = true,
      className = '',
    },
    ref
  ) => {
    const loadingItems = items.length || DEFAULT_SKELETON_ITEMS

    return (
      <DashboardCard
        ref={ref}
        type="big"
        title={title}
        adornment={adornment}
        className={`dashboard-system-card ${className}`}
      >
        <Box
          className="dashboard-system-card-content"
          aria-busy={isLoading}
          sx={(theme) => getStyles({ theme })}
        >
          <Box className="dashboard-system-card-items">
            {isLoading
              ? Array.from({ length: loadingItems }, (_, index) => (
                  <SystemSkeletonItem
                    key={`dashboard-system-skeleton-${index}`}
                    loadingLabel={index === 0 ? loadingLabel : undefined}
                    isNavigable={isNavigable}
                  />
                ))
              : items.map((item, index) => {
                  const SystemItem = isNavigable ? Button : Box
                  const navigationProps = isNavigable
                    ? {
                        type: 'transparent',
                        size: 'medium',
                        startIcon: item.icon,
                        endIcon: <NavArrowRight />,
                        onClick: item.onClick,
                        isDisabled: item.isDisabled,
                        'aria-label': item.ariaLabel,
                      }
                    : {}

                  return (
                    <SystemItem
                      key={item.id ?? index}
                      className={`dashboard-system-card-item${
                        isNavigable
                          ? ' dashboard-system-card-item-navigable'
                          : ''
                      }`}
                      {...navigationProps}
                    >
                      {!isNavigable && item.icon && (
                        <Box className="dashboard-system-card-item-icon">
                          {item.icon}
                        </Box>
                      )}
                      <Box className="dashboard-system-card-item-content">
                        <Text
                          className="dashboard-system-card-item-label"
                          variant={TEXT_VARIANTS.BODY_SMALL}
                          weight={TEXT_WEIGHTS.MEDIUM}
                          value={item.label}
                        />
                        <Text
                          className="dashboard-system-card-item-value"
                          variant={TEXT_VARIANTS.H6}
                          weight={TEXT_WEIGHTS.SEMIBOLD}
                          value={item.value}
                        />
                      </Box>
                    </SystemItem>
                  )
                })}
          </Box>
        </Box>
      </DashboardCard>
    )
  }
)

DashboardSystemCard.propTypes = {
  title: PropTypes.node.isRequired,
  adornment: PropTypes.node,
  items: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      label: PropTypes.node.isRequired,
      value: PropTypes.node.isRequired,
      icon: PropTypes.node,
      onClick: PropTypes.func,
      isDisabled: PropTypes.bool,
      ariaLabel: PropTypes.string,
    })
  ),
  isLoading: PropTypes.bool,
  loadingLabel: PropTypes.string,
  isNavigable: PropTypes.bool,
  className: PropTypes.string,
}

DashboardSystemCard.displayName = 'DashboardSystemCard'
