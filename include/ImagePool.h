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

#ifndef IMAGE_POOL_H_
#define IMAGE_POOL_H_

#include "PoolSQL.h"
#include "Image.h"
#include "NebulaLog.h"

#include <time.h>
#include <sstream>

#include <iostream>
#include <vector>

class AuthRequest;

using namespace std;

/**
 *  The Image Pool class.
 */
class ImagePool : public PoolSQL
{
public:

    ImagePool(SqlDB *       db,
              const string& _default_type,
              const string& _default_dev_prefix,
              vector<const Attribute *>& restricted_attrs);

    ~ImagePool(){};

    /**
     *  Function to allocate a new Image object
     *    @param uid the user id of the image's owner
     *    @param gid the id of the group this object is assigned to
     *    @param uname name of the user
     *    @param gname name of the group
     *    @param img_template template associated with the image
     *    @param ds_id the id of the datastore
     *    @param ds_name the name of the datastore
     *    @param ds_type disk type for the image
     *    @param ds_data the datastore data
     *    @param oid the id assigned to the Image
     *    @param error_str Returns the error reason, if any
     *    @return the oid assigned to the object,
     *                  -1 in case of failure
     *                  -2 in case of template parse failure
     */
    int allocate (
        int             uid,
        int             gid,
        const string&   uname,
        const string&   gname,
        ImageTemplate * img_template,
        int             ds_id,
        const string&   ds_name,
        Image::DiskType ds_type,
        const string&   ds_data,
        int *           oid,
        string&         error_str);

    /**
     **  Function to get a Image from the pool, if the object is not in memory
     *  it is loaded from the DB
     *    @param oid Image unique id
     *    @param lock locks the Image mutex
     *    @return a pointer to the Image, 0 if the Image could not be loaded
     */
    Image * get(int oid, bool lock)
    {
        return static_cast<Image *>(PoolSQL::get(oid,lock));
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
    Image * get(const string& name, int uid, bool lock)
    {
        return static_cast<Image *>(PoolSQL::get(name,uid,lock));
    };

    /** 
     *  Update a particular Image
     *    @param image pointer to Image
     *    @return 0 on success
     */
    int update(Image * image)
    {
        return image->update(db);
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
     *  @return 0 on success
     */
    int dump(ostringstream& oss, const string& where)
    {
        return PoolSQL::dump(oss, "IMAGE_POOL", Image::table, where);
    }

    /**
     *  Generates a DISK attribute for VM templates using the Image metadata
     *
     *    @param disk the disk to be generated
     *    @param disk_id the id for this disk
     *    @param img_type will be set to the used image's type
     *    @param dev_prefix will be set to the image defined dev_prefix,
     *        or the default one
     *    @param uid of VM owner (to look for the image id within its images)
     *    @param image_id on success returns the acquired image id
     *    @param error_str string describing the error
     *
     *    @return 0 on success, -1 otherwise
     */
    int disk_attribute(VectorAttribute *  disk,
                       int                disk_id,
                       Image::ImageType&  img_type,
                       string&            dev_prefix,
                       int                uid,
                       int&               image_id,
                       string&            error_str);
    /**
     *  Generates an Authorization token for the DISK attribute
     *    @param disk the disk to be authorized
     *    @param uid of owner (to look for the image id within her images)
     *    @param ar the AuthRequest
     */
    void authorize_disk(VectorAttribute * disk, int uid, AuthRequest * ar);

    static const string& default_type()
    {
        return _default_type;
    };

    static const string& default_dev_prefix()
    {
        return _default_dev_prefix;
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

    //--------------------------------------------------------------------------
    // Pool Attributes
    // -------------------------------------------------------------------------
    /**
     *  Factory method to produce Image objects
     *    @return a pointer to the new Image
     */
    PoolObjectSQL * create()
    {
        return new Image(-1,-1,"","",0);
    };
};

#endif /*IMAGE_POOL_H_*/
