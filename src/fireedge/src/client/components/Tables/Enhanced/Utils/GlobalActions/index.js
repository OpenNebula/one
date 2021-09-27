/* ------------------------------------------------------------------------- *
 * Copyright 2002-2021, OpenNebula Project, OpenNebula Systems               *
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
import { JSXElementConstructor, useMemo } from 'react'
import PropTypes from 'prop-types'
import { Row } from 'react-table'
import { makeStyles } from '@material-ui/core'

import Action, { ActionPropTypes, GlobalAction } from 'client/components/Tables/Enhanced/Utils/GlobalActions/Action'

const useStyles = makeStyles({
  root: {
    display: 'flex',
    gap: '1em',
    alignItems: 'center',
    flexWrap: 'wrap'
  }
})

/**
 * Render bulk actions.
 *
 * @param {object} props - Props
 * @param {GlobalAction[]} props.globalActions - Possible bulk actions
 * @param {Row[]} props.selectedRows - Selected rows
 * @returns {JSXElementConstructor} Component JSX with all actions
 */
const GlobalActions = ({ globalActions, selectedRows }) => {
  const classes = useStyles()

  const numberOfRowSelected = Object.keys(selectedRows)?.length

  const [actionsSelected, actionsNoSelected] = useMemo(
    () => globalActions.reduce((memoResult, item) => {
      const { selected = false } = item

      selected ? memoResult[0].push(item) : memoResult[1].push(item)

      return memoResult
    }, [[], []]),
    [globalActions]
  )

  return (
    <div className={classes.root}>
      {actionsNoSelected?.map(item => (
        <Action key={item.accessor} item={item} />
      ))}
      {numberOfRowSelected > 0 && (
        actionsSelected?.map((item, idx) => {
          const { min = 1, max = Number.MAX_SAFE_INTEGER } = item?.selected ?? {}
          const key = item.accessor ?? item.label ?? item.tooltip ?? idx

          if (min < numberOfRowSelected && numberOfRowSelected > max) {
            return null
          }

          return (
            <Action key={key} item={item} selectedRows={selectedRows} />
          )
        })
      )}
    </div>
  )
}

GlobalActions.propTypes = {
  globalActions: PropTypes.arrayOf(ActionPropTypes),
  selectedRows: PropTypes.array
}

export default GlobalActions
