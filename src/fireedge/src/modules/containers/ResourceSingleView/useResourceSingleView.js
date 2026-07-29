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

import { useCallback, useMemo, useRef, useState } from 'react'
import { useDispatch } from 'react-redux'
import { DetailsDrawerStackProvider } from '@ComponentsV2Module'
import { SystemAPI, useViews } from '@FeaturesModule'
import { buildBreadcrumbMap } from '@UtilsModule'
import { ResourceSingleViewDrawer } from '@modules/containers/ResourceSingleView/Drawer'
import {
  canHydrateResource,
  fetchResourceDetails,
} from '@modules/containers/ResourceSingleView/details'
import { hasResourceSingleView } from '@modules/containers/ResourceSingleView/registry'
import {
  clampIndex,
  clampStackIndex,
  getBaseStackEntry,
  getRenderedStackLength,
  getResourceBreadcrumbs,
  getResourceData,
  getResourceId,
  getResourceName,
  getResourceTitle,
  getStackEntry,
  hasValue,
  isSameEntry,
} from '@modules/containers/ResourceSingleView/stack'

const EMPTY_STACK = { entries: [], activeIndex: -1 }

/**
 * Opens any registered resource single view from the current component.
 *
 * @returns {object} Resource single view API
 */
export const useResourceSingleView = () => {
  const dispatch = useDispatch()
  const { getResourceView } = useViews()
  const { data: tabManifest = [] } = SystemAPI.useGetTabManifestQuery()
  const getBreadcrumbs = useMemo(
    () => buildBreadcrumbMap(tabManifest ?? []),
    [tabManifest]
  )
  const [stack, setStack] = useState(EMPTY_STACK)
  const [baseEntry, setBaseEntry] = useState()
  const baseEntryRef = useRef()
  const entries = useMemo(() => {
    const rawEntries =
      baseEntry && stack.entries.length
        ? [baseEntry, ...stack.entries]
        : stack.entries

    return rawEntries.map((entry) => ({
      ...entry,
      title: getResourceTitle(entry?.data, entry?.resource),
      breadcrumbs: getResourceBreadcrumbs(getBreadcrumbs, entry),
    }))
  }, [baseEntry, getBreadcrumbs, stack.entries])
  const activeIndex = clampStackIndex(stack.activeIndex, entries)
  const currentStack = useMemo(
    () => ({ ...stack, activeIndex, entries }),
    [activeIndex, entries, stack]
  )

  const closeResourceSingleView = useCallback(() => setStack(EMPTY_STACK), [])

  const goBackResourceSingleView = useCallback(() => {
    setStack(({ entries: stackEntries, activeIndex: stackActiveIndex }) => ({
      entries: stackEntries,
      activeIndex: clampIndex(
        stackActiveIndex - 1,
        getRenderedStackLength(stackEntries, baseEntryRef.current)
      ),
    }))
  }, [])

  const goForwardResourceSingleView = useCallback(() => {
    setStack(({ entries: stackEntries, activeIndex: stackActiveIndex }) => ({
      entries: stackEntries,
      activeIndex: clampIndex(
        stackActiveIndex + 1,
        getRenderedStackLength(stackEntries, baseEntryRef.current)
      ),
    }))
  }, [])

  const goToResourceSingleView = useCallback((index) => {
    setStack(({ entries: stackEntries }) => ({
      entries: stackEntries,
      activeIndex: clampIndex(
        index,
        getRenderedStackLength(stackEntries, baseEntryRef.current)
      ),
    }))
  }, [])

  const registerResourceSingleViewBase = useCallback(
    (resource, data, props = {}) => {
      const resourceName = getResourceName(resource)

      if (!hasValue(getResourceId(getResourceData(data)))) return false
      if (!hasResourceSingleView(resourceName)) return false

      const nextBaseEntry = getBaseStackEntry(resourceName, data, props)

      if (isSameEntry(baseEntryRef.current, nextBaseEntry)) {
        baseEntryRef.current = nextBaseEntry
        setBaseEntry((currentEntry) =>
          isSameEntry(currentEntry, nextBaseEntry)
            ? nextBaseEntry
            : currentEntry
        )

        return true
      }

      baseEntryRef.current = nextBaseEntry
      setBaseEntry(nextBaseEntry)
      setStack(EMPTY_STACK)

      return true
    },
    []
  )

  const clearResourceSingleViewBase = useCallback((resource, data) => {
    const nextBaseEntry = getBaseStackEntry(resource, data)

    if (!isSameEntry(baseEntryRef.current, nextBaseEntry)) return

    baseEntryRef.current = undefined
    setBaseEntry(undefined)
    setStack(EMPTY_STACK)
  }, [])

  const hydrateResourceSingleView = useCallback(
    async (entry) => {
      const resourceData = await fetchResourceDetails(dispatch, entry)

      setStack((stackState) => ({
        ...stackState,
        entries: stackState.entries.map((currentEntry) =>
          currentEntry.key === entry.key
            ? {
                ...currentEntry,
                ...(resourceData && {
                  data: { ...currentEntry.data, ...resourceData },
                }),
                isHydrating: false,
              }
            : currentEntry
        ),
      }))
    },
    [dispatch]
  )

  const openResourceSingleView = useCallback(
    (resource, data, props = {}) => {
      const resourceName = getResourceName(resource)

      if (!hasResourceSingleView(resourceName)) return false

      const entry = getStackEntry(resourceName, data, props)
      const nextEntry = {
        ...entry,
        isHydrating: canHydrateResource(entry),
      }

      setStack(({ entries: stackEntries, activeIndex: stackActiveIndex }) => {
        const childActiveIndex = baseEntry
          ? stackActiveIndex - 1
          : stackActiveIndex
        const nextEntries = [
          ...stackEntries.slice(0, Math.max(childActiveIndex + 1, 0)),
          nextEntry,
        ]

        return {
          entries: nextEntries,
          activeIndex: (baseEntry ? 1 : 0) + nextEntries.length - 1,
        }
      })

      hydrateResourceSingleView(nextEntry)

      return true
    },
    [baseEntry, hydrateResourceSingleView]
  )

  const ResourceSingleView = useCallback(
    (props) =>
      entries
        .slice(baseEntry ? 1 : 0, activeIndex + 1)
        .map((entry, childIndex) => {
          const index = baseEntry ? childIndex + 1 : childIndex

          return (
            <DetailsDrawerStackProvider
              key={entry.key}
              value={{
                entries,
                activeIndex,
                index,
                isActive: index === activeIndex,
                breadcrumbs: entry.breadcrumbs,
                goBack: goBackResourceSingleView,
                goForward: goForwardResourceSingleView,
                goTo: goToResourceSingleView,
              }}
            >
              <ResourceSingleViewDrawer
                {...props}
                view={entry}
                getResourceView={getResourceView}
                handleClose={closeResourceSingleView}
              />
            </DetailsDrawerStackProvider>
          )
        }),
    [
      activeIndex,
      baseEntry,
      closeResourceSingleView,
      entries,
      getResourceView,
      goBackResourceSingleView,
      goForwardResourceSingleView,
      goToResourceSingleView,
    ]
  )

  return {
    view: entries[activeIndex],
    stack: currentStack,
    ResourceSingleView,
    clearResourceSingleViewBase,
    openResourceSingleView,
    closeResourceSingleView,
    goBackResourceSingleView,
    goForwardResourceSingleView,
    goToResourceSingleView,
    registerResourceSingleViewBase,
  }
}
