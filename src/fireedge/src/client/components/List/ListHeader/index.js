import React, { memo } from 'react'
import PropTypes from 'prop-types'

import { Box, Typography, InputBase } from '@material-ui/core'
import SearchIcon from '@material-ui/icons/Search'
import RefreshIcon from '@material-ui/icons/Autorenew'
import AddIcon from '@material-ui/icons/AddCircle'

import SubmitButton from 'client/components/FormControl/SubmitButton'
import listHeaderStyles from 'client/components/List/ListHeader/styles'
import { Tr } from 'client/components/HOC'

const ListHeader = memo(({
  title,
  hasReloadButton,
  reloadButtonProps,
  hasAddButton,
  addButtonProps,
  hasSearch,
  searchProps
}) => {
  const classes = listHeaderStyles()

  return (
    <Box className={classes.root}>
      <Box className={classes.title}>
        {!!(hasReloadButton || reloadButtonProps) && (
          <SubmitButton icon label={<RefreshIcon />} {...reloadButtonProps} />
        )}
        {title && (
          <Typography variant="h5" className={classes.titleText}>
            {Tr(title)}
          </Typography>
        )}
      </Box>
      <Box className={classes.actions}>
        {!!(hasAddButton || addButtonProps) && (
          <SubmitButton color="secondary" icon label={<AddIcon />} {...addButtonProps} />
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
              placeholder="Search..."
              classes={{
                root: classes.inputRoot,
                input: classes.inputInput
              }}
            />
          </Box>
        )}
      </Box>
    </Box>
  )
}, (prev, next) =>
  prev?.reloadButtonProps.isSubmitting === next?.reloadButtonProps.isSubmitting)

ListHeader.propTypes = {
  title: PropTypes.string,
  hasReloadButton: PropTypes.bool,
  reloadButtonProps: PropTypes.shape({
    onClick: PropTypes.func,
    isSubmitting: PropTypes.bool
  }),
  hasAddButton: PropTypes.bool,
  addButtonProps: PropTypes.shape({
    onClick: PropTypes.func,
    isSubmitting: PropTypes.bool
  }),
  hasSearch: PropTypes.bool,
  searchProps: PropTypes.shape({
    query: PropTypes.string,
    handleChange: PropTypes.func
  })
}

ListHeader.defaultProps = {
  title: undefined,
  hasReloadButton: false,
  reloadButtonProps: undefined,
  hasAddButton: false,
  addButtonProps: undefined,
  searchProps: undefined
}

ListHeader.displayName = 'ListHeader'

export default ListHeader
