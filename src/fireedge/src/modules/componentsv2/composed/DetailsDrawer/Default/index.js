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

import { Component, forwardRef, useEffect, useMemo } from 'react'
import PropTypes from 'prop-types'
import { Box, Drawer, useTheme } from '@mui/material'
import { NavArrowLeft, NavArrowRight } from 'iconoir-react'
import { useLocation } from 'react-router-dom'
import { useResourceSingleViewContext } from '@ProvidersModule'
import { getStyles } from '@modules/componentsv2/composed/DetailsDrawer/Default/styles'
import { getResourceIcon } from '@modules/componentsv2/composed/DetailsDrawer/resourceIcons'
import { useDetailsDrawerStack } from '@modules/componentsv2/composed/DetailsDrawer/Stack'
import { BreadcrumbTrail } from '@modules/componentsv2/primitives/Header/Default/breadcrumbs'

const hasValue = (value) =>
  value !== undefined && value !== null && value !== ''

/**
 * @param {string} pathname - Current path
 * @returns {string} Current resource route id
 */
const getRouteResource = (pathname) =>
  String(pathname ?? '')
    .split('/')
    .filter(Boolean)[0]

/**
 * @param {object} entry - Stack entry
 * @returns {string|number} Entry resource id
 */
const getEntryId = (entry = {}) =>
  hasValue(entry?.data?.ID) ? entry.data.ID : entry?.data?.id

/**
 * @param {object} entry - Stack entry
 * @param {string} resource - Resource id
 * @param {string|number} id - Resource row id
 * @returns {boolean} True when entry matches resource and id
 */
const isEntry = (entry, resource, id) =>
  String(entry?.resource) === String(resource) &&
  hasValue(id) &&
  String(getEntryId(entry)) === String(id)

const getSelectedResourceIds = (slots = []) =>
  []
    .concat(
      slots.find(([Slot]) => Slot.displayName === 'TabSlot')?.[1]?.tabProps
        ?.selected ?? []
    )
    .flat()
    .map((resource) => resource?.ID ?? resource?.id)
    .filter(hasValue)
    .sort()
    .join(',')

/**
 * @param {Array} slots - Drawer slots
 * @returns {object} Base stack data
 */
const getBaseData = (slots = []) => {
  const { id, title } = slots?.[0]?.[1] ?? {}

  return { ID: id ?? getSelectedResourceIds(slots), NAME: title }
}

/**
 * Renders details drawer slots.
 *
 * @param {Array} slots - Component slots
 * @param {boolean} isLoading - Whether the drawer body is loading
 * @returns {Component} Slots content
 */
const renderSlots = (slots, isLoading) => (
  <Box className="detailsdrawer-slots">
    {slots?.map(([Slot, slotProps = {}, containerSx = {}], idx) => {
      const isInfoSlot = Slot.displayName === 'InfoSlot'
      const props = isInfoSlot
        ? { ...slotProps, isLoading: slotProps.isLoading ?? isLoading }
        : slotProps

      return (
        <Box
          key={idx}
          className={[
            'detailsdrawer-slot',
            `detailsdrawer-slot--${idx}`,
            Slot.displayName && `detailsdrawer-slot--${Slot.displayName}`,
          ]
            .filter(Boolean)
            .join(' ')}
          sx={[...(Array.isArray(containerSx) ? containerSx : [containerSx])]}
        >
          <Slot {...props} />
        </Box>
      )
    })}
  </Box>
)

/**
 * Stack arrow button.
 *
 * @param {object} root0 - Params
 * @param {string} root0.direction - Navigation direction
 * @param {boolean} root0.disabled - Whether button is disabled
 * @param {Function} root0.onClick - Click handler
 * @returns {Component} Stack arrow button
 */
const StackArrow = ({ direction, disabled, onClick }) => {
  const Icon = direction === 'back' ? NavArrowLeft : NavArrowRight
  const label = direction === 'back' ? 'Previous drawer' : 'Next drawer'

  return (
    <Box
      component="button"
      type="button"
      className="detailsdrawer-stack-arrow"
      disabled={disabled}
      aria-label={label}
      title={label}
      onClick={onClick}
    >
      <Icon width="16px" height="16px" />
    </Box>
  )
}

StackArrow.propTypes = {
  direction: PropTypes.oneOf(['back', 'forward']),
  disabled: PropTypes.bool,
  onClick: PropTypes.func,
}

/**
 * DetailsDrawer component.
 *
 * @param {object} root0 - Params
 * @param {Array} root0.slots - Component slots
 * @returns {Component} - DetailsDrawer component
 */
