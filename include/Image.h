/* ------------------------------------------------------------------------ */
/* Copyright 2002-2018, OpenNebula Project, OpenNebula Systems              */
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
#include "ObjectCollection.h"
#include "Snapshots.h"

using namespace std;

class VirtualMachineDisk;

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
        DATABLOCK = 2, /** < User persistent data device */
        KERNEL    = 3, /** < Kernel files */
        RAMDISK   = 4, /** < Initrd files */
        CONTEXT   = 5  /** < Context files */
    };

    /**
     *  Return the string representation of an ImageType
     *    @param ob the type
     *    @return the string
     */
    static string type_to_str(ImageType ob)
    {
        switch (ob)
        {
            case OS:        return "OS" ; break;
            case CDROM:     return "CDROM" ; break;
            case DATABLOCK: return "DATABLOCK" ; break;
            case KERNEL:    return "KERNEL" ; break;
            case RAMDISK:   return "RAMDISK" ; break;
            case CONTEXT:   return "CONTEXT" ; break;
            default:        return "";
        }
    };

    /**
     *  Return the string representation of an ImageType
     *    @param ob the type
     *    @return the string
     */
    static ImageType str_to_type(string& str_type);

    /**
     *  Type of Disks (used by the VMM_MAD). Values: BLOCK, CDROM or
     *  FILE
     */
    enum DiskType
    {
        FILE           = 0, /** < File-based disk */
        CD_ROM         = 1, /** < An ISO9660 disk */
        BLOCK          = 2, /** < Block-device disk */
        RBD            = 3, /** < CEPH RBD disk */
        RBD_CDROM      = 4, /** < CEPH RBD CDROM disk */
        GLUSTER        = 5, /** < Gluster Block Device */
        GLUSTER_CDROM  = 6, /** < Gluster CDROM Device Device */
        SHEEPDOG       = 7, /** < Sheepdog Block Device */
        SHEEPDOG_CDROM = 8, /** < Sheepdog CDROM Device Device */
        ISCSI          = 9, /** < iSCSI Volume (Devices Datastore) */
        NONE           = 255 /** < No disk type, error situation */
    };

    /**
     *  Return the string representation of a DiskType
     *    @param ob the type
     *    @return the string
     */
    static string disk_type_to_str(DiskType ob)
    {
        switch (ob)
        {
            case FILE:           return "FILE" ; break;
            case CD_ROM:         return "CDROM" ; break;
            case BLOCK:          return "BLOCK" ; break;
            case RBD:            return "RBD" ; break;
            case RBD_CDROM:      return "RBD_CDROM" ; break;
            case GLUSTER:        return "GLUSTER" ; break;
            case GLUSTER_CDROM:  return "GLUSTER_CDROM" ; break;
            case SHEEPDOG:       return "SHEEPDOG" ; break;
            case SHEEPDOG_CDROM: return "SHEEPDOG_CDROM" ; break;
            case ISCSI:          return "ISCSI" ; break;
            default:             return "";
        }
    };

    /**
     *  Return the string representation of a DiskType
     *    @param s_disk_type string representing the DiskTypr
     *    @return the DiskType (defaults to FILE)
     */
    static DiskType str_to_disk_type(string& s_disk_type);

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
        ERROR     = 5, /** < Error state the operation FAILED*/
        CLONE     = 6, /** < Image is being cloned */
        DELETE    = 7, /** < DS is deleting the image */
        USED_PERS = 8, /** < Image is in use and persistent */
        LOCKED_USED = 9,      /** < FS operation in progress, VMs waiting */
        LOCKED_USED_PERS = 10 /** < FS operation in progress, VMs waiting. Persistent */
    };

    /**
     * Returns the string representation of an ImageState
     * @param state The state
     * @return the string representation
     */
    static string state_to_str(ImageState state)
    {
        switch(state)
        {
            case INIT:              return "INIT";          break;
            case READY:             return "READY";         break;
            case USED:              return "USED";          break;
            case DISABLED:          return "DISABLED";      break;
            case LOCKED:            return "LOCKED";        break;
            case ERROR:             return "ERROR";         break;
            case CLONE:             return "CLONE";         break;
            case DELETE:            return "DELETE";        break;
            case USED_PERS:         return "USED";          break;
            case LOCKED_USED:       return "LOCKED_USED";   break;
            case LOCKED_USED_PERS:  return "LOCKED_USED";   break;
            default:                return "";
        }
    };

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
    bool is_persistent() const
    {
        return (persistent_img == 1);
    };

    bool is_managed() const
    {
        bool one_managed;

        if (get_template_attribute("OPENNEBULA_MANAGED", one_managed) == false)
        {
            one_managed = true;
        }

        return one_managed;
    }

    /**
     *  Check the PERSISTENT attribute in an image Template, if not set the
     *  DEFAULT_IMAGE_PERSISTENT and DEFAULT_IMAGE_PERSISTENT_NEW are check in
     *  user/group/oned.conf to set the attribute in the image.
     *    @param image_template
     *    @param uid of the user making the request
     *    @param gid of the group of the user making the request
     *    @param is_allocate true for one.image.allocate API Calls
     *    @return true if the image is set to persistent, false otherwise
     */
    static bool test_set_persistent(Template * image_template, int uid, int gid,
            bool is_allocate);

    /**
     *  Returns the source path of the image
     *     @return source of image
     */
    const string& get_source() const
    {
        return source;
    }

    /**
     *  Returns the original path of the image
     *     @return path of image
     */
    const string& get_path() const
    {
        return path;
    }

    /**
     *  Returns the fs_type for the image (defined for datablocks)
     *     @return fs_type
     */
    const string& get_fstype() const
    {
        return fs_type;
    }

    /**
     *  Returns the size of the image
     *     @return size in MB
     */
    long long get_size() const
    {
        return size_mb;
    }


    /**
     *  Sets the source path of the image
     */
    void set_source(const string& _source)
    {
        source = _source;
    }

    /**
     *  Sets the size for the image
     */
    void set_size(long long _size_mb)
    {
        size_mb = _size_mb;
    }

    /**
     *  Returns the type of the image
     *     @return type
     */
    ImageType get_type() const
    {
        return type;
    }
    /**
     *  Returns the image state
     *     @return state of image
     */
    ImageState get_state() const
    {
        return state;
    }

    /**
     *  Sets the image state
     *     @param state of image
     */
    void set_state(ImageState _state);

    /**
     * Moves the image from the locked* states to ready, used, used_persistent
     */
    void set_state_unlock();

    /**
     *  Return the ID of the image we are cloning this one from (if any)
     */
    int get_cloning_id() const
    {
        return cloning_id;
    }

    /**
     *  Sets the ID of the image we are cloning this one from (if any)
     */
    void set_cloning_id(int id)
    {
        cloning_id = id;
    }

    /**
     *  Clear the cloning state of the image
     */
    void clear_cloning_id()
    {
        cloning_id = -1;
    }

    /* ---------------------------------------------------------------------- */
    /*   Access Image Counters (running vms and cloning operations )          */
    /* ---------------------------------------------------------------------- */

    int dec_running (int vm_id)
    {
        if ( vm_collection.del(vm_id) == 0 )
        {
            running_vms--;
        }

        return running_vms;
    }

    int inc_running(int vm_id)
    {
        if ( vm_collection.add(vm_id) == 0 )
        {
            running_vms++;
        }

        return running_vms;
    }

    int get_running() const
    {
        return running_vms;
    }

    set<int> get_running_ids() const
    {
        return vm_collection.clone();
    }

    int get_cloning() const
    {
        return cloning_ops;
    }

    int dec_cloning(PoolObjectSQL::ObjectType ot, int oid)
    {
        int rc = -1;

        if (ot == PoolObjectSQL::IMAGE)
        {
            rc = img_clone_collection.del(oid);
        }
        else //if (ot == PoolObjectSQL::MARKETPLACEAPP)
        {
            rc = app_clone_collection.del(oid);
        }

        if ( rc == 0 )
        {
            cloning_ops--;
        }

        return cloning_ops;
    }

    int inc_cloning(PoolObjectSQL::ObjectType ot, int oid)
    {
        int rc = -1;

        if (ot == PoolObjectSQL::IMAGE)
        {
            rc = img_clone_collection.add(oid);
        }
        else //if (ot == PoolObjectSQL::MARKETPLACEAPP)
        {
            rc = app_clone_collection.add(oid);
        }

        if ( rc == 0 )
        {
            cloning_ops++;
        }

        return cloning_ops;
    }

    /**
     * Sets the Image type.
     *
     * @param _type the new type. It will be transformed to upper case
     * @return 0 on success, -1 otherwise
     */
    int set_type(string& _type, string& error);

    /**
     *  Check if the image is used for saving_as a current one
     *  @return true if the image will be used to save an existing image.
     */
    bool is_saving()
    {
        return (static_cast<ImageTemplate *>(obj_template))->is_saving();
    }

    /**
     *  Set/Unset an image as persistent
     *    @param persistent true to make an image persistent
     *    @param error_str Returns the error reason, if any
     *
     *    @return 0 on success
     */
    int persistent(bool persis, string& error_str)
    {
        ostringstream oss;

        if ((snapshots.size() > 0) && !persis)
        {
           error_str = "Image has snapshots.";
           return -1;
        }

        switch(state)
        {
            case USED:
            case CLONE:
            case USED_PERS:
            case LOCKED_USED:
            case LOCKED_USED_PERS:
                oss << "Image cannot be in state " << state_to_str(state) <<".";
                error_str = oss.str();
                return -1;

            case INIT:
            case READY:
            case DISABLED:
            case LOCKED:
            case ERROR:
            case DELETE:
                if (persis == true)
                {
                    persistent_img = 1;
                }
                else
                {
                    persistent_img = 0;
                }

                break;
        }

        return 0;
    }

    /**
     * Modifies the given disk attribute adding the following attributes:
     *  * SOURCE: the file-path.
     *  * TARGET: will only be set if the Image's definition includes it.
     *
     * @param disk attribute for the VM template
     * @param img_type will be set to the used image's type
     * @param dev_prefix will be set to the defined dev_prefix,
     *   or the default one
     * @param inherit_attrs Attributes to be inherited from the image template
     *   into the disk
     *
     */
    void disk_attribute(VirtualMachineDisk *  disk,
                        ImageType&            img_type,
                        string&               dev_prefix,
                        const vector<string>& inherit_attrs);
    /**
     *  Factory method for image templates
     */
    Template * get_new_template() const
    {
        return new ImageTemplate;
    }

    /**
     * Returns the Datastore ID
     */
    int get_ds_id() const
    {
        return ds_id;
    };

    /**
     * Returns the Datastore name
     */
    const string& get_ds_name() const
    {
        return ds_name;
    };

    /**
     * Updates the Datastore name
     */
    void set_ds_name(const string& name)
    {
        ds_name = name;
    };

    /**
     * Clones this image template including image specific attributes: NAME,
     * TYPE, PATH, FSTYPE, SIZE and PERSISTENT
     * @param new_name Value for the NAME attribute
     * @return Pointer to the new tempalte 0 in case of success
     */
    ImageTemplate * clone_template(const string& new_name) const;

    /* ---------------------------------------------------------------------- */
    /* Snapshots functions                                                    */
    /* ---------------------------------------------------------------------- */
    /**
     *  Return the snapshot list of this image
     */
    const Snapshots& get_snapshots() const
    {
        return snapshots;
    };

    /**
     *  Clear all the snapshots in the list
     */
    void clear_snapshots()
    {
        snapshots.clear();
    }

    /**
     *  Set the snapshots for this image
     *  @param snapshot list
     */
    void set_snapshots(const Snapshots& s)
    {
        snapshots = s;
        snapshots.clear_disk_id();
    };

    void delete_snapshot(int snap_id)
    {
        snapshots.delete_snapshot(snap_id);
    };

    void revert_snapshot(int snap_id)
    {
        snapshots.active_snapshot(snap_id);
    };

    void set_target_snapshot(int snap_id)
    {
        target_snapshot = snap_id;
    };

    int get_target_snapshot()
    {
        return target_snapshot;
    };

    void clear_target_snapshot()
    {
        target_snapshot = -1;
    };

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
    ImageType    type;

    /**
     *  Type for the Disk
     */
    DiskType     disk_type;

    /**
     *  Persistency of the Image
     */
    int          persistent_img;

    /**
     *  Registration time
     */
    time_t       regtime;

    /**
     *  Path to the image
     */
    string       source;

    /**
     *  Original Path to the image (optional if source is given or datablock)
     */
    string       path;

    /**
     *  File system type for the image (mandatory for datablocks)
     */
    string       fs_type;

    /**
     *  Size of the image in MB
     */
    long long size_mb;

     /**
      *  Image state
      */
    ImageState   state;

    /**
     * Number of VMs using the image
     */
    int running_vms;

    /**
     * Number of pending cloning operations, for both images and apps
     */
    int cloning_ops;

    /**
     * Indicates if this Image is a clone of another one.
     * Once the clone process is complete, it should be set to -1
     */
    int cloning_id;

    /**
     * Datastore ID
     */
    int ds_id;

    /**
     * Datastore name
     */
    string ds_name;

    /**
     *  Stores a collection with the VMs using the image
     */
    ObjectCollection vm_collection;

    /**
     *  Stores a collection with the Images cloning this image
     */
    ObjectCollection img_clone_collection;

    /**
     *  Stores a collection with the Marketplace apps cloning this image
     */
    ObjectCollection app_clone_collection;

    /**
     * Snapshot list for this image
     */
    Snapshots snapshots;

    /**
     * ID of the snapshot being processed (if any)
     */
    int target_snapshot;

    // *************************************************************************
    // DataBase implementation (Private)
    // *************************************************************************

    /**
     *  Execute an INSERT or REPLACE Sql query.
     *    @param db The SQL DB
     *    @param replace Execute an INSERT or a REPLACE
     *    @param error_str Returns the error reason, if any
     *    @return 0 on success
     */
    int insert_replace(SqlDB *db, bool replace, string& error_str);

    /**
     *  Bootstraps the database table(s) associated to the Image
     *    @return 0 on success
     */
    static int bootstrap(SqlDB * db)
    {
        ostringstream oss_image(Image::db_bootstrap);

        return db->exec_local_wr(oss_image);
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
          const string&  uname,
          const string&  gname,
          int            umask,
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
