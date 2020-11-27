import React, { memo } from 'react'
import PropTypes from 'prop-types'

import { makeStyles, Box, Typography, Divider } from '@material-ui/core'
import RefreshIcon from '@material-ui/icons/Autorenew'

import SubmitButton from 'client/components/FormControl/SubmitButton'

const useStyles = makeStyles(theme => ({
  title: { marginLeft: theme.spacing(1) }
}))

const ListHeader = memo(({
  title,
  hasReloadButton,
  reloadButtonProps
}) => {
  const classes = useStyles()

  return (
    <>
      <Box p={3} display="flex" alignItems="center">
        {hasReloadButton && (
          <SubmitButton fab label={<RefreshIcon />} {...reloadButtonProps} />
        )}
        {title && (
          <Typography variant="h5" className={classes.title}>
            {title}
          </Typography>
        )}
      </Box>
      <Divider />
    </>
  )
})

ListHeader.propTypes = {
  title: PropTypes.string,
  hasReloadButton: PropTypes.bool,
  reloadButtonProps: PropTypes.shape({
    onClick: PropTypes.func,
    isSubmitting: PropTypes.bool
  })
}

ListHeader.defaultProps = {
  title: undefined,
  hasReloadButton: false,
  reloadButtonProps: {
    onClick: undefined,
    isSubmitting: false
  }
}

ListHeader.displayName = 'ListHeader'

export default ListHeader
