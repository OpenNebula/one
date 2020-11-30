import React, { memo } from 'react'
import PropTypes from 'prop-types'

import { Box, Typography, InputBase } from '@material-ui/core'
import SearchIcon from '@material-ui/icons/Search'
import RefreshIcon from '@material-ui/icons/Autorenew'

import SubmitButton from 'client/components/FormControl/SubmitButton'
import listHeaderStyles from 'client/components/List/ListHeader/styles'
import { Tr } from 'client/components/HOC'

const ListHeader = memo(({
  title,
  hasReloadButton,
  reloadButtonProps,
  hasSearch,
  searchProps
}) => {
  const classes = listHeaderStyles()
  const { handleChange } = searchProps

  return (
    <Box p={3} className={classes.root}>
      {hasReloadButton && (
        <SubmitButton fab label={<RefreshIcon />} {...reloadButtonProps} />
      )}
      {title && (
        <Typography variant="h5" className={classes.title}>
          {Tr(title)}
        </Typography>
      )}
      {hasSearch && (
        <Box className={classes.search}>
          <Box className={classes.searchIcon}>
            <SearchIcon />
          </Box>
          <InputBase
            type="search"
            onChange={handleChange}
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
  hasSearch: PropTypes.bool,
  searchProps: PropTypes.shape({
    query: PropTypes.string,
    handleChange: PropTypes.func
  })
}

ListHeader.defaultProps = {
  title: undefined,
  hasReloadButton: false,
  reloadButtonProps: {
    onClick: undefined,
    isSubmitting: false
  },
  searchProps: {
    query: undefined,
    handleChange: undefined
  }
}

ListHeader.displayName = 'ListHeader'

export default ListHeader
