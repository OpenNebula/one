/* ------------------------------------------------------------------------ */
/* Copyright 2002-2024, OpenNebula Project, OpenNebula Systems              */
/*                                                                          */
/* Licensed under the Apache License, Version 2.0 (the "License"); you may  */
/* not use this file except in compliance with the License. You may obtain  */
/* a copy of the License at                                                 */
/*                                                                          */
/* http://www.apache.org/licenses/LICENSE-2.0                               */
/*                                                                          */
/* Unless required by applicable law or agreed to in writing, software      */
/* distributed under the License is distributed on an "AS IS" BASIS,        */
/* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. */
/* See the License for the specific language governing permissions and      */
/* limitations under the License.                                           */
/* -------------------------------------------------------------------------*/

#ifndef DATASTORE_H_
#define DATASTORE_H_

#include "PoolObjectSQL.h"
#include "ObjectCollection.h"
#include "DatastoreTemplate.h"
#include "Clusterable.h"
#include "Image.h"

class VirtualMachineDisk;

/**
 *  The Datastore class.
 */
class Datastore : public PoolObjectSQL, public Clusterable
{
public:
    /**
     *  Type of Datastore
     */
    enum DatastoreType
    {
        IMAGE_DS  = 0, /** < Standard datastore for disk images */
        SYSTEM_DS = 1, /** < System datastore for disks of running VMs */
        FILE_DS   = 2, /** < File datastore for context, kernel, initrd files */
        BACKUP_DS = 3  /** < Backup datastore for VMs */
    };

    /**
     *  Return the string representation of a DatastoreType
     *    @param ob the type
     *    @return the string
     */
    static std::string type_to_str(DatastoreType ob)
    {
        switch (ob)
        {
            case IMAGE_DS:  return "IMAGE_DS" ; break;
            case SYSTEM_DS: return "SYSTEM_DS" ; break;
            case FILE_DS:   return "FILE_DS" ; break;
            case BACKUP_DS: return "BACKUP_DS" ; break;
            default:        return "";
        }
    };

    /**
     *  Return the string representation of a DatastoreType
     *    @param str_type string representing the DatastoreTypr
     *    @return the DatastoreType (defaults to IMAGE_DS)
     */
    static DatastoreType str_to_type(std::string& str_type);

    /**
     *  Datastore State
     */
    enum DatastoreState
    {
        READY     = 0, /** < Datastore ready to use */
        DISABLED  = 1  /** < System Datastore can not be used */
    };

    /**
     * Returns the string representation of a DatastoreState
     * @param state The state
     * @return the string representation
     */
    static std::string state_to_str(DatastoreState state)
    {
        switch (state)
        {
            case READY:     return "READY";     break;
            case DISABLED:  return "DISABLED";  break;
            default:        return "";
        }
    };

    virtual ~Datastore() = default;

    /**
     * Function to print the Datastore object into a string in XML format
     *  @param xml the resulting XML string
     *  @return a reference to the generated string
     */
    std::string& to_xml(std::string& xml) const override;

    /**
     *  Rebuilds the object from an xml formatted string
     *    @param xml_str The xml-formatted string
     *
     *    @return 0 on success, -1 otherwise
     */
    int from_xml(const std::string &xml_str) override;

    /**
     *  Adds this image's ID to the set.
     *    @param id of the image to be added to the Datastore
     *    @return 0 on success
     */
    int add_image(int id)
    {
        return images.add(id);
    };

    /**
     *  Deletes this image's ID from the set.
     *    @param id of the image to be deleted from the Datastore
     *    @return 0 on success
     */
    int del_image(int id)
    {
        return images.del(id);
    };

    /**
     *  Returns a copy of the Image IDs set
     */
    const std::set<int>& get_image_ids() const
    {
        return images.get_collection();
    }

    /**
     *  Returns the number of images
     */
    int images_size()
    {
        return images.size();
    }

    /**
     *  Retrieves TM mad name
     *    @return string tm mad name
     */
    const std::string& get_tm_mad() const
    {
        return tm_mad;
    };

    /**
     *  Retrieves DS mad name
     *    @return string ds mad name
     */
    const std::string& get_ds_mad() const
    {
        return ds_mad;
    };

    /**
     *  Retrieves the base path
     *    @return base path string
     */
    const std::string& get_base_path() const
    {
        return base_path;
    };

    /**
     *  Retrieves the disk type
     *    @return disk type
     */
    Image::DiskType get_disk_type() const
    {
        return disk_type;
    };

    /**
     * Returns the datastore type
     *    @return datastore type
     */
    DatastoreType get_type() const
    {
        return type;
    };

    Image::DiskType context_disk_type() const;

    /**
     * Modifies the given VM disk attribute adding the relevant datastore
     * attributes
     *
     * @param disk
     * @param inherit_attrs Attributes to be inherited from the DS template
     *   into the disk
     */
    void disk_attribute(
            VirtualMachineDisk *            disk,
            const std::vector<std::string>& inherit_attrs);

    /**
     *  Set monitor information for the Datastore
     *    @param total_mb
     *    @param free_mb
     *    @param used_mb
     */
    void update_monitor(long long total, long long free, long long used)
    {
        total_mb = total;
        free_mb  = free;
        used_mb  = used;
    }

    /**
     *  Returns the available capacity in the datastore.
     *    @params avail the total available size in the datastore (MB)
     *    @return true if the datastore is configured to enforce capacity
     *    checkings
     */
    bool get_avail_mb(long long &avail) const;

