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
import PropTypes from 'prop-types'
import FormWithSchema from 'client/components/Forms/FormWithSchema'
import { T, MARKET_TYPES } from 'client/constants'
import { SCHEMA, FIELDS } from './schema'
import { Grid, Card, CardContent, Typography } from '@mui/material'
import { Tr } from 'client/components/HOC'
import { generateDocLink } from 'client/utils'
import { useFormContext } from 'react-hook-form'
import { find } from 'lodash'

export const STEP_ID = 'configuration'

/**
 * Return content of the step.
 *
 * @param {string} version - OpenNebula version
 * @param {boolean} update - If the user is updating or creating the form
 * @returns {object} - Content of the step
 */
const Content = (version, update) => {
  const { getValues } = useFormContext()

  const type = find(MARKET_TYPES, { value: getValues('general.MARKET_MAD') })

  return (
    <Grid mt={2} container>
      <Grid item xs={8}>
        <FormWithSchema
          id={STEP_ID}
          cy={`${STEP_ID}`}
          fields={FIELDS(update)}
        />
      </Grid>
      <Grid item xs={4}>
        <Card
          elevation={2}
          sx={{
            height: '100%',
            minHeight: '630px',
            maxHeight: '630px',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'auto',
            marginLeft: '1em',
            marginTop: '1rem',
          }}
        >
          <CardContent
            sx={{
              flexGrow: 1,
              display: 'flex',
              flexDirection: 'column',
              gap: '1em',
            }}
          >
            <Typography variant="h6" component="div" gutterBottom>
              {Tr(T['marketplace.general.help.title'])}
            </Typography>

            {type?.value === 'one' && (
              <>
                <Typography variant="body2" gutterBottom>
                  <b>{Tr(T['marketplace.types.one'])}</b>
                </Typography>

                <Typography variant="body2" gutterBottom>
                  {Tr(T['marketplace.form.configuration.one.help.paragraph.1'])}
                  <a
                    target="_blank"
                    href="http://marketplace.opennebula.io/appliance"
                    rel="noreferrer"
                  >
                    {Tr(
                      T[
                        'marketplace.form.configuration.one.help.paragraph.1.link'
                      ]
                    )}
                  </a>
                </Typography>

                <Typography variant="body2" gutterBottom>
                  {Tr(T['marketplace.form.configuration.one.help.paragraph.2'])}{' '}
                </Typography>

                <Typography variant="body2" gutterBottom>
                  <a
                    target="_blank"
                    href={generateDocLink(
                      version,
                      'marketplace/public_marketplaces/opennebula.html'
                    )}
                    rel="noreferrer"
                  >
                    {Tr(T['marketplace.form.configuration.one.help.link'])}
                  </a>
                </Typography>
              </>
            )}

            {type?.value === 'http' && (
              <>
                <Typography variant="body2" gutterBottom>
                  <b>{Tr(T['marketplace.types.http'])}</b>
                </Typography>

                <Typography variant="body2" gutterBottom>
                  {Tr(
                    T['marketplace.form.configuration.http.help.paragraph.1']
                  )}
                </Typography>

                <Typography variant="body2" gutterBottom>
                  {Tr(
                    T['marketplace.form.configuration.http.help.paragraph.2']
                  )}{' '}
                </Typography>

                <Typography variant="body2" gutterBottom>
                  <a
                    target="_blank"
                    href={generateDocLink(
                      version,
                      'marketplace/private_marketplaces/market_http.html'
                    )}
                    rel="noreferrer"
                  >
                    {Tr(T['marketplace.form.configuration.http.help.link'])}
                  </a>
                </Typography>
              </>
            )}

            {type?.value === 's3' && (
              <>
                <Typography variant="body2" gutterBottom>
                  <b>{Tr(T['marketplace.types.s3'])}</b>
                </Typography>

                <Typography variant="body2" gutterBottom>
                  {Tr(T['marketplace.form.configuration.s3.help.paragraph.1'])}
                </Typography>

                <Typography variant="body2" gutterBottom>
                  {Tr(T['marketplace.form.configuration.s3.help.paragraph.2'])}{' '}
                </Typography>

                <Typography variant="body2" gutterBottom>
                  <a
                    target="_blank"
                    href={generateDocLink(
                      version,
                      'marketplace/private_marketplaces/market_s3.html'
                    )}
                    rel="noreferrer"
                  >
                    {Tr(T['marketplace.form.configuration.s3.help.link'])}
                  </a>
                </Typography>
              </>
            )}

            {type?.value === 'linuxcontainers' && (
              <>
                <Typography variant="body2" gutterBottom>
                  <b>{Tr(T['marketplace.types.linuxcontainers'])}</b>
                </Typography>

                <Typography variant="body2" gutterBottom>
                  {Tr(
                    T[
                      'marketplace.form.configuration.linuxcontainers.help.paragraph.1.1'
                    ]
                  )}
                  <a
                    target="_blank"
                    href={
                      T[
                        'marketplace.form.configuration.linuxcontainers.help.paragraph.1.link'
                      ]
                    }
                    rel="noreferrer"
                  >
                    {Tr(
                      T[
                        'marketplace.form.configuration.linuxcontainers.help.paragraph.1.2'
                      ]
                    )}
                  </a>
                  {Tr(
                    T[
                      'marketplace.form.configuration.linuxcontainers.help.paragraph.1.3'
                    ]
                  )}
                </Typography>

                <Typography variant="body2" gutterBottom>
                  {Tr(
                    T[
                      'marketplace.form.configuration.linuxcontainers.help.paragraph.2'
                    ]
                  )}{' '}
                </Typography>

                <Typography variant="body2" gutterBottom>
                  <a
                    target="_blank"
                    href={generateDocLink(
                      version,
                      'marketplace/public_marketplaces/lxc.html'
                    )}
                    rel="noreferrer"
                  >
                    {Tr(
                      T[
                        'marketplace.form.configuration.linuxcontainers.help.link'
                      ]
                    )}
                  </a>
                </Typography>
              </>
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )
}

/**
 * Configuration attributes.
 *
 * @param {object} props - Step props
 * @param {string} props.version - OpenNebula version
 * @param {boolean} props.update - If the user is updating or creating the form
 * @returns {object} AdvancedOptions configuration step
 */
const Configuration = ({ version, update }) => ({
  id: STEP_ID,
  label: T['marketplace.configuration.title'],
  resolver: SCHEMA,
  optionsValidate: { abortEarly: false },
  content: () => Content(version, update),
})

Configuration.propTypes = {
  data: PropTypes.object,
  setFormData: PropTypes.func,
}

export default Configuration
