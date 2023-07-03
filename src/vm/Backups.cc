/* -------------------------------------------------------------------------- */
/* Copyright 2002-2023, OpenNebula Project, OpenNebula Systems                */
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

#include "Backups.h"
#include "Attribute.h"
#include "ObjectXML.h"
#include "DatastorePool.h"
#include "Nebula.h"

using namespace std;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Backups::Backups():
    config(false,'=',"BACKUP_CONFIG"),
    ids("BACKUP_IDS")
{
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

bool Backups::do_volatile() const
{
    bool vlt;

    if ( config.get("BACKUP_VOLATILE", vlt) )
    {
        return vlt;
    }

    return false;
}

Backups::Mode Backups::mode() const
{
    string mode_s;

    config.get("MODE", mode_s);

    return str_to_mode(mode_s);
}
/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

std::string& Backups::to_xml(std::string& xml) const
{
    std::ostringstream oss;

    std::string cxml;
    std::string ixml;

    oss << "<BACKUPS>";

    if (config.empty())
    {
        oss << "<BACKUP_CONFIG/>";
    }
    else
    {
        oss << config.to_xml(cxml);
    }

    oss << ids.to_xml(ixml)
        << "</BACKUPS>";

    xml = oss.str();

    return xml;
};

/* -------------------------------------------------------------------------- */

int Backups::from_xml(const ObjectXML* xml)
{
    vector<xmlNodePtr> content;
    int rc = 0;

    xml->get_nodes("/VM/BACKUPS/BACKUP_CONFIG", content);

    if (content.empty())
    {
        content.clear();
        return -1;
    }

    rc += config.from_xml_node(content[0]);

    xml->free_nodes(content);

    content.clear();

    rc += ids.from_xml(xml, "/VM/BACKUPS/");

    if (rc != 0)
    {
        return -1;
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int Backups::parse(Template *tmpl, bool can_increment,
                   bool append, std::string& error_str)
{
    vector<VectorAttribute *> cfg_a;

    int    iattr;
    bool   battr;
    string sattr;

    if ( tmpl->remove("BACKUP_CONFIG", cfg_a) == 0 )
    {
        return 0;
    }

    VectorAttribute * cfg = dynamic_cast<VectorAttribute *>(cfg_a[0]);

    if ( cfg == 0 )
    {
        error_str = "Internal error parsing BACKUP_CONFIG attribute.";

        for (auto &i : cfg_a)
        {
            delete i;
        }

        return -1;
    }

    /* ---------------------------------------------------------------------- */
    /* CONFIGURATION ATTRIBUTES                                               */
    /*  - KEEP_LAST                                                           */
    /*  - BACKUP_VOLATILE                                                     */
    /*  - FSFREEZE                                                            */
    /*  - MODE                                                                */
    /* ---------------------------------------------------------------------- */
    if (cfg->vector_value("KEEP_LAST", iattr) == 0)
    {
        if (iattr < 0)
        {
            iattr = 0;
        }

        config.replace("KEEP_LAST", iattr);
    }
    else if (!append)
    {
        config.erase("KEEP_LAST");
    }

    if (cfg->vector_value("BACKUP_VOLATILE", battr) == 0)
    {
        config.replace("BACKUP_VOLATILE", battr);
    }
    else if (!append)
    {
        config.replace("BACKUP_VOLATILE", "NO");
    }

    sattr = cfg->vector_value("FS_FREEZE");

    one_util::toupper(sattr);

    if ( !sattr.empty() )
    {
        if ((sattr != "NONE") && (sattr != "AGENT") && (sattr != "SUSPEND"))
        {
            sattr = "NONE";
        }

        config.replace("FS_FREEZE", sattr);
    }
    else if (!append)
    {
        config.replace("FS_FREEZE", "NONE");
    }

    if (!can_increment) //Only FULL backups for this VM
    {
        config.replace("INCREMENTAL_BACKUP_ID", -1);
        config.replace("LAST_INCREMENT_ID", -1);

        config.replace("MODE", mode_to_str(FULL));
    }
    else
    {
        sattr = cfg->vector_value("MODE");

        if (!sattr.empty() || !append)
        {
            Mode new_mode = str_to_mode(sattr);

            // Reset incremental backup pointers if mode changed to/from FULL
            if (new_mode != INCREMENT || mode() != INCREMENT)
            {
                config.replace("INCREMENTAL_BACKUP_ID", -1);
                config.replace("LAST_INCREMENT_ID", -1);
            }

            config.replace("MODE", mode_to_str(new_mode));
        }
    }

    for (auto &i : cfg_a)
    {
        delete i;
    }

    return 0;
}
