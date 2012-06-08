/* -------------------------------------------------------------------------- */
/* Copyright 2002-2012, OpenNebula Project Leads (OpenNebula.org)             */
/*                                                                            */
/* Licensed under the Apache License, Version 2.0 (the "License"); you may    */
/* not use this file except in compliance with the License. You may obtain    */
/* a copy of the License at                                                   */
/*                                                                            */
/* http://www.apache.org/licenses/LICENSE-2.0                                 */
/*                                                                            */
/* Unless required by applicable law or agreed to in writing, software        */
/* distributed under the License is distributed on an "AS IS" BASIS,          */
/* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.   */
/* See the License for the specific language governing permissions and        */
/* limitations under the License.                                             */
/* -------------------------------------------------------------------------- */

/* ************************************************************************** */
/* Document Pool                                                              */
/* ************************************************************************** */

#include "DocumentPool.h"

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int DocumentPool::allocate (
        int                      uid,
        int                      gid,
        const string&            uname,
        const string&            gname,
        int                      type,
        Template *               template_contents,
        int *                    oid,
        string&                  error_str)
{
    Document *      document;
    Document *      document_aux = 0;
    string          name;
    ostringstream   oss;

    // ------------------------------------------------------------------------
    // Build a new Document object
    // ------------------------------------------------------------------------
    document = new Document(-1, uid, gid, uname, gname,
            type, template_contents);

    // Check name
    document->get_template_attribute("NAME", name);

    if ( !name.empty() )
    {
        // Check for duplicates
        document_aux = get(name, uid, type, false);

        if( document_aux != 0 )
        {
            goto error_duplicated;
        }
    }

    // ------------------------------------------------------------------------
    // Insert the Object in the pool
    // ------------------------------------------------------------------------

    *oid = PoolSQL::allocate(document, error_str);

    return *oid;


error_duplicated:
    oss << "NAME is already taken by DOCUMENT "
        << document_aux->get_oid() << ".";

    delete document;

    *oid = -1;
    error_str = oss.str();

    return *oid;
}