export const DetailsDrawer = forwardRef(
  ({ isOpen = false, isLoading = false, slots = [] }, ref) => {
    const theme = useTheme()
    const { pathname } = useLocation()
    const drawerStack = useDetailsDrawerStack()
    const {
      clearResourceSingleViewBase,
      goBackResourceSingleView,
      goForwardResourceSingleView,
      goToResourceSingleView,
      registerResourceSingleViewBase,
      stack: resourceStack = {},
    } = useResourceSingleViewContext()
    const routeResource = getRouteResource(pathname)
    const { ID: baseId, NAME: baseName } = getBaseData(slots)
    const baseData = useMemo(
      () => ({ ID: baseId, NAME: baseName }),
      [baseId, baseName]
    )
    const baseIdentity = useMemo(
      () =>
        routeResource && hasValue(baseData.ID)
          ? `${routeResource}:${baseData.ID}`
          : '',
      [baseData.ID, routeResource]
    )
    const isStackDrawer = drawerStack.entries.length > 0

    useEffect(() => {
      if (
        isStackDrawer ||
        !isOpen ||
        !routeResource ||
        !hasValue(baseData.ID)
      ) {
        return undefined
      }

      const isRegistered = registerResourceSingleViewBase(
        routeResource,
        baseData
      )

      if (!isRegistered) return undefined
    }, [
      baseData,
      isOpen,
      isStackDrawer,
      registerResourceSingleViewBase,
      routeResource,
    ])

    useEffect(() => {
      if (isStackDrawer || !isOpen || !baseIdentity) {
        return undefined
      }

      return () => {
        clearResourceSingleViewBase(routeResource, { ID: baseData.ID })
      }
    }, [
      baseData.ID,
      baseIdentity,
      clearResourceSingleViewBase,
      isOpen,
      isStackDrawer,
      routeResource,
    ])

    const isBaseStackDrawer =
      !isStackDrawer &&
      isOpen &&
      resourceStack.entries?.length > 1 &&
      isEntry(resourceStack.entries[0], routeResource, baseData.ID)
    const stack = isBaseStackDrawer
      ? {
          ...resourceStack,
          index: 0,
          isActive: resourceStack.activeIndex === 0,
          breadcrumbs: resourceStack.entries[0]?.breadcrumbs ?? [],
          goBack: goBackResourceSingleView,
          goForward: goForwardResourceSingleView,
          goTo: goToResourceSingleView,
        }
      : drawerStack
    const {
      entries = [],
      activeIndex = 0,
      index = 0,
      isActive = true,
      breadcrumbs = [],
      goBack,
      goForward,
      goTo,
    } = stack
    const hasStack = entries.length > 1
    const showStackChrome = hasStack && isActive
    const stackEntry = entries[index]
    const StackIcon = getResourceIcon(stackEntry?.resource)
    const stackTitle = stackEntry?.title
    const showStackTab = hasStack && !isActive && hasValue(stackTitle)

    return (
      <Drawer
        hideBackdrop={true}
        anchor={'right'}
        sx={{ ...getStyles({ theme, stack: { ...stack, hasStack } }) }}
        open={isOpen}
        ModalProps={{
          disableAutoFocus: hasStack && !isActive,
          disableEnforceFocus: hasStack && !isActive,
          disableRestoreFocus: hasStack && !isActive,
        }}
        PaperProps={{
          className: [
            'detailsdrawer-paper',
            hasStack && 'detailsdrawer-paper--stacked',
            hasStack && isActive && 'detailsdrawer-paper--active',
            hasStack && !isActive && 'detailsdrawer-paper--background',
          ]
            .filter(Boolean)
            .join(' '),
          'data-stack-index': index,
        }}
        ref={ref}
      >
        {showStackTab && (
          <Box
            component="button"
            type="button"
            className="detailsdrawer-stack-tab"
            title={String(stackTitle)}
            aria-label={`Open ${stackTitle}`}
            onClick={() => goTo?.(index)}
          >
            <Box component="span" className="detailsdrawer-stack-tab-label">
              <StackIcon className="detailsdrawer-stack-tab-icon" />
              <Box component="span" className="detailsdrawer-stack-tab-text">
                {stackTitle}
              </Box>
            </Box>
          </Box>
        )}
        <Box className="detailsdrawer-stack-content">
          {showStackChrome && (
            <Box className="detailsdrawer-stack-header">
              <Box className="detailsdrawer-stack-nav">
                <StackArrow
                  direction="back"
                  disabled={activeIndex < 1}
                  onClick={goBack}
                />
                <StackArrow
                  direction="forward"
                  disabled={activeIndex >= entries.length - 1}
                  onClick={goForward}
                />
                <Box className="detailsdrawer-stack-count">
                  {activeIndex + 1}/{entries.length}
                </Box>
              </Box>
              <BreadcrumbTrail
                breadcrumbs={breadcrumbs}
                className="detailsdrawer-stack-breadcrumbs"
              />
            </Box>
          )}
          {renderSlots(slots, isLoading)}
        </Box>
      </Drawer>
    )
  }
)

DetailsDrawer.propTypes = {
  isOpen: PropTypes.bool,
  isLoading: PropTypes.bool,
  slots: PropTypes.array,
}

DetailsDrawer.displayName = 'DetailsDrawer'
