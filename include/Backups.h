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

#ifndef BACKUPS_H_
#define BACKUPS_H_

#include <string>
#include <map>

#include "ObjectCollection.h"
#include "Template.h"

class ObjectXML;

/**
 *  This class represents the backup information of a VM, it consists of two
 *  parts, configuration and list of backups
 *  The schema is as follows:
 *  <BACKUPS>
 *   <BACKUP_CONFIG>
 *     <KEEP_LAST> Just keep the last N backups
 *     <BACKUP_VOLATILE> Backup volatile disks or not
 *     <FS_FREEZE> FS freeze operation to perform on the VM
 *     <MODE> Backup mode
 *     <LAST_DATASTORE_ID> The dastore ID used to store the active backups(*)
 *     <LAST_BACKUP_ID> ID of the active backup(*)
 *     <LAST_BACKUP_SIZE> SIZE of the active backup(*)
 *     <ACTIVE_FLATTEN> if true current chain is being flatten
 *   <BACKUP_IDS>
 *     <ID> ID of the image with a valid backup
 *
 *  (*) refers to the active backup operation, and are only present while
 *  a backup is being performed
 *
 *  Configuration attributes defaults
 *    - BACKUP_VOLATILE "NO"
 *    - FS_FREEZE "NONE"
 *    - KEEP_LAST (empty = keep all)
 */
class Backups
{
public:
    Backups();

    ~Backups() = default;

    // *************************************************************************
    // Backup modes
    // *************************************************************************
    enum Mode
    {
        FULL      = 0, /** < Full backups */
        INCREMENT = 1, /** < Forward increments */
    };

    static std::string mode_to_str(Mode bm)
    {
        switch (bm)
        {
            case FULL:      return "FULL";
            case INCREMENT: return "INCREMENT";
            default:        return "";
        }
    };

    static Mode str_to_mode(std::string& str_mode)
    {
        Mode mode = FULL;

        one_util::toupper(str_mode);

        if ( str_mode == "FULL" )
        {
            mode = FULL;
        }
        else if ( str_mode == "INCREMENT" )
        {
            mode = INCREMENT;
        }

        return mode;
    };

    // *************************************************************************
    // Inititalization functions
    // *************************************************************************

    /**
     *  Builds the snapshot list from its XML representation. This function
     *  is used when importing it from the DB.
     *    @param node xmlNode for the template
     *    @return 0 on success
     */
    int from_xml(const ObjectXML* xml);

    /**
     *  XML Representation of the Snapshots
     */
    std::string& to_xml(std::string& xml) const;

    /**
     *  Gets the BACKUP_CONFIG attribute attribute and parses the associated
     *  attributes:
     *     - BACKUP_VOLATILE
     *     - KEEP_LAST
     *     - FS_FREEZE
     *     - MODE
     *
     *  The following attributes are stored in the configuration and refers
     *  only to the active backup operation
     *     - LAST_DATASTORE_ID
     *     - LAST_BACKUP_ID
     *     - LAST_BACKUP_SIZE
     *
     *  Incremental backups include a reference to the last increment and full
     *  backup:
     *     - LAST_INCREMENT_ID
     *     - INCREMENTAL_BACKUP_ID
     * @param tmpl Template to parse, the root element must be BACKUP_CONFIG
     * @param can_increment VM disks support incremental backup
     * @param append Only append new values from tmpl
     * @param error_str Returns the error reason, if any
     * @return 0 success, -1 error
     */
    int parse(Template *tmpl, bool can_increment,
              bool append, std::string& error_str);

    /**
     *  @return true if Backup includes configuration attributes
     */
    bool configured()
    {
        return !config.empty();
    }

    /**
     *  @return true if the backup needs to include volatile disks
     */
    bool do_volatile() const;

    /**
     *  @return true if the backup needs to include volatile disks
     */
    Mode mode() const;

    /**
     *  Set of functions to manipulate the LAST_* attributes referring to
     *  the active backup operation
     */
    void last_datastore_id(int ds_id)
    {
        config.replace("LAST_DATASTORE_ID", ds_id);
    }

    void last_backup_id(const std::string& id)
    {
        config.replace("LAST_BACKUP_ID", id);
    }

    void last_backup_size(const std::string& size)
    {
        config.replace("LAST_BACKUP_SIZE", size);
    }

    void last_increment_id(int id)
    {
        config.replace("LAST_INCREMENT_ID", id);
    }

    void incremental_backup_id(int id)
    {
        config.replace("INCREMENTAL_BACKUP_ID", id);
    }

    void active_flatten(bool status)
    {
        config.replace("ACTIVE_FLATTEN", status);
    }

    void backup_job_id(int id)
    {
        config.replace("BACKUP_JOB_ID", id);
    }

    /* ---------------------------------------------------------------------- */

    int last_datastore_id() const
    {
        int dst;

        config.get("LAST_DATASTORE_ID", dst);

        return dst;
    }

    std::string last_backup_id() const
    {
        std::string id;

        config.get("LAST_BACKUP_ID", id);

        return id;
    }

    std::string last_backup_size() const
    {
        std::string sz;

        config.get("LAST_BACKUP_SIZE", sz);

        return sz;
    }

    int last_increment_id() const
    {
        int id;

        config.get("LAST_INCREMENT_ID", id);

        return id;
    }

    int incremental_backup_id() const
    {
        int id;

        config.get("INCREMENTAL_BACKUP_ID", id);

        return id;
    }

    int keep_last() const
    {
        int kl;

        if (!config.get("KEEP_LAST", kl))
        {
            return 0;
        }

        return kl;
    }

    bool active_flatten() const
    {
        bool af = false;

        config.get("ACTIVE_FLATTEN", af);

        return af;
    }

    int backup_job_id() const
    {
        int id;

        if (!config.get("BACKUP_JOB_ID", id))
        {
            return -1;
        }

        return id;
    }

    /* ---------------------------------------------------------------------- */

    void last_backup_clear()
    {
        config.erase("LAST_DATASTORE_ID");

        config.erase("LAST_BACKUP_ID");
        config.erase("LAST_BACKUP_SIZE");

        config.erase("BACKUP_JOB_ID");
    }

    /**
     *  @param riids Return the backups that needs to be removed to conform
     *  to KEEP_LAST configuration
     */
    void remove_last(std::set<int> &riids) const
    {
        int kl;

        riids.clear();

        if (!config.get("KEEP_LAST", kl) || kl == 0)
        {
            return;
        }

        auto iids = ids.get_collection();
        auto it   = iids.cbegin();

        int to_remove = iids.size() - kl;

        for (int i = 0 ; i < to_remove && it != iids.cend() ; ++i, ++it)
        {
            riids.insert(*it);
        }
    }

    /**
     *  Adds / deletes a backup from the list. Each backup is represented by
     *  an image in the backup datastore. The list holds the ID's of the images
     *
     *  @return 0 on success -1 if an error adding (already present) or deleting
     *  (not present) occurred
     */
    int add(int id)
    {
        return ids.add(id);
    }

    int del(int id)
    {
        return ids.del(id);
    }

private:
    /**
     *  Text representation of the backup information of the VM
     */
    Template config;

    /**
     *  Backups of the VM as a collection of Image ID
     */
    ObjectCollection ids;
};

#endif /*BACKUPS_H_*/
