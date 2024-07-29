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

#ifndef VIRTUAL_MACHINE_DISK_H_
#define VIRTUAL_MACHINE_DISK_H_

#include <queue>
#include <set>
#include <memory>

#include "VirtualMachineAttribute.h"
#include "Snapshots.h"
#include "NebulaUtil.h"

class AuthRequest;

/**
 * The VirtualMachine DISK attribute
 */
class VirtualMachineDisk : public VirtualMachineAttribute
{
public:
    VirtualMachineDisk(VectorAttribute *va, int id):
        VirtualMachineAttribute(va, id), snapshots(0) {};

    virtual ~VirtualMachineDisk()
    {
        delete snapshots;
    };

    /* ---------------------------------------------------------------------- */
    /* DISK get/set functions for boolean disk flags                          */
    /*   ATTACH                                                               */
    /*   RESIZE                                                               */
    /*   OPENNEBULA_MANAGED                                                   */
    /*   ALLOW_ORPHANS                                                        */
    /*   CLONING                                                              */
    /*   PERSISTENT                                                           */
    /*   DISK_SNAPSHOT_ACTIVE                                                 */
    /* ---------------------------------------------------------------------- */
    bool is_persistent() const
    {
        return is_flag("PERSISTENT");
    }

    Snapshots::AllowOrphansMode allow_orphans() const;

    void set_attach()
    {
        set_flag("ATTACH");
    };

    void set_resize()
    {
        set_flag("RESIZE");
    };

    void clear_resize()
    {
        clear_flag("RESIZE");
    };

    void clear_cloning()
    {
        clear_flag("CLONING");
    };

    bool is_cloning() const
    {
        return is_flag("CLONING");
    }

    void set_active_snapshot()
    {
        set_flag("DISK_SNAPSHOT_ACTIVE");
    };

    void clear_active_snapshot()
    {
        clear_flag("DISK_SNAPSHOT_ACTIVE");
    };

    bool is_active_snapshot() const
    {
        return is_flag("DISK_SNAPSHOT_ACTIVE");
    }

    void set_saveas()
    {
        set_flag("HOTPLUG_SAVE_AS_ACTIVE");
    };

    void clear_saveas()
    {
        clear_flag("HOTPLUG_SAVE_AS_ACTIVE");
    };

    /* ---------------------------------------------------------------------- */
    /* Disk attributes, not accesible through vector_value                    */
    /* ---------------------------------------------------------------------- */
    /**
     *  Return the disk id ("DISK_ID")
     */
    int get_disk_id() const
    {
        return get_id();
    }

    /**
     *  Return the "effective" target (LN_TARGET/CLONE_TARGET)
     */
    std::string get_tm_target() const;

    /**
     *  Check if the given disk is volatile
     */
    bool is_volatile() const;

    /**
     *  Get the effective uid to get an image. Used in VM parsers
     */
    int get_uid(int _uid) const;

    /**
     *  Gets the ID of the image associated to the disks
     *    @param id the image id, if found
     *    @param uid effective user id making the call
     *    @return 0 if the disk uses an image, -1 otherwise
     */
    int get_image_id(int &id, int uid) const;

    /**
     *  Return the TM_MAD_SYSTEM attribute
     */
    std::string get_tm_mad_system() const;

    /* ---------------------------------------------------------------------- */
    /* Image Manager Interface                                                */
    /* ---------------------------------------------------------------------- */
    /**
     *  Fills the disk extended information attributes
     */
    void extended_info(int uid);

    /**
     *  Fills the authorization request for this disk based on its Image use
     *  requirements
     *    @param uid of user making the request
     *    @param ar auth request
     *    @param  check_lock for check if the resource is lock or not
     */
    void authorize(int uid, AuthRequest* ar, bool check_lock);

    /* ---------------------------------------------------------------------- */
    /* Snapshots Interface                                                    */
    /* ---------------------------------------------------------------------- */
    /**
     *  Set the snapshots for this disks
     */
    void set_snapshots(Snapshots * _snapshots)
    {
        snapshots = _snapshots;
    };

