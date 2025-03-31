/* ------------------------------------------------------------------------- *
 * Copyright 2002-2025, OpenNebula Project, OpenNebula Systems               *
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
import { memo, useMemo } from 'react'
import { useTheme, Link, Typography, styled } from '@mui/material'
import { css } from '@emotion/css'

import { PATH } from '@modules/components/path'
import { Translate } from '@modules/components/HOC'
import { StatusChip } from '@modules/components/Status'
import { BY, SUPPORT_WEBSITE, T } from '@ConstantsModule'
import { SupportAPI, SystemAPI } from '@FeaturesModule'
import { Link as RouterLink, generatePath } from 'react-router-dom'

const FooterBox = styled('footer')(({ theme }) => ({
  color: theme.palette.footer?.color,
  backgroundColor: theme?.palette?.footer?.backgroundColor,
  position: 'absolute',
  width: '100%',
  left: 'auto',
  bottom: 0,
  right: 0,
  textAlign: 'center',
  padding: theme.spacing(0.6),
}))

const HeartIcon = styled('span')(({ theme }) => ({
  margin: theme.spacing(0, 1),
  color: theme.palette.error.dark,
  '&:before': {
    content: "'❤️'",
  },
}))

const useStyles = (theme) => ({
  links: css({
    textDecoration: 'none',
    color: theme.palette.footer?.color,
  }),
})

const Footer = memo(() => {
  const theme = useTheme()
  const classes = useMemo(() => useStyles(theme), [theme])
  const { isError, isSuccess } = SupportAPI.useCheckOfficialSupportQuery()
  const { data: version } = SystemAPI.useGetOneVersionQuery()

  return (
    <FooterBox
      sx={{
        backgroundColor: (themeSunstone) =>
          themeSunstone.palette?.topbar?.background,
      }}
    >
      <Typography variant="body2">
        <Translate word={T.MadeWith} />
        <HeartIcon role="img" aria-label="heart-emoji" />
        <Link href={BY.url} className={classes.links}>
          {BY.text}
        </Link>
        {version && (
          <StatusChip
            // forceWhiteColor
            // stateColor="primary"
            text={version}
            mx={0.5}
          />
        )}
        {isError && (
          <a
            href={SUPPORT_WEBSITE}
            target="_blank"
            rel="noreferrer"
            className={classes.links}
          >
            <StatusChip
              // forceWhiteColor
              // stateColor="error"
              text={T.NotOfficiallySupport}
              dataCy="notOfficialSupport"
              mx={0.5}
            />
          </a>
        )}
        {isSuccess && (
          <Link component={RouterLink} to={generatePath(PATH.SUPPORT)}>
            <StatusChip
              forceWhiteColor
              stateColor="success"
              text={T.OfficiallySupport}
              dataCy="officialSupport"
              mx={0.5}
            />
          </Link>
        )}
      </Typography>
    </FooterBox>
  )
})

Footer.displayName = 'Footer'

export default Footer
