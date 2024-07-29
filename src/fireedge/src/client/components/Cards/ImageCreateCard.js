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
import { ReactElement, memo } from 'react'
import PropTypes from 'prop-types'
import { Typography, Paper, Grid, Box } from '@mui/material'
import makeStyles from '@mui/styles/makeStyles'

const useStyles = makeStyles(
  ({ palette, typography, breakpoints, shadows }) => ({
    root: {
      padding: '0.8em',
      color: palette.text.primary,
      backgroundColor: palette.background.paper,
      fontWeight: typography.fontWeightRegular,
      fontSize: '1em',
      borderRadius: 6,
      display: 'flex',
      gap: 8,
      cursor: 'pointer',
      [breakpoints.down('md')]: {
        flexWrap: 'wrap',
      },
    },
    figure: {
      flexBasis: '10%',
      aspectRatio: '16/9',
      display: 'flex',
      justifyContent: 'center',
    },
    main: {
      flex: 'auto',
      overflow: 'hidden',
      alignSelf: 'center',
    },
    title: {
      color: palette.text.primary,
      display: 'flex',
      gap: 6,
      alignItems: 'center',
    },
  })
)

const ImageCreateCard = memo(
  /**
   * @param {object} props - Props
   * @param {string} props.name - Card name
   * @param {Function} props.onClick - Card name
   * @param {ReactElement} props.Icon - Card Icon
   * @returns {ReactElement} - Card
   */
  ({ name = '', onClick, Icon }) => {
    const classes = useStyles()

    return (
      <Grid item xs={12} md={6} onClick={onClick} data-cy="create">
        <Paper variant="outlined" className={classes.root}>
          {Icon && (
            <Box className={classes.figure}>
              <Icon />
            </Box>
          )}

          <div className={classes.main}>
            <div className={classes.title}>
              <Typography noWrap component="span">
                {name}
              </Typography>
            </div>
          </div>
        </Paper>
      </Grid>
    )
  }
)

ImageCreateCard.propTypes = {
  name: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired,
  Icon: PropTypes.oneOfType([PropTypes.node, PropTypes.object]),
}

ImageCreateCard.displayName = 'ImageCreateCard'

export default ImageCreateCard