    /**
     *  Return the snapshots of this disk
     */
    const Snapshots * get_snapshots() const
    {
        return snapshots;
    }

    /**
     *  Clear snapshots from the disk and free resources
     */
    void clear_snapshots()
    {
        if ( snapshots == 0 )
        {
            return;
        }

        snapshots->clear();

        delete snapshots;

        snapshots = 0;
    }

    /**
     *  @return total snapshot size (virtual) in mb
     */
    long long get_total_snapshot_size() const
    {
        if ( snapshots == 0 )
        {
            return 0;
        }

        return snapshots->total_size();
    }

    /**
     *  Get the size (virtual) in mb of the given snapshot
     *    @param id of the snapshot
     *    @return size or 0 if not found
     */
    long long get_snapshot_size(int snap_id) const
    {
        if ( snapshots == 0 )
        {
            return 0;
        }

        return snapshots->snapshot_size(snap_id);
    }

    /**
     *  @return true if the disk has snapshots
     */
    bool has_snapshots() const
    {
        return (snapshots != 0);
    }

    bool has_snapshot(int snap_id) const
    {
        if (!has_snapshots())
        {
            return false;
        }

        return snapshots->exists(snap_id);
    }


    /**
     * Renames a snapshot
     *
     * @param id_snap of the snapshot
     * @param new_name of the snapshot
     * @return 0 on success
     */
    int rename_snapshot(int snap_id, const std::string& new_name,
                        std::string& str_error)
    {
        if (!snapshots)
        {
            str_error = "The VM does not have any snapshot";
            return -1;
        }

        return snapshots->rename_snapshot(snap_id, new_name, str_error);
    }

    /**
     *  Creates a new snapshot of the disk
     *    @param name a description for this snapshot
     *    @param error if any
     *    @return the id of the new snapshot or -1 if error
     */
    int create_snapshot(const std::string& name, std::string& error);

    /**
     *  Sets the snap_id as active, the VM will boot from it next time
     *    @param snap_id of the snapshot
     *    @param revert true if the cause of changing the active snapshot
     *                  is because a revert
     *    @return -1 if error
     */
    int revert_snapshot(int snap_id, bool revert);

    /**
     *  Deletes the snap_id from the list
     *    @param snap_id of the snapshot
     *    @param ds_quotas template with snapshot usage for the DS quotas
     *    @param vm_quotas template with snapshot usage for the VM quotas
     *    @param io delete ds quotas from image owners
     *    @param vo delete ds quotas from vm owners
     */
    void revert_snapshot_quotas(int snap_id, Template& ds_quota, Template& vm_quota,
                                bool& io, bool& vo);

    /**
     *  Deletes the snap_id from the list
     *    @param snap_id of the snapshot
     *    @param ds_quotas template with snapshot usage for the DS quotas
     *    @param vm_quotas template with snapshot usage for the VM quotas
     *    @param io delete ds quotas from image owners
     *    @param vo delete ds quotas from vm owners
     */
    void delete_snapshot(int snap_id, Template& ds_quota, Template& vm_quota,
                         bool& io, bool& vo);

    /* ---------------------------------------------------------------------- */
    /* Disk resize functions                                                  */
    /* ---------------------------------------------------------------------- */
    /**
     *  Cleans the resize attribute from the disk
     *    @param restore the previous size
     */
    void clear_resize(bool restore);

    /**
     *  Calculate the quotas for a resize operation on the disk
     *    @param delta_size = new_size - old_size
     *    @param dsdeltas increment in datastore usage
     *    @param vmdelta increment in system datastore usage
     *    @param do_img_owner quotas counter allocated for image uid/gid
     *    @param do_vm_owner quotas counter allocated for vm uid/gid
     *
     */
    void resize_quotas(long long delta_size, Template& dsdelta, Template& vmdelta,
                       bool& do_img_owner, bool& do_vm_owner);

    /* ---------------------------------------------------------------------- */
    /* Disk space usage functions                                             */
    /* ---------------------------------------------------------------------- */

    /**
     *  @param include_snapshots count also disk snapshot size
     *  @return the space required by this disk in the system datastore
     */
    long long system_ds_size(bool include_snapshots) const;

