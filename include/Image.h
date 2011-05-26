/* ------------------------------------------------------------------------ */
/* Copyright 2002-2011, OpenNebula Project Leads (OpenNebula.org)           */
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

#ifndef IMAGE_H_
#define IMAGE_H_

#include "PoolSQL.h"
#include "ImageTemplate.h"
#include "NebulaLog.h"

using namespace std;

/**
 *  The Image class.
 */
class Image : public PoolObjectSQL
{
public:
    /**
     *  Type of Images
     */
    enum ImageType
    {
        OS        = 0, /** < Base OS image */
        CDROM     = 1, /** < An ISO9660 image */
        DATABLOCK = 2  /** < User persistent data device */
    };

    /**
     *  Image State
     */
    enum ImageState
    {
        INIT      = 0, /** < Initialization state */
        READY     = 1, /** < Image ready to use */
        USED      = 2, /** < Image in use */
        DISABLED  = 3, /** < Image can not be instantiated by a VM */
        LOCKED    = 4, /** < FS operation for the Image in process */
        ERROR     = 5  /** < Error state the operation FAILED*/
    };

    /**
     *  Function to write an Image on an output stream
     */
     friend ostream& operator<<(ostream& os, Image& i);

    // *************************************************************************
    // Image Public Methods
    // *************************************************************************

    /**
     * Function to print the Image object into a string in XML format
     *  @param xml the resulting XML string
     *  @return a reference to the generated string
     */
    string& to_xml(string& xml) const;

    /**
     *  Rebuilds the object from an xml formatted string
     *    @param xml_str The xml-formatted string
     *
     *    @return 0 on success, -1 otherwise
     */
    int from_xml(const string &xml_str);

    /**
     *  Returns true if the image is persistent
     *     @return true if the image is persistent
     */
    bool isPersistent()
    {
        return (persistent_img == 1);
    };

    /**
     *  Returns the source path of the image
     *     @return source of image
     */
    const string& get_source()
    {
        return source;
    }

    /**
     *  Returns the source path of the image
     *     @return source of image
     */
    void set_source(const string& _source)
    {
        source = _source;
    }

    /**
     *  Returns the type of the image
     *     @return type
     */
    ImageType get_type()
    {
        return type;
    }
    /**
     *  Returns the image state
     *     @return state of image
     */
    ImageState get_state()
    {
        return state;
    }

    /**
     *  Sets the image state
     *     @param state of image
     */
    void set_state(ImageState _state)
    {
        state = _state;
    }

    /**
     *
     */
    int dec_running ()
    {
        return --running_vms;
    }

    /**
     *
     */
    int inc_running()
    {
        return ++running_vms;
    }

    /**
     *
     */
    int get_running()
    {
        return running_vms;
    }

    /**
     *  Set enum type
     *     @return 0 on success, -1 otherwise
     */
    int set_type(const string& _type)
    {
        int rc = 0;

        if ( _type == "OS" )
        {
            type = OS;
        }
        else if ( _type == "CDROM" )
        {
            type = CDROM;
        }
        else if ( _type == "DATABLOCK" )
        {
            type = DATABLOCK;
        }
        else
        {
            rc = -1;
        }

        return rc;
    }

    /**
     *  Publish or unpublish an image
     *    @param pub true to publish the image
     *    @return 0 on success
     */
    bool publish(bool pub)
    {
        bool success = false;

        if (pub == true)
        {
            if (!isPersistent())
            {
                public_obj = 1;
                success    = true;
            }
        }
        else
        {
            public_obj = 0;
            success    = true;
        }

        return success;
    }

    /**
     *  Set/Unset an image as persistent
     *    @param persistent true to make an image persistent
     *    @return 0 on success
     */
    bool persistent(bool persis)
    {
        bool success = false;

        if (persis == true)
        {
            if (!isPublic() && running_vms == 0)
            {
                persistent_img = 1;
                success        = true;
            }
        }
        else
        {
            persistent_img = 0;
            success        = true;
        }

        return success;
    }

    /**
     * Modifies the given disk attribute adding the following attributes:
     *  * SOURCE: the file-path.
     *  * BUS:    will only be set if the Image's definition includes it.
     *  * TARGET: the value set depends on:
     *    - OS images will be mounted at prefix + a:  hda, sda.
     *    - Prefix + b is reserved for the contex cdrom.
     *    - CDROM images will be at prefix + c:  hdc, sdc.
     *    - Several DATABLOCK images can be mounted, they will be set to
     *      prefix + (d + index) :   hdd, hde, hdf...
     * @param disk attribute for the VM template
     * @param index number of datablock images used by the same VM. Will be
     *              automatically increased.
     * @param img_type will be set to the used image's type
     */
    int disk_attribute(VectorAttribute * disk, int* index, ImageType* img_type);

private:

    // -------------------------------------------------------------------------
    // Friends
    // -------------------------------------------------------------------------

    friend class ImagePool;

    // -------------------------------------------------------------------------
    // Image Description
    // -------------------------------------------------------------------------

    /**
     *  Type of the Image
     */
    ImageType   type;

    /**
     *  Persistency of the Image
     */
    int         persistent_img;

    /**
     *  Registration time
     */
    time_t      regtime;

    /**
     *  Path to the image
     */
    string      source;

     /**
      *  Image state
      */
    ImageState  state;

    /**
     * Number of VMs using the image
     */
    int running_vms;

    // *************************************************************************
    // DataBase implementation (Private)
    // *************************************************************************

    /**
     *  Execute an INSERT or REPLACE Sql query.
     *    @param db The SQL DB
     *    @param replace Execute an INSERT or a REPLACE
     *    @return 0 on success
    */
    int insert_replace(SqlDB *db, bool replace);

    /**
     *  Bootstraps the database table(s) associated to the Image
     */
    static void bootstrap(SqlDB * db)
    {
        ostringstream oss_image(Image::db_bootstrap);

        db->exec(oss_image);
    };

    /**
     *  "Encrypts" the password with SHA1 digest
     *  @param password
     *  @return sha1 encrypted password
     */
    static string sha1_digest(const string& pass);

protected:

    // *************************************************************************
    // Constructor
    // *************************************************************************

    Image(int            uid,
          int            gid,
          ImageTemplate* img_template);

    virtual ~Image();

    // *************************************************************************
    // DataBase implementation
    // *************************************************************************

    static const char * db_names;

    static const char * db_bootstrap;

    static const char * table;

    /**
     *  Writes the Image in the database.
     *    @param db pointer to the db
     *    @return 0 on success
     */
    virtual int insert(SqlDB *db, string& error_str);

    /**
     *  Writes/updates the Images data fields in the database.
     *    @param db pointer to the db
     *    @return 0 on success
     */
    virtual int update(SqlDB *db);
};

#endif /*IMAGE_H_*/
