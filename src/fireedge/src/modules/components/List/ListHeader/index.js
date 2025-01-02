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
import { useMemo, memo } from 'react'
import { useTheme, Box, Typography, InputBase } from '@mui/material'
import PropTypes from 'prop-types'

import {
  RefreshDouble as RefreshIcon,
  AddCircledOutline as AddIcon,
  Search as SearchIcon,
} from 'iconoir-react'

import { SubmitButton } from '@modules/components/FormControl'
import { Tr } from '@modules/components/HOC'
import { T } from '@ConstantsModule'

import listHeaderStyles from '@modules/components/List/ListHeader/styles'

const ListHeader = memo(
  ({
    title,
    hasReloadButton,
    reloadButtonProps,
    hasAddButton,
    addButtonProps,
    hasSearch,
    searchProps,
  }) => {
    const theme = useTheme()
    const classes = useMemo(() => listHeaderStyles(theme), [theme])

    return (
      <Box className={classes.root}>
        <Box className={classes.title}>
          {!!(hasReloadButton || reloadButtonProps) && (
            <SubmitButton icon={<RefreshIcon />} {...reloadButtonProps} />
          )}
          {title && (
            <Typography variant="h5" className={classes.titleText}>
              {Tr(title)}
            </Typography>
          )}
        </Box>
        <Box className={classes.actions}>
          {!!(hasAddButton || addButtonProps) && (
            <SubmitButton
              color="secondary"
              icon={<AddIcon />}
              {...addButtonProps}
            />
          )}
          {!!(hasSearch || searchProps) && (
            <Box className={classes.search}>
              <Box className={classes.searchIcon}>
                <SearchIcon />
              </Box>
              <InputBase
                type="search"
                onChange={searchProps.handleChange}
                fullWidth
                placeholder={`${Tr(T.Search)}...`}
                classes={{
                  root: classes.inputRoot,
                  input: classes.inputInput,
                }}
              />
            </Box>
          )}
        </Box>
      </Box>
    )
  },
  (prev, next) =>
    prev?.reloadButtonProps.isSubmitting ===
    next?.reloadButtonProps.isSubmitting
)

ListHeader.propTypes = {
  title: PropTypes.string,
  hasReloadButton: PropTypes.bool,
  reloadButtonProps: PropTypes.shape({
    onClick: PropTypes.func,
    isSubmitting: PropTypes.bool,
  }),
  hasAddButton: PropTypes.bool,
  addButtonProps: PropTypes.shape({
    onClick: PropTypes.func,
    isSubmitting: PropTypes.bool,
  }),
  hasSearch: PropTypes.bool,
  searchProps: PropTypes.shape({
    query: PropTypes.string,
    handleChange: PropTypes.func,
  }),
}

ListHeader.defaultProps = {
  title: undefined,
  hasReloadButton: false,
  reloadButtonProps: undefined,
  hasAddButton: false,
  addButtonProps: undefined,
  searchProps: undefined,
}

ListHeader.displayName = 'ListHeader'

export default ListHeader