    /**
     *  @return the space required by this disk in the image datastore
     */
    long long image_ds_size() const;

    /**
     *  Compute the storage needed by the disk in the system and/or image
     *  datastore
     *    @param ds_id of the datastore
     *    @param img_sz size in image datastore needed
     *    @param sys_sz size in system datastore needed
     */
    void datastore_sizes(int& ds_id, long long& img_sz, long long& sys_sz) const;

    /**
     *  Update the TYPE and DISK_TYPE attributes based on the system DS
     *  name
     *    @param ds_name of the system ds tm_mad
     */
    void set_types(const std::string& ds_name);

    /**
     *  Marshall disk attributes in XML format with just essential information
     *    @param stream to write the disk XML description
     */
    void to_xml_short(std::ostringstream& oss) const;

private:

    Snapshots * snapshots;
};


/**
 *  Set of VirtualMachine DIKS
 */
class VirtualMachineDisks : public VirtualMachineAttributeSet
{
public:
    /* ---------------------------------------------------------------------- */
    /* Constructor and Initialization functions                               */
    /* ---------------------------------------------------------------------- */
    /**
     *  Creates the VirtualMachineDisk set from a Template with DISK=[...]
     *  attributes, in this case the id's of each disk is auto assigned
     *    @param tmpl template with DISK
     */
    VirtualMachineDisks(Template * tmpl, bool has_id):
        VirtualMachineAttributeSet(false)
    {
        std::vector<VectorAttribute *> vas;

        tmpl->get(DISK_NAME, vas);

        init(vas, has_id);
    };

    /**
     *  Creates the VirtualMachineDisk set from a vector of DISK VectorAttribute
     *  The DIKS need to have a DISK_ID assgined to create the disk set.
     *    @param va vector of DISK Vector Attributes
     */
    VirtualMachineDisks(std::vector<VectorAttribute *>& va, bool has_id,
                        bool dispose):
        VirtualMachineAttributeSet(dispose)
    {
        init(va, has_id);
    };

    /**
     *  Creates an empty disk set
     */
    VirtualMachineDisks(bool dispose):
        VirtualMachineAttributeSet(dispose) {};

    virtual ~VirtualMachineDisks() {};

    /**
     *  Function used to initialize the attribute map based on a vector of DISK
     */
    void init(std::vector<VectorAttribute *>& vas, bool has_id)
    {
        if ( has_id )
        {
            init_attribute_map(DISK_ID_NAME, vas);
        }
        else
        {
            init_attribute_map("", vas);
        }
    }

    /* ---------------------------------------------------------------------- */
    /* Iterators                                                              */
    /* ---------------------------------------------------------------------- */
    /**
     *  Generic iterator for the disk set.
     */
    class DiskIterator : public AttributeIterator
    {
    public:
        DiskIterator():AttributeIterator() {};
        DiskIterator(const AttributeIterator& dit):AttributeIterator(dit) {};
        virtual ~DiskIterator() {};

        VirtualMachineDisk * operator*() const
        {
            return static_cast<VirtualMachineDisk *>(map_it->second);
        }
    };

    DiskIterator begin()
    {
        DiskIterator it(ExtendedAttributeSet::begin());
        return it;
    }

    DiskIterator end()
    {
        DiskIterator it(ExtendedAttributeSet::end());
        return it;
    }

    typedef class DiskIterator disk_iterator;

    /* ---------------------------------------------------------------------- */
    /* DISK interface                                                         */
    /* ---------------------------------------------------------------------- */
    /**
     * Returns the DISK attribute for a disk
     *   @param disk_id of the DISK
     *   @return pointer to the attribute ir null if not found
     */
    VirtualMachineDisk * get_disk(int disk_id) const
    {
        return static_cast<VirtualMachineDisk*>(get_attribute(disk_id));
    }

    /**
     *  Computes the storage needed in the system datastore. The static version
     *  uses the disk definitions in the template (first argument)
     *    @param include_snapshots count also disk snapshot size
     *    @return the total disk SIZE that the VM instance needs in the system DS
     */
    long long system_ds_size(bool include_snapshots);

