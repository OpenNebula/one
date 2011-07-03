/* -------------------------------------------------------------------------- */
/* Copyright 2002-2011, OpenNebula Project Leads (OpenNebula.org)             */
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

#include "UserXML.h"
#include <sstream>

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void UserXML::init_attributes()
{
    vector<xmlNodePtr> content;

    oid         = atoi(((*this)["/USER/ID"] )[0].c_str() );
    gid         = atoi(((*this)["/USER/GID"] )[0].c_str() );

    get_nodes("/USER/GROUPS",content);

    if (!content.empty())
    {
        xmlNodePtr    cur_node = 0;
        istringstream iss;
        int           id;

        for (cur_node =  content[0]->children; 
             cur_node != 0; 
             cur_node =  cur_node->next)
        {
            if ((cur_node->type == XML_ELEMENT_NODE) && 
                (cur_node->children != 0) && 
                ((cur_node->children->type == XML_TEXT_NODE ) || 
                 (cur_node->children->type == XML_CDATA_SECTION_NODE)))
            {
                iss.clear();
                iss.str(reinterpret_cast<const char *>(cur_node->children->content)); 
                iss >> dec >> id;

                if ( iss.fail() )
                {
                    //TODO Print a warning message
                    break;
                }
                else
                {
                    group_ids.insert(id);
                }
            }
            else
            {
                //TODO Print a warning message
                break;
            }
        }
    }

    free_nodes(content);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

