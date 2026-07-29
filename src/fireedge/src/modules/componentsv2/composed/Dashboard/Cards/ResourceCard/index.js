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
import { Children, Component, forwardRef } from 'react'

import { DashboardCard } from '@modules/componentsv2/composed/Dashboard/Card'
import { SkeletonLoading } from '@modules/componentsv2/primitives/Loaders'
import { ProgressBarSegments } from '@modules/componentsv2/primitives/Progress/Segments'
import { Text } from '@modules/componentsv2/primitives/Text/Default'
import {
  getAdornmentStyles,
  getStyles,
} from '@modules/componentsv2/composed/Dashboard/Cards/ResourceCard/styles'
import { T, TEXT_VARIANTS, TEXT_WEIGHTS } from '@ConstantsModule'

const RESOURCE_CARD_TONES = [
  'neutral',
  'success',
  'warning',
  'error',
  'information',
  'action',
  'focus',
]

const getToneClassName = (tone = 'neutral') =>
  `dashboard-resource-card-tone-${
    RESOURCE_CARD_TONES.includes(tone) ? tone : 'neutral'
  }`

/**
 * Dashboard card that summarizes a resource pool.
 *
 * @param {object} props - Component properties
 * @param {Component} props.title - Card title
 * @param {Component} props.adornment - Element rendered next to the title
 * @param {Component} props.value - Main card value
 * @param {number} props.progressTotal - Total used to size progress segments
 * @param {object[]} props.segments - Progress segments
 * @param {object[]} props.details - Card detail items
 * @param {Component} props.children - Optional custom content
 * @param {boolean} props.isLoading - Whether card data is loading
 * @param {string} props.loadingLabel - Accessible loading description
 * @param {string} props.progressAriaLabel - Accessible progress description
 * @param {string|object} props.to - Optional internal navigation target
 * @param {string} props.className - Additional card class name
 * @param {object} ref - Forwarded ref
 * @returns {Component} Dashboard resource card
 */
export const DashboardResourceCard = forwardRef(
  (
    {
      title,
      adornment,
      value,
      progressTotal,
      segments = [],
      details = [],
      isLoading = false,
      loadingLabel = T.Loading,
      progressAriaLabel,
      to,
      className = '',
      children,
    },
    ref
  ) => {
    const showProgress = segments.length > 0
    const showExtraContent = Children.toArray(children).length > 0

    return (
      <DashboardCard
        ref={ref}
        type="small"
        title={title}
        adornment={
          adornment ? (
            <Box
              className="dashboard-resource-card-adornment"
              sx={(theme) => getAdornmentStyles({ theme })}
            >
              {adornment}
            </Box>
          ) : undefined
        }
        to={to}
        className={`dashboard-resource-card ${className}`}
      >
        <Box sx={(theme) => getStyles({ theme })}>
          <SkeletonLoading
            loading={isLoading}
            width="32px"
            height={{ xs: '1.5rem', sm: '1.75rem', md: '2rem' }}
            ariaLabel={loadingLabel}
          >
            <Text
              variant={TEXT_VARIANTS.H5}
              weight={TEXT_WEIGHTS.SEMIBOLD}
              value={value}
            />
          </SkeletonLoading>

          {showProgress && (
            <SkeletonLoading
              loading={isLoading}
              width="100%"
              height={4}
              borderRadius="round"
              className="dashboard-resource-card-details-progress"
            >
              <ProgressBarSegments
                segments={segments}
                total={progressTotal}
                ariaLabel={progressAriaLabel}
                className="dashboard-resource-card-details-progress"
              />
            </SkeletonLoading>
          )}

          {details.length > 0 && (
            <SkeletonLoading loading={isLoading} width="82%" height="1rem">
              <Box className="dashboard-resource-card-details">
                {details.map(
                  (
                    {
                      id,
                      value: detailValue,
                      label,
                      tone = 'neutral',
                      showIndicator = true,
                      isMuted = false,
                    },
                    index
                  ) => (
                    <Box
                      key={id ?? index}
                      className={`dashboard-resource-card-detail ${
                        detailValue === 0
                          ? 'dashboard-resource-card-detail-disabled'
                          : ''
                      } ${
                        isMuted ? 'dashboard-resource-card-detail-muted' : ''
                      }`}
                    >
                      {showIndicator && (
                        <Box
                          className={`dashboard-resource-card-detail-indicator ${getToneClassName(
                            tone
                          )}`}
                        />
                      )}
                      {detailValue !== undefined && detailValue !== null && (
                        <Text
                          className="dashboard-resource-card-detail-value"
                          component="span"
                          variant={TEXT_VARIANTS.CAPTION}
                          weight={TEXT_WEIGHTS.MEDIUM}
                          value={detailValue}
                        />
                      )}
                      {label && (
                        <Text
                          className="dashboard-resource-card-detail-label"
                          component="span"
                          variant={TEXT_VARIANTS.CAPTION}
                          weight={TEXT_WEIGHTS.MEDIUM}
                          value={label}
                        />
                      )}
                    </Box>
                  )
                )}
              </Box>
            </SkeletonLoading>
          )}

          {showExtraContent && (
            <Box className="dashboard-resource-card-extra">
              <SkeletonLoading loading={isLoading} width="50%" height="1.25rem">
                {children}
              </SkeletonLoading>
            </Box>
          )}
        </Box>
      </DashboardCard>
    )
  }
)

const progressSegmentPropType = PropTypes.shape({
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  value: PropTypes.number.isRequired,
  tone: PropTypes.oneOf(RESOURCE_CARD_TONES),
})

const detailPropType = PropTypes.shape({
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  value: PropTypes.node,
  label: PropTypes.node,
  tone: PropTypes.oneOf(RESOURCE_CARD_TONES),
  showIndicator: PropTypes.bool,
  isMuted: PropTypes.bool,
})

DashboardResourceCard.propTypes = {
  title: PropTypes.node.isRequired,
  adornment: PropTypes.node,
  value: PropTypes.node,
  progressTotal: PropTypes.number,
  segments: PropTypes.arrayOf(progressSegmentPropType),
  details: PropTypes.arrayOf(detailPropType),
  children: PropTypes.node,
  isLoading: PropTypes.bool,
  loadingLabel: PropTypes.string,
  progressAriaLabel: PropTypes.string,
  to: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  className: PropTypes.string,
}

DashboardResourceCard.displayName = 'DashboardResourceCard'