    /**
     * Returns true if the DS contains the SHARED = YES attribute
     * @return true if the DS is shared
     */
    bool is_shared()
    {
        bool shared;

        if (!get_template_attribute("SHARED", shared))
        {
            shared = true;
        }

        return shared;
    };

    /**
     * @return true if the DS_MAD_CONF has PERSISTENT_ONLY = "YES" flag
     */
    bool is_persistent_only() const;

    /**
     * (only relevant for backup datastores)
     * @return true if the DS_MAD_CONF has CONCURRENT_FORGET = "YES" flag
     */
    bool is_concurrent_forget() const;

    /**
     * Enable or disable the DS. Only for System DS.
     * @param enable true to enable
     * @param error_str Returns the error reason, if any
     *
     * @return 0 on success
     */
    int enable(bool enable, std::string& error_str);

    /**
     * Return a set with compatible system ds for an image ds
     */
    void get_compatible_system_ds(std::set<int> &compatible_sys_ds) const
    {
        std::string compatible_sys_ds_str;

        get_template_attribute("COMPATIBLE_SYS_DS", compatible_sys_ds_str);

        one_util::split_unique(compatible_sys_ds_str, ',', compatible_sys_ds);
    }

    /**
     *  Verify the proper definition of the TM_MAD by checking the attributes
     *  related to the TM defined in TM_MAD_CONF
     */
    int get_tm_mad_targets(const std::string &tm_mad,
                           std::string& ln_target,
                           std::string& clone_target,
                           std::string& disk_type) const;
    /**
     *  Returns the default DRIVER to use with images and disks in this DS. The
     *  precedence is:
     *    1. TM_MAD_CONF/DRIVER in oned.conf
     *    2. DRIVER in the DS template
     *
     *    @param dsid of the datastore
     *
     *    @return driver name or "" if not set or missing DS
     */

    std::string get_ds_driver();

private:

    // -------------------------------------------------------------------------
    // Friends
    // -------------------------------------------------------------------------

    friend class DatastorePool;

    // *************************************************************************
    // Datastore Private Attributes
    // *************************************************************************

    /**
     * Name of the datastore driver used to register new images
     */
    std::string ds_mad;

    /**
     *  Name of the TM driver used to transfer file to and from the hosts
     */
    std::string tm_mad;

    /**
     * Base path for the storage
     */
    std::string base_path;

    /**
     * The datastore type
     */
    DatastoreType type;

    /**
     * Disk types for the Images created in this datastore
     */
    Image::DiskType disk_type;

    /**
     * Total datastore capacity in MB
     */
    long long total_mb;

    /**
     * Available datastore capacity in MB
     */
    long long free_mb;

    /**
     * Used datastore capacity in MB
     */
    long long used_mb;

    /**
     *  Datastore state
     */
    DatastoreState state;

    /**
     *  Collection of image ids in this datastore
     */
    ObjectCollection images;

    // *************************************************************************
    // Constructor
    // *************************************************************************

    Datastore(
            int                 uid,
            int                 gid,
            const std::string&  uname,
            const std::string&  gname,
            int                 umask,
            std::unique_ptr<DatastoreTemplate> ds_template,
            const std::set<int> &cluster_ids);

    /**
     *  Sets the DISK_TYPE attribute for the datastore. This function will
     *  check the type against the supported DiskTypes for each datastore type
     *  (SYSTEM, IMAGE and FILE).
     *    @param s_dt DISK_TYPE in string form. If empty Image::FILE will be used
     *    @param error description if any. The string is upcased
     *
     *    @return -1 if an inconsistent assigment is found
     *
     */
    int set_ds_disk_type(std::string& s_dt, std::string& error);

    // *************************************************************************
    // DataBase implementation (Private)
    // *************************************************************************

    /**
     *  Execute an INSERT or REPLACE Sql query.
     *    @param db The SQL DB
     *    @param replace Execute an INSERT or a REPLACE
     *    @param error_str Returns the error reason, if any
     *    @return 0 one success
     */
    int insert_replace(SqlDB *db, bool replace, std::string& error_str);

    /**
     *  Bootstraps the database table(s) associated to the Datastore
     *    @return 0 on success
     */
    static int bootstrap(SqlDB * db);

    /**
     *  Writes the Datastore in the database.
     *    @param db pointer to the db
     *    @return 0 on success
     */
    int insert(SqlDB *db, std::string& error_str) override;

    /**
     *  Writes/updates the Datastore's data fields in the database.
     *    @param db pointer to the db
     *    @return 0 on success
     */
    int update(SqlDB *db) override
    {
        std::string error_str;
        return insert_replace(db, true, error_str);
    }

    /**
     *  Factory method for datastore templates
     */
    std::unique_ptr<Template> get_new_template() const override
    {
        return std::make_unique<DatastoreTemplate>();
    }

    /**
     *  Verify the proper definition of the DS_MAD by checking the attributes
     *  related to the DS defined in DS_MAD_CONF specified in the Datastore
     *  template
     */
    int set_ds_mad(const std::string &ds_mad, std::string &error_str);

    /**
     *  Verify the proper definition of the TM_MAD by checking the attributes
     *  related to the TM defined in TM_MAD_CONF
     */
    int set_tm_mad(const std::string &tm_mad, std::string &error_str);

    /**
     * Child classes can process the new template set with replace_template or
     * append_template with this method
     *    @param error string describing the error if any
     *    @return 0 on success
     * - encrypt secret attributes.
     */
    int post_update_template(std::string& error) override;
};

#endif /*DATASTORE_H_*/
