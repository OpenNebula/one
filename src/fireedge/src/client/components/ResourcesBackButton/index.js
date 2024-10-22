/* ------------------------------------------------------------------------- *
 * Copyright 2002-2024, OpenNebula Project, OpenNebula Systems               *
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
import { Box, Grid, IconButton, styled } from '@mui/material'
import { Tr } from 'client/components/HOC'
import SplitPane from 'client/components/SplitPane'
import { GlobalActions } from 'client/components/Tables/Enhanced/Utils'
import Pagination from 'client/components/Tables/Enhanced/pagination'
import EnhancedTableStyles from 'client/components/Tables/Enhanced/styles'
import { T } from 'client/constants'
import { useAuth } from 'client/features/Auth'
import NavArrowLeft from 'iconoir-react/dist/NavArrowLeft'
import OpenInWindow from 'iconoir-react/dist/OpenInWindow'
import OpenNewWindow from 'iconoir-react/dist/OpenNewWindow'
import PropTypes from 'prop-types'
import { memo, useCallback, useEffect, useMemo, useState } from 'react'

const StyledWindowButtons = styled(Grid)(() => ({
  '&': {
    textAlign: 'right',
  },
}))

const StyledRowButtons = styled(Grid)(() => ({
  '&': {
    marginBottom: '.5rem',
  },
}))

const heightWindowRow = 30
const heightGutterRow = 40

const defaultPropsResize = `${heightWindowRow}px 1fr ${heightGutterRow}px 1fr`

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
    const styles = EnhancedTableStyles({
      readOnly: false,
    })

    const { settings: { FIREEDGE: fireedge = {} } = {} } = useAuth()
    const { FULL_SCREEN_INFO } = fireedge

    const [divided, setDivided] = useState(() => false)
    const [showInfo, setShowInfo] = useState(() => false)
    const [propsResize, setPropsResize] = useState(() => defaultPropsResize)
    const [pageIndex, setPageIndex] = useState(() => 0)

    const countSelectedRows = selectedRows?.length
    const moreThanOneSelected = countSelectedRows > 1
    const hasSelectedRows = countSelectedRows > 0

    useEffect(() => {
      FULL_SCREEN_INFO === 'true' && setDivided(true)
    }, [])

    useEffect(() => {
      divided
        ? setPropsResize(`${heightWindowRow}px 100% ${heightGutterRow}px 1fr`)
        : setPropsResize(defaultPropsResize)

      !divided && setPageIndex(0)
    }, [divided])

    useEffect(() => {
      !hasSelectedRows && setShowInfo(false)
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

    const handleBackButton = useCallback(() => {
      setSelectedRows([])
      setShowInfo(false)
    })

    const props = {
      ...restProps,
      actions,
      moreThanOneSelected,
      selectedRows,
      selectedRowsTable,
      setSelectedRows,
      handleElement: !divided,
      gotoPage: !divided && selectedRows?.[0]?.gotoPage,
      unselect: !divided && (() => selectedRows?.[0]?.toggleRowSelected(false)),
      handleUnselectRow,
      tags: selectedRows,
      resourcesBackButtonClick: useCallback(() => setShowInfo(true)),
    }

    return (
      <SplitPane gridTemplateRows={propsResize} rowMinSize={heightGutterRow}>
        {({ getGridProps, GutterComponent }) => (
          <Switch
            condition={divided}
            valid={
              <Box
                height={1}
                sx={{
                  paddingBottom: '3rem',
                  overflow: hasSelectedRows ? 'visible' : 'hidden',
                }}
              >
                <StyledRowButtons container>
                  <Grid item xs={8}>
                    <Switch
                      condition={showInfo && hasSelectedRows}
                      valid={
                        <IconButton
                          onClick={handleBackButton}
                          title={Tr(T.Back)}
                        >
                          <NavArrowLeft />
                        </IconButton>
                      }
                      invalid=""
                    />
                  </Grid>
                  <StyledWindowButtons item xs={4}>
                    <IconButton
                      onClick={() => setDivided(!divided)}
                      title={Tr(T.DivideWindow)}
                    >
                      <OpenInWindow />
                    </IconButton>
                  </StyledWindowButtons>
                </StyledRowButtons>
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
                  invalid={table({ ...props, enabledFullScreen: divided })}
                />
              </Box>
            }
            invalid={
              <Box
                height={1}
                sx={{
                  paddingBottom: '3rem',
                }}
                {...(hasSelectedRows && showInfo && getGridProps())}
              >
                <StyledRowButtons container>
                  <Grid item xs={8} />
                  <StyledWindowButtons item xs={4}>
                    <IconButton
                      onClick={() => setDivided(!divided)}
                      title={Tr(T.DivideWindow)}
                    >
                      <OpenNewWindow />
                    </IconButton>
                  </StyledWindowButtons>
                </StyledRowButtons>
                {table(props)}
                <Switch
                  condition={showInfo}
                  valid={<GutterComponent direction="row" track={2} />}
                  invalid=""
                />
                <Switch
                  condition={hasSelectedRows && showInfo}
                  valid={
                    <Switch
                      condition={moreThanOneSelected}
                      valid={simpleGroupsTags(props)}
                      invalid={info(props)}
                    />
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
