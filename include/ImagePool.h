/* -------------------------------------------------------------------------- */
/* Copyright 2002-2018, OpenNebula Project, OpenNebula Systems                */
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
#include "NebulaLog.h"
#include "Datastore.h"

#include <time.h>
#include <sstream>

#include <iostream>
#include <vector>

class AuthRequest;
class Snapshots;

using namespace std;

/**
 *  The Image Pool class.
 */
class ImagePool : public PoolSQL
{
public:

    ImagePool(
            SqlDB *                          db,
            const string&                    __default_type,
            const string&                    __default_dev_prefix,
            const string&                    __default_cdrom_dev_prefix,
            vector<const SingleAttribute *>& restricted_attrs,
            vector<const VectorAttribute *>& hook_mads,
            const string&                    remotes_location,
            const vector<const SingleAttribute *>& _inherit_image_attrs);

    ~ImagePool(){};

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
        const string&            uname,
        const string&            gname,
        int                      umask,
        ImageTemplate *          img_template,
        int                      ds_id,
        const string&            ds_name,
        Image::DiskType          disk_type,
        const string&            ds_data,
        Datastore::DatastoreType ds_type,
        const string&            ds_mad,
        const string&            tm_mad,
        const string&            extra_data,
        int                      source_img_id,
        int *                    oid,
        string&                  error_str);

    /**
     **  Function to get a Image from the pool, if the object is not in memory
     *  it is loaded from the DB
     *    @param oid Image unique id
     *    @param lock locks the Image mutex
     *    @return a pointer to the Image, 0 if the Image could not be loaded
     */
    Image * get(int oid)
    {
        return static_cast<Image *>(PoolSQL::get(oid));
    };

     /**
     **  Function to get a read only Image from the pool, if the object is not in memory
     *  it is loaded from the DB
     *    @param oid Image unique id
     *    @return a pointer to the Image, 0 if the Image could not be loaded
     */
    Image * get_ro(int oid)
    {
        return static_cast<Image *>(PoolSQL::get(oid));
    };

    /**
     *  Gets an object from the pool (if needed the object is loaded from the
     *  database).
     *   @param name of the object
     *   @param uid id of owner
     *   @param lock locks the object if true
     *
     *   @return a pointer to the object, 0 in case of failure
     */
    Image * get(const string& name, int uid)
    {
        return static_cast<Image *>(PoolSQL::get(name,uid));
    };

    /**
     *  Gets a read only object from the pool (if needed the object is loaded from the
     *  database).
     *   @param name of the object
     *   @param uid id of owner
     *
     *   @return a pointer to the object, 0 in case of failure
     */
    Image * get_ro(const string& name, int uid)
    {
        return static_cast<Image *>(PoolSQL::get_ro(name,uid));
    };

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
     *  @param limit parameters used for pagination
     *  @param desc descending order of pool elements
     *
     *  @return 0 on success
     */
    int dump(string& oss, const string& where, const string& limit,
            bool desc)
    {
        return PoolSQL::dump(oss, "IMAGE_POOL", "body", Image::table, where, limit, 
            desc);
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
                     string&            dev_prefix,
                     int                uid,
                     int&               image_id,
                     Snapshots **       snaps,
                     bool               attach,
                     string&            error_str);
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

    static const string& default_type()
    {
        return _default_type;
    };

    static const string& default_dev_prefix()
    {
        return _default_dev_prefix;
    };

    static const string& default_cdrom_dev_prefix()
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
    static string  _default_type;

    /**
     * Default device prefix
     **/
    static string  _default_dev_prefix;

    /**
     * Default device prefix for cdrom disks
     **/
    static string _default_cdrom_dev_prefix;

    /**
     * Image attributes to be inherited into the VM disk
     */
    vector<string> inherit_attrs;

    //--------------------------------------------------------------------------
    // Pool Attributes
    // -------------------------------------------------------------------------
    /**
     *  Factory method to produce Image objects
     *    @return a pointer to the new Image
     */
    PoolObjectSQL * create()
    {
        return new Image(-1,-1,"","",0,0);
    };
};

#endif /*IMAGE_POOL_H_*/
