/* -------------------------------------------------------------------------- */
/* Copyright 2002-2024, OpenNebula Project, OpenNebula Systems                */
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

#ifndef IMAGE_POOL_H_
#define IMAGE_POOL_H_

#include "PoolSQL.h"
#include "Image.h"
#include "Datastore.h"
#include "OneDB.h"

#include <vector>

class AuthRequest;
class Snapshots;


/**
 *  The Image Pool class.
 */
class ImagePool : public PoolSQL
{
public:

    ImagePool(
            SqlDB *                          db,
            const std::string&                    __default_type,
            const std::string&                    __default_dev_prefix,
            const std::string&                    __default_cdrom_dev_prefix,
            const std::vector<const SingleAttribute *>& restricted_attrs,
            const std::vector<const SingleAttribute *>& encrypted_attrs,
            const std::vector<const SingleAttribute *>& inherit_attrs);

    ~ImagePool() {};

    /**
     *  Function to allocate a new Image object
     *    @param uid the user id of the image's owner
     *    @param gid the id of the group this object is assigned to
     *    @param uname name of the user
     *    @param gname name of the group
     *    @param umask permissions umask
     *    @param img_template template associated with the image
     *    @param ds_id the id of the datastore
     *    @param ds_name the name of the datastore
     *    @param ds_type disk type for the image
     *    @param ds_data the datastore data
     *    @param ds_type the datastore type
     *    @param extra_data extra data that will be sent to the driver
     *    @param source_img_id If the new Image is a clone, this must be the
     *      source Image ID. Otherwise, it must be set to -1
     *    @param oid the id assigned to the Image
     *    @param error_str Returns the error reason, if any
     *    @return the oid assigned to the object,
     *                  -1 in case of failure
     *                  -2 in case of template parse failure
     */
    int allocate (
            int                      uid,
            int                      gid,
            const std::string&       uname,
            const std::string&       gname,
            int                      umask,
            std::unique_ptr<ImageTemplate> img_template,
            int                      ds_id,
            const std::string&       ds_name,
            Image::DiskType          disk_type,
            const std::string&       ds_data,
            Datastore::DatastoreType ds_type,
            const std::string&       ds_mad,
            const std::string&       tm_mad,
            const std::string&       extra_data,
            int                      source_img_id,
            int *                    oid,
            std::string&             error_str);

    /**
     *  Updates an Image in the data base. It also updates the previous state
     *  after executing the hooks.
     *    @param objsql a pointer to the VM
     *
     *    @return 0 on success.
     */
    int update(PoolObjectSQL * objsql) override;

    /**
     *  Gets an object from the pool (if needed the object is loaded from the
     *  database). The object is locked, other threads can't access the same
     *  object. The lock is released by destructor.
     *   @param oid the Image unique identifier
     *   @return a pointer to the Image, nullptr in case of failure
     */
    std::unique_ptr<Image> get(int oid)
    {
        return PoolSQL::get<Image>(oid);
    }

    /**
     *  Gets a read only object from the pool (if needed the object is loaded from the
     *  database). No object lock, other threads may work with the same object.
     *   @param oid the Image unique identifier
     *   @return a pointer to the Image, nullptr in case of failure
     */
    std::unique_ptr<Image> get_ro(int oid)
    {
        return PoolSQL::get_ro<Image>(oid);
    }

    /**
     *  Gets an object from the pool (if needed the object is loaded from the
     *  database). The object is locked, other threads can't access the same
     *  object. The lock is released by destructor.
     *   @param name of the object
     *   @param uid id of owner
     *
     *   @return a pointer to the object, 0 in case of failure
     */
    std::unique_ptr<Image> get(const std::string& name, int uid)
    {
        return PoolSQL::get<Image>(name, uid);
    }

    /**
     *  Gets a read only object from the pool (if needed the object is loaded from the
     *  database). No object lock, other threads may work with the same object.
     *   @param name of the object
     *   @param uid id of owner
     *
     *   @return a pointer to the object, 0 in case of failure
     */
    std::unique_ptr<Image> get_ro(const std::string& name, int uid)
    {
        return PoolSQL::get_ro<Image>(name, uid);
    }

    /**
     *  Bootstraps the database table(s) associated to the Image pool
     *    @return 0 on success
     */
    static int bootstrap(SqlDB *_db)
    {
        return Image::bootstrap(_db);
    };

    /**
     *  Dumps the Image pool in XML format. A filter can be also added to the
     *  query
     *  @param oss the output stream to dump the pool contents
     *  @param where filter for the objects, defaults to all
     *  @param sid first element used for pagination
     *  @param eid last element used for pagination, -1 to disable
     *  @param desc descending order of pool elements
     *
     *  @return 0 on success
     */
    int dump(std::string& oss, const std::string& where, int sid, int eid,
             bool desc) override
    {
        return PoolSQL::dump(oss, "IMAGE_POOL", "body", one_db::image_table,
                             where, sid, eid, desc);
    }

    /**
     *  Generates a DISK attribute for VM templates using the Image metadata.
     *  If the disk uses an Image, it tries to acquire it.
     *
     *    @param disk the disk to be generated
     *    @param disk_id the id for this disk
     *    @param img_type will be set to the used image's type
     *    @param dev_prefix will be set to the image defined dev_prefix,
     *        or the default one
     *    @param uid of VM owner (to look for the image id within its images)
     *    @param image_id on success returns the acquired image id
     *    @param snaps list of snapshots associated to this image
     *    @param attach true if attaching the image to a VM
     *    @param error_str string describing the error
     *
     *    @return 0 on success, -1 otherwise
     */
    int acquire_disk(int                vm_id,
                     VirtualMachineDisk *  disk,
                     int                disk_id,
                     Image::ImageType&  img_type,
                     std::string&       dev_prefix,
                     int                uid,
                     int&               image_id,
                     Snapshots **       snaps,
                     bool               attach,
                     std::string&       error_str);
    /**
     *  Generates a DISK attribute for VM templates using the Image metadata
     *
     *    @param disk the disk to be generated
     *    @param disk_id the id for this disk
     *    @param uid of VM owner (to look for the image id within its images)
     *
     */
    void disk_attribute(VirtualMachineDisk* disk,
                        int                 disk_id,
                        int                 uid);

    static const std::string& default_type()
    {
        return _default_type;
    };

    static const std::string& default_dev_prefix()
    {
        return _default_dev_prefix;
    };

    static const std::string& default_cdrom_dev_prefix()
    {
        return _default_cdrom_dev_prefix;
    };

private:
    //--------------------------------------------------------------------------
    // Configuration Attributes for Images
    // -------------------------------------------------------------------------

    /**
     * Default image type
     **/
    static std::string  _default_type;

    /**
     * Default device prefix
     **/
    static std::string  _default_dev_prefix;

    /**
     * Default device prefix for cdrom disks
     **/
    static std::string _default_cdrom_dev_prefix;

    /**
     * Image attributes to be inherited into the VM disk
     */
    std::vector<std::string> inherit_attrs;

    //--------------------------------------------------------------------------
    // Pool Attributes
    // -------------------------------------------------------------------------
    /**
     *  Factory method to produce Image objects
     *    @return a pointer to the new Image
     */
    PoolObjectSQL * create() override
    {
        return new Image(-1, -1, "", "", 0, 0);
    };
};

#endif /*IMAGE_POOL_H_*/
