/* -------------------------------------------------------------------------- */
/* Copyright 2002-2010, OpenNebula Project Leads (OpenNebula.org)             */
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

using namespace std;

/**
 *  The Image Pool class.
 */
class ImagePool : public PoolSQL
{
public:

    ImagePool(SqlDB * db,
              const string&   _source_prefix,
              const string&   _default_type,
              const string&   _default_dev_prefix);

    ~ImagePool(){};

    /**
     *  Function to allocate a new Image object
     *    @param uid the user id of the image's owner
     *    @param stemplate template associated with the image
     *    @param oid the id assigned to the Image
     *    @return the oid assigned to the object, 
     *                  -1 in case of failure
     *                  -2 in case of template parse failure
     */
    int allocate (
        int            uid,
        const  string& stemplate,
        int *          oid);

    /**
     *  Function to get a Image from the pool, if the object is not in memory
     *  it is loaded from the DB
     *    @param oid Image unique id
     *    @param lock locks the Image mutex
     *    @return a pointer to the Image, 0 if the Image could not be loaded
     */
    Image * get(
        int     oid,
        bool    lock)
    {
        return static_cast<Image *>(PoolSQL::get(oid,lock));
    };
    
    /**
     *  Function to get an Image from the pool using the image name
     *    @param name of the image
     *    @param lock locks the User mutex
     *    @return a pointer to the Image, 0 if the User could not be loaded
     */
    Image * get(
        string  name,
        bool    lock)
    {
        map<string, int>::iterator     index;

        index = image_names.find(name);

        if ( index != image_names.end() )
        {
            return get((int)index->second,lock);
        }

        return 0;
    }

    /** Update a particular Image
     *    @param image pointer to Image
     *    @return 0 on success
     */
    int update(Image * image)
    {
        return image->update(db);
    };
    
    /** Drops an image from the DB, the image mutex MUST BE locked
     *    @param image pointer to Image
     *    @return 0 on success
     */
    int drop(Image * image)
    {
        int rc = PoolSQL::drop(image);

        if ( rc == 0)
        {
            image_names.erase(image->get_name());
        }

        return rc;
    };

    /**
     *  Bootstraps the database table(s) associated to the Image pool
     */
    static void bootstrap(SqlDB *_db)
    {
        Image::bootstrap(_db);
    };
    
    /**
     * Get the template table name
     *  @return string with the name of the template table
     */
    string get_template_table_name();

    /**
     *  Dumps the Image pool in XML format. A filter can be also added to the
     *  query
     *  @param oss the output stream to dump the pool contents
     *  @param where filter for the objects, defaults to all
     *  @return 0 on success
     */
    int dump(ostringstream& oss, const string& where);

private:
    /**
     *  This map stores the association between IIDs and Image names
     */
    map<string, int>    image_names;
    
    /**
     * Path to the image repository
     **/
    string              source_prefix;
    
    /**
     * Default image type
     **/
    string              default_type;

    /**
     * Default public scope
     **/
    string              default_public;

    /**
     * Default device prefix
     **/
    string              default_dev_prefix;
      
    /**
     *  Factory method to produce Image objects
     *    @return a pointer to the new Image
     */
    PoolObjectSQL * create()
    {
        return new Image;
    };

    /**
     *  Callback function to get output the image pool in XML format
     *  (Image::dump)
     *    @param num the number of columns read from the DB
     *    @param names the column names
     *    @param vaues the column values
     *    @return 0 on success
     */
    int dump_cb(void * _oss, int num, char **values, char **names);

    /**
     *  Callback function to build the image_names map
     *    @param num the number of columns read from the DB
     *    @param names the column names
     *    @param vaues the column values
     *    @return 0 on success
     */
    int init_cb(void *nil, int num, char **values, char **names);

    /**
     *  "Encrypts" the password with SHA1 digest
     *  @param password
     *  @return sha1 encrypted password
     */
    string sha1_digest(const string& pass);
};

#endif /*IMAGE_POOL_H_*/
