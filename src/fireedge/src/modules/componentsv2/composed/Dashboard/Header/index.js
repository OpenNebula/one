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
import { RefreshDouble as RefreshIcon } from 'iconoir-react'
import PropTypes from 'prop-types'
import {
  Component,
  forwardRef,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'

import { Button } from '@modules/componentsv2/primitives/Buttons/Default'
import { SkeletonLoading } from '@modules/componentsv2/primitives/Loaders'
import { Text } from '@modules/componentsv2/primitives/Text/Default'
import { getStyles } from '@modules/componentsv2/composed/Dashboard/Header/styles'
import { T, TEXT_VARIANTS, TEXT_WEIGHTS } from '@ConstantsModule'

const LAST_UPDATED_STORAGE_KEY = 'fireedge.dashboard.lastUpdatedAt'
const MINUTE_IN_MS = 60 * 1000
const HOUR_IN_MS = 60 * MINUTE_IN_MS
const DAY_IN_MS = 24 * HOUR_IN_MS
const UPDATED_TEXT_LABELS = {
  justNow: T.UpdatedJustNow,
  minute: T.UpdatedMinuteAgo,
  minutes: T.UpdatedMinutesAgo,
  hour: T.UpdatedHourAgo,
  hours: T.UpdatedHoursAgo,
  day: T.UpdatedDayAgo,
  days: T.UpdatedDaysAgo,
}

const getStoredLastUpdatedAt = (storageKey) => {
  try {
    if (typeof window === 'undefined') return undefined

    const timestamp = Number(window.localStorage.getItem(storageKey))

    return Number.isFinite(timestamp) && timestamp > 0 ? timestamp : undefined
  } catch {
    return undefined
  }
}

const saveLastUpdatedAt = (storageKey, timestamp) => {
  try {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(storageKey, String(timestamp))
    }
  } catch {}
}

const formatUpdatedText = ({ lastUpdatedAt, now, labels }) => {
  const elapsed = Math.max(0, now - lastUpdatedAt)

  if (elapsed < MINUTE_IN_MS) return labels.justNow

  const [value, singularLabel, pluralLabel] =
    elapsed < HOUR_IN_MS
      ? [Math.floor(elapsed / MINUTE_IN_MS), labels.minute, labels.minutes]
      : elapsed < DAY_IN_MS
      ? [Math.floor(elapsed / HOUR_IN_MS), labels.hour, labels.hours]
      : [Math.floor(elapsed / DAY_IN_MS), labels.day, labels.days]

  return String(value === 1 ? singularLabel : pluralLabel).replace('%s', value)
}

/**
 * Displays the dashboard title, context and available actions.
 *
 * @param {object} props - Component properties
 * @param {string|Component} props.title - Dashboard title
 * @param {string|Component} props.subtitle - Dashboard context
 * @param {boolean} props.isSubtitleLoading - Whether context is loading
 * @param {string} props.loadingLabel - Accessible loading description
 * @param {string|Component} props.updatedText - Just-now text and legacy fallback
 * @param {object} props.updatedTextLabels - Relative time labels
 * @param {string} props.lastUpdatedStorageKey - Local storage timestamp key
 * @param {string|Component} props.refreshLabel - Refresh button label
 * @param {Function} props.onRefresh - Refresh action
 * @param {boolean} props.isRefreshing - Whether a refresh is in progress
 * @param {object} props.primaryAction - Configurable primary action
 * @param {object} ref - Forwarded ref
 * @returns {Component} Dashboard header
 */