    static long long system_ds_size(Template * ds_tmpl, bool include_snapshots);

    /**
     *  Completes the information of the disks (IMAGE_ID, SIZE...)
     */
    void extended_info(int uid);

    static void extended_info(int uid, Template * tmpl);

    /**
     *  Computes the storage in the image DS needed for the disks in a VM
     *  template
     *    @param tmpl with DISK descriptions
     *    @param ds_quotas templates for quota updates
     */
    static void image_ds_quotas(Template * tmpl,
                                std::vector<std::unique_ptr<Template>>& ds_quotas);

    /**
     *  Sets Datastore information on volatile disks
     */
    bool volatile_info(int ds_id);

    /**
     *  @return the total disk SIZE that the VM instance needs in the system DS
     */
    void image_ds_size(std::map<int, long long>& ds_size) const;

    /**
     *  Gets the IDs of the images associated to the disk set
     *    @param ids set of image ids
     *    @param uid effective user id making the call
     */
    void get_image_ids(std::set<int>& ids, int uid);

    /**
     *  Marshall disks in XML format with just essential information
     *    @param xml string to write the disk XML description
     */
    std::string& to_xml_short(std::string& xml);

    /**
     *  Check if a tm_mad is valid for each Virtual Machine Disk and set
     *  clone_target and ln_target
     *  @param tm_mad is the tm_mad for system datastore chosen
     */
    int check_tm_mad(const std::string& tm_mad, std::string& error);

    /* ---------------------------------------------------------------------- */
    /* Image Manager Interface                                                */
    /* ---------------------------------------------------------------------- */
    /**
     *  Get all disk images for this Virtual Machine
     *  @param vm_id of the VirtualMachine
     *  @param uid of owner
     *  @param tm_mad_sys tm_mad_sys mode to deploy the disks
     *  @param disks list of DISK Attribute in VirtualMachine Template
     *  @param context attribute, 0 if none
     *  @param error_str Returns the error reason, if any
     *  @return 0 if success
     */
    int get_images(int vm_id, int uid, const std::string& tm_mad_sys,
                   std::vector<VectorAttribute *> disks, VectorAttribute * context,
                   bool is_q35, std::string& error_str);

    /**
     *  Release the images in the disk set
     *    @param vmid id of VM
     *    @param img_error true if the image has to be set in error state
     *    @param quotas disk space usage to free from image datastores
     */
    void release_images(int vmid, bool img_error,
                        std::vector<Template *>& quotas);

    /* ---------------------------------------------------------------------- */
    /* DISK cloning functions                                                 */
    /* ---------------------------------------------------------------------- */
    /**
     * Returns true if any of the disks is waiting for an image in LOCKED state
     * to become READY
     *   @return true if cloning
     */
    bool has_cloning();

    /**
     * Returns the image IDs for the disks waiting for the LOCKED state be READY
     *   @param ids image ID set
     */
    void get_cloning_image_ids(std::set<int>& ids);

    /**
     * Clears the flag for the disks waiting for the given image
     */
    void clear_cloning_image_id(int image_id,
                                const std::string& source,
                                const std::string& format);

    /* ---------------------------------------------------------------------- */
    /* Attach disk Interface                                                  */
    /* ---------------------------------------------------------------------- */
    /**
     *  Clear attach status from the attach disk (ATTACH=YES)
     */
    VirtualMachineDisk * delete_attach()
    {
        return static_cast<VirtualMachineDisk *>(remove_attribute("ATTACH"));
    }

    /**
     *  Get the attach disk (ATTACH=YES)
     */
    VirtualMachineDisk * get_attach() const
    {
        return static_cast<VirtualMachineDisk *>(get_attribute("ATTACH"));
    }

    /**
     *  Sets the attach attribute to the given disk
     *    @param disk_id of the DISK
     *    @return 0 if the disk_id was found -1 otherwise
     */
    int set_attach(int disk_id);

    /**
     *  Cleans the attach attribute from the disk
     */
    void clear_attach()
    {
        clear_flag("ATTACH");
    }

