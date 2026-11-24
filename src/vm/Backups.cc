/* -------------------------------------------------------------------------- */
/* Copyright 2002-2026, OpenNebula Project, OpenNebula Systems                */
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

#include <algorithm>
#include <iterator>

#include "Backups.h"
#include "Attribute.h"
#include "ObjectXML.h"
#include "DatastorePool.h"
#include "Nebula.h"

using namespace std;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Backups::Backups():
    config(false, '=', "BACKUP_CONFIG"),
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

int Backups::parse_disk_ids(const string& value, vector<int>& disk_ids,
                            string& error_str)
{
    disk_ids.clear();

    if (value.empty())
    {
        return 0;
    }

    for (const auto& token : one_util::split(value, ',', false))
    {
        int id;

        if (!one_util::str_cast(token, id) || id < 0)
        {
            error_str = "Invalid DISK_IDS value: " + value;
            return -1;
        }

        disk_ids.push_back(id);
    }

    sort(disk_ids.begin(), disk_ids.end());
    disk_ids.erase(unique(disk_ids.begin(), disk_ids.end()), disk_ids.end());

    return 0;
}

/* -------------------------------------------------------------------------- */

void Backups::set_disk_ids(const vector<int>& disk_ids)
{
    if (disk_ids.empty())
    {
        config.erase("DISK_IDS");

        return;
    }

    config.replace("DISK_IDS", one_util::join(disk_ids, ','));
}

/* -------------------------------------------------------------------------- */

bool Backups::del_disk_id(int id)
{
    vector<int> disk_ids;

    get_disk_ids(disk_ids);

    auto last = remove(disk_ids.begin(), disk_ids.end(), id);

    if (last == disk_ids.end())
    {
        return false;
    }

    disk_ids.erase(last, disk_ids.end());
    set_disk_ids(disk_ids);

    return true;
}

/* -------------------------------------------------------------------------- */

void Backups::get_disk_ids(vector<int>& disk_ids) const
{
    string sattr;

    disk_ids.clear();

    if (!config.get("DISK_IDS", sattr) || sattr.empty())
    {
        return;
    }

    one_util::split(sattr, ',', disk_ids);
}

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

int Backups::parse(Template *tmpl,
                   bool append,
                   vector<int>& ids,
                   std::string& error_str)
{
    vector<unique_ptr<Attribute>> cfg_a;

    int  iattr;
    bool battr;
    string sattr;

    bool volatile_changed = false;
    bool disk_ids_changed = false;

    vector<int> disk_ids;
    vector<int> current_disk_ids;

    if ( tmpl->remove("BACKUP_CONFIG", cfg_a) == 0 )
    {
        get_disk_ids(ids);

        return 0;
    }

    VectorAttribute * cfg = dynamic_cast<VectorAttribute *>(cfg_a[0].get());

    if ( cfg == 0 )
    {
        error_str = "Internal error parsing BACKUP_CONFIG attribute.";
        return -1;
    }

    /* ---------------------------------------------------------------------- */
    /* CONFIGURATION ATTRIBUTES                                               */
    /*  - KEEP_LAST                                                           */
    /*  - BACKUP_VOLATILE                                                     */
    /*  - FSFREEZE                                                            */
    /*  - MODE                                                                */
    /*  - INTERACTIVE                                                         */
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
        volatile_changed = battr != do_volatile();
        config.replace("BACKUP_VOLATILE", battr);
    }
    else if (!append)
    {
        volatile_changed = do_volatile();
        config.replace("BACKUP_VOLATILE", "NO");
    }

    get_disk_ids(current_disk_ids);

    if (cfg->vector_value("DISK_IDS", sattr) == 0)
    {
        if (parse_disk_ids(sattr, disk_ids, error_str) != 0)
        {
            return -1;
        }

        for (int id : disk_ids)
        {
            if (find(ids.begin(), ids.end(), id) == ids.end())
            {
                error_str = "Invalid DISK_IDS, disk " + to_string(id) +
                            " cannot be backed up";
                return -1;
            }
        }

        set_disk_ids(disk_ids);

        disk_ids_changed = disk_ids != current_disk_ids;
    }
    else if (!append)
    {
        disk_ids.clear();

        set_disk_ids(disk_ids);

        disk_ids_changed = !current_disk_ids.empty();
    }
    else
    {
        disk_ids = std::move(current_disk_ids);
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

        sattr = cfg->vector_value("INCREMENT_MODE");

        one_util::toupper(sattr);

        if ( !sattr.empty() )
        {
            if ((sattr != "CBT") && (sattr != "SNAPSHOT"))
            {
                sattr = "CBT";
            }

            config.replace("INCREMENT_MODE", sattr);
        }
        else if (!append)
        {
            config.replace("INCREMENT_MODE", "CBT");
        }
    }

    if (disk_ids_changed || volatile_changed)
    {
        // The effective disk set defines the incremental backup chain.
        config.replace("INCREMENTAL_BACKUP_ID", -1);
        config.replace("LAST_INCREMENT_ID", -1);
    }

    if (cfg->vector_value("INTERACTIVE", battr) == 0)
    {
        config.replace("INTERACTIVE", battr);
    }
    else if (!append)
    {
        config.replace("INTERACTIVE", "NO");
    }

    ids = std::move(disk_ids);

    return 0;
}

/* -------------------------------------------------------------------------- */

int Backups::validate(bool can_increment, string& error_str)
{
    if (!configured())
    {
        return 0;
    }

    if (!can_increment)
    {
        config.replace("INCREMENTAL_BACKUP_ID", -1);
        config.replace("LAST_INCREMENT_ID", -1);
        config.replace("MODE", mode_to_str(FULL));
        config.erase("INCREMENT_MODE");
    }

    string sattr;

    config.get("INCREMENT_MODE", sattr);
    one_util::toupper(sattr);

    if (interactive() && mode() == INCREMENT && sattr == "SNAPSHOT")
    {
        error_str = "Interactive backups do not support SNAPSHOT increment mode.";
        return -1;
    }

    return 0;
}
