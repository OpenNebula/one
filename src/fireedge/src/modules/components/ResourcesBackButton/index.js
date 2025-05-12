/* ------------------------------------------------------------------------- *
 * Copyright 2002-2025, OpenNebula Project, OpenNebula Systems               *
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
import { Box, useTheme, useMediaQuery } from '@mui/material'
import SplitPane from '@modules/components/SplitPane'
import { GlobalActions } from '@modules/components/Tables/Enhanced/Utils'
import Pagination from '@modules/components/Tables/Enhanced/pagination'
import EnhancedTableStyles from '@modules/components/Tables/Enhanced/styles'
import { SERVER_CONFIG } from '@ConstantsModule'
import { useAuth, useGeneral, useGeneralApi } from '@FeaturesModule'
import PropTypes from 'prop-types'
import { memo, useCallback, useEffect, useMemo, useState } from 'react'

const heightWindowRow = 30
const heightGutterRow = 40

const defaultPropsResize = `1fr ${heightGutterRow}px 1fr`

const Switch = memo(({ valid, invalid, condition }) =>
  condition ? valid : invalid
)

Switch.propTypes = {
  valid: PropTypes.any,
  invalid: PropTypes.any,
  condition: PropTypes.bool,
}
Switch.displayName = 'Switch'

const ResourcesBackButton = memo(
  ({
    selectedRows = [],
    table = () => undefined,
    info = () => undefined,
    simpleGroupsTags = () => undefined,
    setSelectedRows = () => undefined,
    actions = [],
    ...restProps
  }) => {
    // Get styles
    const theme = useTheme()
    const styles = useMemo(
      () =>
        EnhancedTableStyles({
          ...theme,
          readOnly: false,
        }),
      [theme]
    )

    // Check height in order to adjust info tab
    const upExtraLarge = useMediaQuery(
      `(min-height: ${theme?.heightBreakpoints.extraLarge})`
    )
    const upLarge = useMediaQuery(
      `(min-height: ${theme?.heightBreakpoints.large})`
    )
    const upMedium = useMediaQuery(
      `(min-height: ${theme?.heightBreakpoints.medium})`
    )
    const upSmall = useMediaQuery(
      `(min-height: ${theme?.heightBreakpoints.small})`
    )
    const upTiny = useMediaQuery(
      `(min-height: ${theme?.heightBreakpoints.tiny})`
    )

    const { settings: { FIREEDGE: fireedge = {} } = {} } = useAuth()
    const { FULL_SCREEN_INFO, ROW_STYLE } = fireedge
    const { fullViewMode, rowStyle } = SERVER_CONFIG

    const { setTableViewMode } = useGeneralApi()

    useEffect(() => {
      setTableViewMode(ROW_STYLE || rowStyle)
    }, [ROW_STYLE, rowStyle])

    const { isFullMode } = useGeneral()
    const { setFullMode, setBreadcrumb } = useGeneralApi()

    const [showInfo, setShowInfo] = useState(() => false)
    const [propsResize, setPropsResize] = useState(() => defaultPropsResize)
    const [pageIndex, setPageIndex] = useState(() => 0)

    const countSelectedRows = selectedRows?.length
    const moreThanOneSelected = countSelectedRows > 1
    const hasSelectedRows = countSelectedRows > 0

    useEffect(() => {
      const fullMode =
        FULL_SCREEN_INFO === 'true'
          ? true
          : FULL_SCREEN_INFO === 'false'
          ? false
          : fullViewMode
      fullMode ? setFullMode(true) : setFullMode(false)

      setTableViewMode(ROW_STYLE || rowStyle)
    }, [])

    useEffect(() => {
      isFullMode
        ? setPropsResize(`${heightWindowRow}px 100% ${heightGutterRow}px 1fr`)
        : setPropsResize(defaultPropsResize)

      !isFullMode && setPageIndex(0)
    }, [isFullMode])

    useEffect(() => {
      !hasSelectedRows && setShowInfo(false)

      if (selectedRows?.length === 1) {
        const selectRow = selectedRows[0]

        const id =
          selectRow?.values?.id ?? selectRow?.values?.ID ?? 'Unknown ID'

        // Check if a name-like field exists dynamically
        const nameKey = Object.keys(selectRow.values).find(
          (key) => key.toLowerCase() === 'name'
        )
        const name = nameKey ? selectRow.values[nameKey] : null

        // Construct the subsection string conditionally
        const subsection = name ? `#${id} ${name}` : `#${id}`

        setBreadcrumb({ subsection })
      } else {
        setBreadcrumb({})
      }
    }, [selectedRows])

    const selectedRowsTable = useMemo(
      () =>
        selectedRows?.reduce((res, { id }) => ({ ...res, [id]: true }), {}) ||
        [],
      [selectedRows]
    )

    const handleUnselectRow = useCallback(
      (id) => {
        const newRows = selectedRows.filter((item) => item?.id !== id)
        setSelectedRows(newRows)
      },
      [selectedRows]
    )

    const unselect = useCallback(() => {
      setSelectedRows([])
      setShowInfo(false)

      FULL_SCREEN_INFO === 'false' && setFullMode(isFullMode)
    }, [selectedRows])

    const props = {
      ...restProps,
      actions,
      moreThanOneSelected,
      selectedRows,
      selectedRowsTable,
      setSelectedRows,
      handleElement: !isFullMode,
      gotoPage: !isFullMode && selectedRows?.[0]?.gotoPage,
      unselect,
      handleUnselectRow,
      tags: selectedRows,
      resourcesBackButtonClick: useCallback(() => setShowInfo(true)),
      sx: { flex: 1, minHeight: 0 },
    }

    return (
      <SplitPane gridTemplateRows={propsResize} rowMinSize={heightGutterRow}>
        {({ getGridProps, GutterComponent }) => (
          <Switch
            condition={isFullMode}
            valid={
              <Box
                height={1}
                sx={{
                  paddingBottom: '0rem',
                  overflow: hasSelectedRows ? 'auto' : 'hidden',
                }}
              >
                <Switch
                  condition={showInfo && hasSelectedRows}
                  valid={
                    <>
                      <GlobalActions
                        className={styles.actions}
                        globalActions={actions}
                        selectedRows={selectedRows}
                      />
                      <Switch
                        condition={moreThanOneSelected}
                        valid={
                          <Pagination
                            className={styles.pagination}
                            handleChangePage={(index) => setPageIndex(index)}
                            count={countSelectedRows}
                            showPageCount={true}
                            useTableProps={{
                              state: {
                                pageIndex,
                                pageSize: 1,
                              },
                            }}
                          />
                        }
                        invalid=""
                      />
                      {info({
                        ...props,
                        selectedRows: [selectedRows[pageIndex]],
                      })}
                    </>
                  }
                  invalid={table({ ...props, enabledFullScreen: isFullMode })}
                />
              </Box>
            }
            invalid={
              <Box
                id="boxWithProps"
                height={1}
                sx={{
                  paddingBottom: '0rem',
                  overflow: 'hidden', // Prevents the entire Box from scrolling
                }}
                {...(hasSelectedRows && showInfo && getGridProps())}
              >
                {/* Table should scroll, not the entire Box */}
                <Box sx={{ flex: 1, overflow: 'auto' }}>{table(props)}</Box>

                <Switch
                  condition={showInfo}
                  valid={<GutterComponent direction="row" track={1} />}
                  invalid=""
                />

                <Switch
                  condition={hasSelectedRows && showInfo}
                  valid={
                    <Box sx={{ flexShrink: 0, minHeight: 0 }}>
                      <Switch
                        condition={moreThanOneSelected}
                        valid={
                          <Box
                            sx={{
                              height: upExtraLarge
                                ? '700px'
                                : upLarge
                                ? '500px'
                                : upMedium
                                ? '400px'
                                : upSmall
                                ? '250px'
                                : upTiny
                                ? '200px'
                                : '150px',
                              overflow: 'auto',
                            }}
                          >
                            {simpleGroupsTags(props)}
                          </Box>
                        }
                        invalid={
                          <Box
                            sx={{
                              height: upExtraLarge
                                ? '700px'
                                : upLarge
                                ? '500px'
                                : upMedium
                                ? '400px'
                                : upSmall
                                ? '250px'
                                : upTiny
                                ? '200px'
                                : '150px',
                              overflow: 'auto',
                            }}
                          >
                            {info(props)}
                          </Box>
                        }
                      />
                    </Box>
                  }
                  invalid=""
                />
              </Box>
            }
          />
        )}
      </SplitPane>
    )
  }
)

ResourcesBackButton.propTypes = {
  selectedRows: PropTypes.array,
  table: PropTypes.func,
  info: PropTypes.func,
  simpleGroupsTags: PropTypes.func,
  setSelectedRows: PropTypes.func,
  actions: PropTypes.array,
}
ResourcesBackButton.displayName = 'ResourcesBackButton'

export default ResourcesBackButton
