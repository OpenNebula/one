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
import React, { memo } from 'react'
import { string } from 'prop-types'

import { Box, makeStyles, Typography } from '@material-ui/core'
import { WarningCircledOutline as WarningIcon } from 'iconoir-react'
import { Tr } from 'client/components/HOC/Translate'

const useStyles = makeStyles(theme => ({
  root: {
    color: theme.palette.error.dark,
    display: 'flex',
    alignItems: 'center'
  },
  text: {
    ...theme.typography.body1,
    paddingLeft: theme.spacing(1),
    overflowWrap: 'anywhere'
  }
}))

const ErrorHelper = memo(({ label, ...rest }) => {
  const classes = useStyles()

  return (
    <Box component='span' className={classes.root} {...rest}>
      <WarningIcon size={18} />
      <Typography className={classes.text} component='span' data-cy='error-text'>
        {Tr(label)}
      </Typography>
    </Box>
  )
})

ErrorHelper.propTypes = {
  label: string
}

ErrorHelper.defaultProps = {
  label: 'Error'
}

ErrorHelper.displayName = 'ErrorHelper'

export default ErrorHelper
