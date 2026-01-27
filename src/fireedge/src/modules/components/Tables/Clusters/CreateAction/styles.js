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
import { css } from '@emotion/css'

/**
 * Create styles for the breadcrumb.
 *
 * @param {object} theme - Theme
 * @param {object} theme.palette - Palette
 * @returns {object} CSS styles with the palette
 */
const styles = ({ palette }) => ({
  container: css({
    justifyContent: 'center',
    alignItems: 'stretch',
    marginLeft: '50px',
    marginRight: '50px',
    paddingBottom: '50px',
  }),
  cardContainer: css({
    display: 'grid',
    gridTemplateRows: 'repeat(3, 1fr)',
    gridTemplateColumns: '1fr',
    gap: '20px',
    alignItems: 'stretch',
  }),
  card: css({
    alignItems: 'flex-start',
    padding: '12px 16px',
    borderRadius: '8px',
    border: `1px solid ${palette.cluster.createCluster.cardBorder}`,
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'flex-start',
    width: '100%',
  }),
  cardIcon: css({
    padding: '2px',
    margin: '0px 2px 0px 0px',
  }),
  icon: css({
    width: '24px',
    height: '24px',
    color: palette.cluster.createCluster.icon,
  }),
  cardContent: css({
    width: '100%',
  }),
  headerContainer: css({
    marginBottom: '25px',
  }),
  title: css({
    color: palette.cluster.createCluster.title,
    fontSize: '20px',
    fontStyle: 'normal',
    fontWeight: 700,
    lineHeight: '32px',
  }),
  subtitle: css({
    color: palette.cluster.createCluster.subtitle,
    fontSize: '13px',
    fontStyle: 'normal',
    fontWeight: 400,
    lineHeight: '16px',
  }),
  linkContainer: css({
    color: 'red',
    fontSize: '13px',
    fontStyle: 'normal',
    fontWeight: 400,
    lineHeight: '16px',
    alignSelf: 'flex-end',
    marginTop: '5px',
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
  }),
  linkContent: css({
    color: palette.cluster.createCluster.link,
    textDecoration: 'none',
  }),
  linkIcon: css({
    width: '10px',
    height: '10px',
    color: palette.cluster.createCluster.link,
  }),
})

export default styles
