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
import { memo, useEffect } from 'react'

import { styled, Link, Typography } from '@mui/material'

import { useSystem, useSystemApi } from 'client/features/One'
import { BY } from 'client/constants'

const FooterBox = styled('footer')(({ theme }) => ({
  color: theme.palette.primary.contrastText,
  backgroundColor: theme.palette.primary.light,
  position: 'absolute',
  width: '100%',
  left: 'auto',
  bottom: 0,
  right: 0,
  zIndex: theme.zIndex.appBar,
  textAlign: 'center',
  padding: theme.spacing(0.6)
}))

const HeartIcon = styled('span')(({ theme }) => ({
  margin: theme.spacing(0, 1),
  color: theme.palette.error.dark,
  '&:before': {
    content: "'❤️'"
  }
}))

const Footer = memo(() => {
  const { version } = useSystem()
  const { getOneVersion } = useSystemApi()

  useEffect(() => {
    !version && getOneVersion()
  }, [])

  return (
    <FooterBox>
      <Typography variant='body2'>
        {'Made with'}
        <HeartIcon role='img' aria-label='heart-emoji' />
        <Link href={BY.url} color='primary.contrastText'>
          {BY.text}
          {version}
        </Link>
      </Typography>
    </FooterBox>
  )
})

Footer.displayName = 'Footer'

export default Footer