    /**
     *  Prepares a disk to be attached to the virtual machine and adds it to the
     *  disk set. It checks target assigment and cluster compatibility.
     *     @param vmid id of virtual machine
     *     @param uid of VM owner
     *     @param cluster_id where the VM is running
     *     @param vdisk VectorAttribute for the new disk
     *     @param vcontext VectorAttribute for the CONTEXT disk, 0 if none
     *     @param error
     *
     *     @return Pointer to the new disk or 0 in case of error
     */
    VirtualMachineDisk * set_up_attach(int vmid, int uid, int cluster_id,
                                       VectorAttribute * vdisk, const std::string& tsys,
                                       const VectorAttribute * vcontext, std::string& error);

    /* ---------------------------------------------------------------------- */
    /* Save as Interface                                                      */
    /* ---------------------------------------------------------------------- */
    /**
     *  Get the saveas disk (HOTPLUG_SAVE_AS_ACTIVE = YES)
     */
    VirtualMachineDisk * get_saveas() const
    {
        return static_cast<VirtualMachineDisk *>(
                       get_attribute("HOTPLUG_SAVE_AS_ACTIVE"));
    }

    /**
     *  Mark the disk that is going to be "save as"
     *    @param disk_id of the VM
     *    @param snap_id of the disk to save, -1 to select the active snapshot
     *    @param iid The image id used by the disk
     *    @param size The disk size. This may be different to the original
     *    image size
     *    @param err_str describing the error if any
     *    @return -1 if the image cannot saveas, 0 on success
     */
    int set_saveas(int disk_id, int snap_id, int &iid, long long &size,
                   std::string& err_str);

    /**
     *  Set save attributes for the disk
     *    @param  disk_id Index of the disk to save
     *    @param  source to save the disk
     *    @param  img_id ID of the image this disk will be saved to
     */
    int set_saveas(int disk_id, const std::string& source, int iid);

    /**
     * Clears the SAVE_AS_* attributes of the disk being saved as
     *    @return the ID of the image this disk will be saved to or -1 if it
     *    is not found.
     */
    int clear_saveas();

    /**
     * Get the original image id of the disk. It also checks that the disk can
     * be saved_as.
     *    @param  disk_id Index of the disk to save
     *    @param  source of the image to save the disk to
     *    @param  image_id of the image to save the disk to
     *    @param  tm_mad in use by the disk
     *    @param  ds_id of the datastore in use by the disk
     *    @return -1 if failure
     */
    int get_saveas_info(int& disk_id, std::string& source, int& image_id,
                        std::string& snap_id, std::string& tm_mad, std::string& ds_id) const;

    /* ---------------------------------------------------------------------- */
    /* Resize disk Interface                                                  */
    /* ---------------------------------------------------------------------- */
    VirtualMachineDisk * get_resize() const
    {
        return static_cast<VirtualMachineDisk *>(get_attribute("RESIZE"));
    }

    VirtualMachineDisk * delete_resize()
    {
        return static_cast<VirtualMachineDisk *>(remove_attribute("RESIZE"));
    }

    /**
     *  Sets the resize attribute to the given disk
     *    @param disk_id of the DISK
     *    @return 0 if the disk_id was found -1 otherwise
     */
    int set_resize(int disk_id);

    /**
     *  Prepares a disk to be resized.
     *     @param disk_id of disk
     *     @param size new size for the disk (needs to be greater than current)
     *     @param error
     *
     *     @return 0 on success
     */
    int set_up_resize(int disk_id, long size, std::string& error);

    /* ---------------------------------------------------------------------- */
    /* SNAPSHOT interface                                                     */
    /* ---------------------------------------------------------------------- */
    VirtualMachineDisk * get_active_snapshot() const
    {
        return static_cast<VirtualMachineDisk *>(
                       get_attribute("DISK_SNAPSHOT_ACTIVE"));
    }

    /**
     *  Set the snapshots for a disk
     *    @param id of disk
     *    @param snapshots of disk;
     */
    void set_snapshots(int id, Snapshots * snapshots);

    /**
     *  Return the snapshots for the disk
     */
    const Snapshots * get_snapshots(int id, std::string& error) const;

