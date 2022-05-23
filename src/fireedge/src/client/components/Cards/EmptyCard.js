/* ------------------------------------------------------------------------- *
 * Copyright 2002-2022, OpenNebula Project, OpenNebula Systems               *
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
import { memo } from 'react'
import PropTypes from 'prop-types'

import { Card, CardHeader, Fade } from '@mui/material'
import makeStyles from '@mui/styles/makeStyles'
import { Tr } from 'client/components/HOC'
import { T } from 'client/constants'

const useStyles = makeStyles((theme) => ({
  root: {
    height: '100%',
  },
  content: {
    height: '100%',
    minHeight: 140,
    padding: theme.spacing(1),
    textAlign: 'center',
  },
}))

const EmptyCard = memo(({ title }) => {
  const classes = useStyles()

  return (
    <Fade in unmountOnExit>
      <Card className={classes.root} variant="outlined">
        <CardHeader
          subheader={Tr(title ?? T.Empty)}
          className={classes.content}
        />
      </Card>
    </Fade>
  )
})

EmptyCard.propTypes = {
  title: PropTypes.oneOfType([PropTypes.string, PropTypes.array]),
}

EmptyCard.defaultProps = {
  title: undefined,
}

EmptyCard.displayName = 'EmptyCard'

export default EmptyCard
