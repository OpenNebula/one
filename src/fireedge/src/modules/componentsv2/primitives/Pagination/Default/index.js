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
import { Box, Typography } from '@mui/material'
import { forwardRef, Component, useEffect, useState, Fragment } from 'react'
import PropTypes from 'prop-types'
import { NavArrowLeft, NavArrowRight, MoreHoriz } from 'iconoir-react'
import { Toggle } from '@modules/componentsv2/primitives/Buttons/Toggle/Single'
import { Button } from '@modules/componentsv2/primitives/Buttons/Default'
import { getStyles } from '@modules/componentsv2/primitives/Pagination/Default/styles'
import { useControllableState } from '@HooksModule'
import { Dropdown } from '@modules/componentsv2/primitives/Dropdown'
import { PAGINATION_SIZES, T } from '@ConstantsModule'
import { useTranslation } from '@ProvidersModule'

/**
 * Pagination controller. All state is managed by the parent.
 *
 * @param {object} root0 - Params
 * @param {number} root0.pageIndex - Current page index (0-based)
 * @param {number} root0.pageCount - Total number of pages
 * @param {Function} root0.onPageChange - Callback fired with new page index (0-based)
 * @param {number} [root0.pageSize] - Current page size
 * @param {number[]} [root0.pageSizeOptions] - Renders Results per page when provided
 * @param {Function} [root0.onPageSizeChange] - Callback fired with new page size
 * @returns {Component} Pagination component
 */
export const Pagination = forwardRef(
  (
    {
      pageIndex,
      pageCount = 1,
      cutoffRange = 6,
      onPageChange,
      isPageSizeController,
      pageSize = 10,
      paginationSizes = PAGINATION_SIZES,
      onPageSizeChange,
      ...opts
    },
    ref
  ) => {
    const { translate } = useTranslation()
    const [currentIndex, setCurrentIndex] = useControllableState({
      value: pageIndex,
      defaultValue: 0,
      onChange: onPageChange,
    })

    const [currentSegment, setCurrentSegment] = useState(0)
    const currentCutoffRange = Math.max(1, Number(cutoffRange) || 1)
    const currentPageCount = Math.max(1, Number(pageCount) || 1)
    const lastIndex = currentPageCount - 1
    const displayIndex = Math.min(
      Math.max(Number(currentIndex) || 0, 0),
      lastIndex
    )
    const displaySegment = Math.min(
      Math.max(currentSegment, 0),
      Math.floor(lastIndex / currentCutoffRange)
    )

    useEffect(() => {
      if (displayIndex !== currentIndex) {
        setCurrentIndex(displayIndex)
      }

      setCurrentSegment((prev) =>
        prev === displaySegment ? prev : displaySegment
      )
    }, [currentIndex, displayIndex, displaySegment, setCurrentIndex])

    const canIncrement = displayIndex + 1 < currentPageCount
    const canDecrement = displayIndex > 0

    return (
      <Box
        ref={ref}
        sx={(theme) => getStyles({ theme })}
        className="pagination-container"
        {...opts}
      >
        <Box className="pagination-index-container">
          <Button
            type={'secondary'}
            iconOnly={<NavArrowLeft width={16} height={16} />}
            onClick={() => {
              if (!canDecrement) return
              const next = displayIndex - 1

              if (next < currentCutoffRange * displaySegment) {
                setCurrentSegment(displaySegment - 1)
              }

              setCurrentIndex(next)
            }}
            isDisabled={!canDecrement}
            sx={{
              width: '40px',
              height: '40px',
            }}
          />
          {Array.from(
            {
              length: Math.min(
                Math.max(
                  0,
                  currentPageCount - displaySegment * currentCutoffRange
                ),
                currentCutoffRange
              ),
            },
            (_, idx) => {
              const realIdx = idx + currentCutoffRange * displaySegment

              return (
                <Fragment key={realIdx}>
                  {displaySegment > 0 && idx === 0 && (
                    <Button
                      type={'secondary'}
                      iconOnly={<MoreHoriz width={16} height={16} />}
                      onClick={() => {
                        const newIndex =
                          (displaySegment - 1) * currentCutoffRange
                        setCurrentSegment(displaySegment - 1)
                        setCurrentIndex(newIndex)
                      }}
                      sx={{
                        width: '40px',
                        height: '40px',
                      }}
                    />
                  )}
                  <Toggle
                    text={String(realIdx + 1)}
                    value={realIdx}
                    isSelected={realIdx === displayIndex}
                    onClick={() => setCurrentIndex(realIdx)}
                    size={'medium'}
                    sx={(theme) => ({
                      width: '40px',
                      height: '40px',
                      color: 'text.body',
                      justifyContent: 'center',
                      '&:hover': {
                        color: 'text.actionHover2',
                        bgcolor: 'surface.primary',
                        border: `${theme.borderWidth.sm}px solid ${theme.palette.border.actionHover3}`,
                      },
                    })}
                  />
                  {idx === currentCutoffRange - 1 &&
                    (displaySegment + 1) * currentCutoffRange <
                      currentPageCount && (
                      <Fragment>
                        <Button
                          type={'secondary'}
                          iconOnly={<MoreHoriz width={16} height={16} />}
                          onClick={() => {
                            const newIndex =
                              (displaySegment + 1) * currentCutoffRange
                            setCurrentSegment(displaySegment + 1)
                            setCurrentIndex(newIndex)
                          }}
                          sx={{
                            width: '40px',
                            height: '40px',
                          }}
                        />
                        <Button
                          type={'secondary'}
                          title={String(currentPageCount)}
                          onClick={() => {
                            const targetIndex = currentPageCount - 1
                            setCurrentSegment(
                              Math.floor(targetIndex / currentCutoffRange)
                            )
                            setCurrentIndex(targetIndex)
                          }}
                          sx={{
                            width: '40px',
                            height: '40px',
                          }}
                        />
                      </Fragment>
                    )}
                </Fragment>
              )
            }
          )}

          <Button
            type={'secondary'}
            iconOnly={<NavArrowRight width={16} height={16} />}
            onClick={() => {
              if (!canIncrement) return
              const next = displayIndex + 1

              if (next >= currentCutoffRange * (displaySegment + 1)) {
                setCurrentSegment(displaySegment + 1)
              }

              setCurrentIndex(next)
            }}
            isDisabled={!canIncrement}
            sx={{
              width: '40px',
              height: '40px',
            }}
          />
        </Box>

        {isPageSizeController && (
          <Box className="pagination-size-container">
            <Typography className={'page-size-title'}>
              {translate(T.ResultsPerPage)}
            </Typography>
            <Dropdown
              isMultipleSelectable={false}
              initialValue={pageSize}
              options={paginationSizes}
              onChange={onPageSizeChange}
              rowsDisplayed={PAGINATION_SIZES?.length ?? 5}
            />
          </Box>
        )}
      </Box>
    )
  }
)

Pagination.propTypes = {
  pageIndex: PropTypes.number,
  pageCount: PropTypes.number,
  cutoffRange: PropTypes.number,
  onPageChange: PropTypes.func,
  pageSize: PropTypes.number,
  pageSizeOptions: PropTypes.arrayOf(PropTypes.number),
  onPageSizeChange: PropTypes.func,
  isPageSizeController: PropTypes.bool,
  paginationSizes: PropTypes.arrayOf(PropTypes.number),
}

Pagination.displayName = 'Pagination'