export const DashboardHeader = forwardRef(
  (
    {
      title = T.Overview,
      subtitle,
      isSubtitleLoading = false,
      loadingLabel = T.Loading,
      updatedText,
      updatedTextLabels = UPDATED_TEXT_LABELS,
      lastUpdatedStorageKey = LAST_UPDATED_STORAGE_KEY,
      refreshLabel = T.Refresh,
      onRefresh,
      isRefreshing = false,
      primaryAction,
      ...opts
    },
    ref
  ) => {
    const [lastUpdatedAt, setLastUpdatedAt] = useState(
      () => getStoredLastUpdatedAt(lastUpdatedStorageKey) ?? Date.now()
    )
    const [now, setNow] = useState(Date.now)
    const wasRefreshing = useRef(isRefreshing)
    const {
      label: primaryActionLabel,
      icon: primaryActionIcon,
      onClick: onPrimaryAction,
      isDisabled: isPrimaryActionDisabled = false,
      tooltip: primaryActionTooltip,
      buttonProps: primaryActionButtonProps = {},
    } = primaryAction ?? {}

    useEffect(() => {
      const storedTimestamp = getStoredLastUpdatedAt(lastUpdatedStorageKey)
      const timestamp = storedTimestamp ?? Date.now()

      setLastUpdatedAt(timestamp)
      setNow(Date.now())
      saveLastUpdatedAt(lastUpdatedStorageKey, timestamp)
    }, [lastUpdatedStorageKey])

    useEffect(() => {
      const interval = window.setInterval(
        () => setNow(Date.now()),
        MINUTE_IN_MS
      )

      return () => window.clearInterval(interval)
    }, [])

    const updateLastUpdatedAt = useCallback(() => {
      const timestamp = Date.now()

      setLastUpdatedAt(timestamp)
      setNow(timestamp)
      saveLastUpdatedAt(lastUpdatedStorageKey, timestamp)
    }, [lastUpdatedStorageKey])

    useEffect(() => {
      if (wasRefreshing.current && !isRefreshing) updateLastUpdatedAt()

      wasRefreshing.current = isRefreshing
    }, [isRefreshing, updateLastUpdatedAt])

    const handleRefresh = useCallback(
      (...args) => {
        updateLastUpdatedAt()

        return onRefresh?.(...args)
      },
      [onRefresh, updateLastUpdatedAt]
    )

    const relativeLabels = { ...UPDATED_TEXT_LABELS, ...updatedTextLabels }
    const lastUpdatedText = formatUpdatedText({
      lastUpdatedAt,
      now,
      labels: {
        ...relativeLabels,
        justNow: updatedText ?? relativeLabels.justNow,
      },
    })

    return (
      <Box ref={ref} sx={(theme) => getStyles({ theme })} {...opts}>
        <Box className="dashboard-header-information">
          <Text
            className="dashboard-header-title"
            variant={TEXT_VARIANTS.H5}
            weight={TEXT_WEIGHTS.SEMIBOLD}
            value={title}
          />
          {(subtitle || isSubtitleLoading) && (
            <SkeletonLoading
              loading={isSubtitleLoading}
              width={{ xs: '10rem', sm: '16rem' }}
              height="1rem"
              ariaLabel={loadingLabel}
            >
              <Text
                className="dashboard-header-subtitle"
                variant={TEXT_VARIANTS.CAPTION}
                value={subtitle}
              />
            </SkeletonLoading>
          )}
        </Box>

        <Box className="dashboard-header-controls">
          <Text
            className="dashboard-header-updated-text"
            variant={TEXT_VARIANTS.CAPTION}
            value={lastUpdatedText}
            role="status"
            aria-live="polite"
            aria-atomic="true"
          />
          {onRefresh && (
            <Button
              className={`dashboard-header-refresh-button ${
                isRefreshing ? 'is-refreshing' : ''
              }`}
              type="secondary"
              size="small"
              startIcon={
                <RefreshIcon className="dashboard-header-refresh-icon" />
              }
              onClick={handleRefresh}
              isDisabled={isRefreshing}
            >
              {refreshLabel}
            </Button>
          )}
          {primaryAction && (
            <Button
              {...primaryActionButtonProps}
              className="dashboard-header-primary-action"
              type="primary"
              size="small"
              startIcon={primaryActionIcon}
              onClick={onPrimaryAction}
              isDisabled={isPrimaryActionDisabled}
              tooltip={primaryActionTooltip}
            >
              {primaryActionLabel}
            </Button>
          )}
        </Box>
      </Box>
    )
  }
)

DashboardHeader.propTypes = {
  title: PropTypes.node.isRequired,
  subtitle: PropTypes.string,
  isSubtitleLoading: PropTypes.bool,
  loadingLabel: PropTypes.string,
  updatedText: PropTypes.node,
  updatedTextLabels: PropTypes.shape({
    justNow: PropTypes.string,
    minute: PropTypes.string,
    minutes: PropTypes.string,
    hour: PropTypes.string,
    hours: PropTypes.string,
    day: PropTypes.string,
    days: PropTypes.string,
  }),
  lastUpdatedStorageKey: PropTypes.string,
  refreshLabel: PropTypes.node,
  onRefresh: PropTypes.func,
  isRefreshing: PropTypes.bool,
  primaryAction: PropTypes.shape({
    label: PropTypes.node.isRequired,
    icon: PropTypes.oneOfType([PropTypes.node, PropTypes.elementType]),
    onClick: PropTypes.func,
    isDisabled: PropTypes.bool,
    tooltip: PropTypes.node,
    buttonProps: PropTypes.object,
  }),
}

DashboardHeader.displayName = 'DashboardHeader'
