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
import { Checkbox, Grid, TableCell, TableRow } from '@mui/material'
import makeStyles from '@mui/styles/makeStyles'
import EnhancedTableStyles from 'client/components/Tables/Enhanced/styles'
import { SERVER_CONFIG } from 'client/constants'
import { useAuth } from 'client/features/Auth'
import get from 'lodash.get'
import PropTypes from 'prop-types'
import { ReactElement, memo } from 'react'

const listStyles = makeStyles(({ palette }) => ({
  row: {
    '&': {
      cursor: 'pointer',
    },
    '&.selected': {
      boxShadow: `inset 0px -0.5px 0px 2px ${palette.secondary.main}`,
    },
  },
  checkbox: {
    '&': {
      color: `${palette.secondary.contrastText} !important`,
    },
  },
}))

/**
 * @param {object} props - Props
 * @returns {ReactElement} Generic Row
 */
const RowStyle = memo(
  ({
    original = {},
    value = {},
    onClickLabel,
    onDeleteLabel,
    globalErrors,
    headerList = [],
    className,
    rowDataCy = '',
    isSelected = false,
    toggleRowSelected = () => {},
    onClick: onClickRow = () => {},
    enabledFullScreen = false,
    ...props
  }) => {
    const { ID = '' } = original
    const styles = listStyles()

    const handleChange = (event) => {
      event?.stopPropagation()
      toggleRowSelected(event.target.checked)
    }

    return (
      <TableRow
        data-cy={`list-${rowDataCy}-${ID}`}
        {...props}
        className={`${styles.row} ${className}`}
      >
        {enabledFullScreen && (
          <TableCell>
            <Checkbox
              checked={isSelected}
              onChange={handleChange}
              className={`${styles.checkbox}`}
            />
          </TableCell>
        )}
        {headerList.map(({ id, accessor }) => {
          switch (typeof accessor) {
            case 'string':
              return (
                <TableCell onClick={onClickRow} key={id}>
                  {get(original, accessor)}
                </TableCell>
              )
            case 'function':
              return (
                <TableCell onClick={onClickRow} key={id}>
                  {accessor(original, value)}
                </TableCell>
              )
            default:
              return ''
          }
        })}
      </TableRow>
    )
  },
  (prev, next) => prev.className === next.className
)

RowStyle.propTypes = {
  original: PropTypes.object,
  value: PropTypes.object,
  onClickLabel: PropTypes.func,
  onDeleteLabel: PropTypes.func,
  globalErrors: PropTypes.array,
  headerList: PropTypes.oneOfType([PropTypes.array, PropTypes.bool]),
  rowDataCy: PropTypes.string,
  className: PropTypes.string,
  isSelected: PropTypes.bool,
  toggleRowSelected: PropTypes.func,
  onClick: PropTypes.func,
  enabledFullScreen: PropTypes.bool,
}

RowStyle.displayName = 'RowStyle'

const CardWrapper = memo(
  ({ children, toggleRowSelected = () => {}, isSelected = false }) => {
    const styles = listStyles()
    const cardStyles = EnhancedTableStyles()

    const handleChange = (event) => {
      event?.stopPropagation()
      toggleRowSelected(event.target.checked)
    }

    return (
      <Grid container spacing={1} alignItems="center">
        <Grid item xs="auto">
          <Checkbox
            checked={isSelected}
            onChange={handleChange}
            className={`${styles.checkbox}`}
          />
        </Grid>
        <Grid item xs className={`${cardStyles.body}`}>
          {children}
        </Grid>
      </Grid>
    )
  },
  (prev, next) => prev.className === next.className
)

CardWrapper.propTypes = {
  children: PropTypes.any,
  toggleRowSelected: PropTypes.func,
  isSelected: PropTypes.bool,
}

CardWrapper.displayName = 'CardWrapper'

const SwitchRowComponent = memo(
  ({ props, hasHeader, RowCardComponent, enabledFullScreen }) => {
    const internalProps = { ...props }
    let Component = ''

    if (hasHeader) {
      internalProps.enabledFullScreen = enabledFullScreen
      Component = <RowStyle {...internalProps} />
    } else {
      Component = <RowCardComponent {...internalProps} />
      if (enabledFullScreen) {
        Component = (
          <CardWrapper {...internalProps}>
            <RowCardComponent {...internalProps} />
          </CardWrapper>
        )
      }
    }

    return Component
  },
  (prev, next) => prev.RowCardComponent === next.RowCardComponent
)

SwitchRowComponent.propTypes = {
  props: PropTypes.any,
  RowCardComponent: PropTypes.any,
  hasHeader: PropTypes.bool,
  enabledFullScreen: PropTypes.bool,
}

SwitchRowComponent.displayName = 'SwitchRowComponent'

/**
 * @param {ReactElement} RowCardComponent - Standard row component (Card).
 * @param {boolean} enabledFullScreen - to check if the datatable is in full screen mode
 * @returns {ReactElement} Generic Row
 */
const WrapperRow = (RowCardComponent, enabledFullScreen) => {
  const { settings: { FIREEDGE: fireedge = {} } = {} } = useAuth()
  const { ROW_STYLE } = fireedge
  const { rowStyle } = SERVER_CONFIG

  const data = ROW_STYLE || rowStyle
  const header = data === 'list'

  const component = memo(
    (props) => (
      <SwitchRowComponent
        props={props}
        hasHeader={header}
        RowCardComponent={RowCardComponent}
        enabledFullScreen={enabledFullScreen}
      />
    ),
    (prev, next) => prev.className === next.className
  )

  component.displayName = 'component'

  return {
    component,
    header,
  }
}

export default WrapperRow
