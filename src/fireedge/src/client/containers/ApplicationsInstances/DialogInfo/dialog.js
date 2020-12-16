import * as React from 'react'
import PropTypes from 'prop-types'

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  useMediaQuery
} from '@material-ui/core'

import { Tr } from 'client/components/HOC'
import { T } from 'client/constants'

const CustomDialog = ({ title, handleClose, children }) => {
  const isMobile = useMediaQuery(theme => theme.breakpoints.only('xs'))

  return (
    <Dialog
      fullScreen={isMobile}
      open
      onClose={handleClose}
      maxWidth="xl"
      scroll="paper"
      PaperProps={{
        style: {
          height: isMobile ? '100%' : '90%',
          width: isMobile ? '100%' : '90%'
        }
      }}
    >
      <DialogTitle>{title}</DialogTitle>
      <DialogContent
        dividers
        style={{
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {children}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>
          {Tr(T.Cancel)}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

CustomDialog.propTypes = {
  title: PropTypes.string,
  handleClose: PropTypes.func,
  children: PropTypes.any
}

CustomDialog.defaultProps = {
  title: 'Application',
  handleClose: undefined,
  children: undefined
}

export default CustomDialog