    /**
     *  Set the disk as being snapshotted (reverted...)
     *    @param disk_id of the disk
     *    @param snap_id of the target snap_id
     */
    int set_active_snapshot(int id, int snap_id);

    /**
     *  Unset the current disk being snapshotted (reverted...)
     */
    void clear_active_snapshot();

    /**
     *  Get information about the disk to take the snapshot from
     *    @param ds_id id of the datastore
     *    @param tm_mad used by the datastore
     *    @param disk_id of the disk
     *    @param snap_id of the snapshot
     */
    int get_active_snapshot(int& ds_id, std::string& tm_mad, int& disk_id,
                            int& snap_id) const;
    /**
     *  Creates a new snapshot of the given disk
     *    @param disk_id of the disk
     *    @param name a description for this snapshot
     *    @param error if any
     *    @return the id of the new snapshot or -1 if error
     */
    int create_snapshot(int disk_id, const std::string& name, std::string& error);

    /**
     *  Sets the snap_id as active, the VM will boot from it next time
     *    @param disk_id of the disk
     *    @param snap_id of the snapshot
     *    @param revert true if the cause of changing the active snapshot
     *                  is because a revert
     *    @return -1 if error
     */
    int revert_snapshot(int disk_id, int snap_id, bool revert);

    /**
     *  Deletes the snap_id from the list
     *    @param disk_id of the disk
     *    @param snap_id of the snapshot
     *    @param ds_quotas template with snapshot usage for the DS quotas
     *    @param vm_quotas template with snapshot usage for the VM quotas
     *    @param io delete ds quotas from image owners
     *    @param vo delete ds quotas from vm owners
     */
    void delete_snapshot(int disk_id, int snap_id, Template& ds_quota, Template& vm_quota,
                         bool& io, bool& vo);

    /**
     *  Renames a given snapshot
     *    @param disk_id of the disk
     *    @param snap_id of the snapshot
     *    @param new_name of the snapshot
     *    @return 0 on success
     */
    int rename_snapshot(int disk_id, int snap_id,
                        const std::string& new_name, std::string& str_error);

    /**
     * Deletes all the disk snapshots for non-persistent disks and for persistent
     * disks in no shared system ds.
     *     @param vm_quotas The SYSTEM_DISK_SIZE freed by the deleted snapshots
     *     @param ds_quotas The DS SIZE freed from image datastores.
     */
    void delete_non_persistent_snapshots(Template &vm_quotas,
                                         std::vector<Template *> &ds_quotas);

    /* ---------------------------------------------------------------------- */
    /* BACKUP interface                                                       */
    /* ---------------------------------------------------------------------- */
    /**
     * Returns upper limit of the disk size needed to do a VM backup
     *  @param ds_quota The Datastore quota
     *  @param do_volatile consider volatile disks to compute size
     */
    long long backup_size(Template &ds_quota, bool do_volatile);

    /**
     *  Returns true if all disks support incremental backups. This requires
     *  QCOW2 format.
     *
     *  @param do_volatile consider volatile disks for incremental backups
     */
    bool backup_increment(bool do_volatile);

    /**
     *  Returns list of disk IDs, ready for backup
     *
     *  @param do_volatile consider volatile disks
     */
    void backup_disk_ids(bool do_volatile, std::vector<int>& ids);

protected:

    VirtualMachineAttribute * attribute_factory(VectorAttribute * va,
                                                int id) const
    {
        return new VirtualMachineDisk(va, id);
    };

private:

    static const char * DISK_NAME; //"DISK"

    static const char * DISK_ID_NAME; //"DISK_ID"

    /**
     *   Finds the first free target to assign to a disk
     *     @param dqueue queue of disks to assign target, each disk is associated
     *     with its bus (DEV_PREFIX)
     *     @param used_targets that cannot be used
     */
    void assign_disk_targets(
            std::queue<std::pair <std::string, VirtualMachineDisk *> >& dqueue,
            std::set<std::string>& used_targets);
};

#endif  /*VIRTUAL_MACHINE_DISK_H_*/

