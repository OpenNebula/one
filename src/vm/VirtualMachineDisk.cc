/* -------------------------------------------------------------------------- */
/* Copyright 2002-2016, OpenNebula Project, OpenNebula Systems                */
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

#include "VirtualMachineDisk.h"
#include "NebulaUtil.h"
#include "Nebula.h"


/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

bool VirtualMachineDisk::is_volatile() const
{
    std::string type = vector_value("TYPE");

    one_util::toupper(type);

    return ( type == "SWAP" || type == "FS");
}

/* -------------------------------------------------------------------------- */

string VirtualMachineDisk::get_tm_target() const
{
    bool   clone;
    std::string target;

    if (vector_value("CLONE", clone) != 0)
    {
        return "";
    }

    if (clone)
    {
        target = vector_value("CLONE_TARGET");
    }
    else
    {
        target = vector_value("LN_TARGET");
    }

    return one_util::toupper(target);
}

/* -------------------------------------------------------------------------- */

int VirtualMachineDisk::get_uid(int _uid)
{
    istringstream  is;

    string uid_s ;
    string uname;
    int    uid;

    if (!(uid_s = vector_value("IMAGE_UID")).empty())
    {
        is.str(uid_s);
        is >> uid;

        if( is.fail() )
        {
            return -1;
        }
    }
    else if (!(uname = vector_value("IMAGE_UNAME")).empty())
    {
        User *     user;
        Nebula&    nd    = Nebula::instance();
        UserPool * upool = nd.get_upool();

        user = upool->get(uname,true);

        if ( user == 0 )
        {
            return -1;
        }

        uid = user->get_oid();

        user->unlock();
    }
    else
    {
        uid = _uid;
    }

    return uid;
}

/* -------------------------------------------------------------------------- */

int VirtualMachineDisk::get_image_id(int &id, int uid)
{
    int    iid;
    string iname;

    if ( vector_value("IMAGE_ID", iid) == 0 )
    {
        id = iid;
        return 0;
    }
    else if ( vector_value("IMAGE", iname) == 0 )
    {
        ImagePool * ipool = Nebula::instance().get_ipool();
        int uiid = get_uid(uid);

        if ( uiid == -1)
        {
            return -1;
        }

        Image * image = ipool->get(iname, uiid, true);

        if ( image != 0 )
        {
            id = image->get_oid();

            image->unlock();
        }

        return 0;
    }

    return -1;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualMachineDisk::extended_info(int uid)
{
    ImagePool * ipool  = Nebula::instance().get_ipool();

    ipool->disk_attribute(this, get_id(), uid);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualMachineDisk::authorize(int uid, AuthRequest* ar)
{
    string  source;
    Image * img = 0;

    int iid;

    PoolObjectAuth perm;

    ImagePool * ipool = Nebula::instance().get_ipool();

    if ( vector_value("IMAGE", source) == 0 )
    {
        int uiid = get_uid(uid);

        if ( uiid == -1)
        {
            return;
        }

        img = ipool->get(source , uiid, true);

        if ( img != 0 )
        {
            replace("IMAGE_ID", img->get_oid());
        }
    }
    else if ( vector_value("IMAGE_ID", iid) == 0 )
    {
        img = ipool->get(iid, true);
    }

    if (img == 0)
    {
        return;
    }

    img->get_permissions(perm);

    img->unlock();

    ar->add_auth(AuthRequest::USE, perm);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualMachineDisk::create_snapshot(const string& name, string& error)
{
    long long size_mb, snap_size;
    int snap_id;

    if (is_volatile())
    {
        error = "Cannot make snapshots on volatile disks";
        return -1;
    }

    if ( vector_value("SIZE", size_mb) != 0 )
    {
        error = "Wrong size in disk";
        return -1;
    }

    if ( snapshots == 0 )
    {
        snapshots = new Snapshots(get_id());

        snap_id   = snapshots->create_snapshot(name, size_mb);
        snap_size = size_mb;

        if (snap_id == -1)
        {
            snapshots = 0;
            delete snapshots;
        }
    }
    else
    {
        snap_id   = snapshots->create_snapshot(name, size_mb);
        snap_size = snapshots->get_total_size();
    }

    if (snap_id != -1)
    {
        replace("DISK_SNAPSHOT_ACTIVE", "YES");
        replace("DISK_SNAPSHOT_ID", snap_id);
        replace("DISK_SNAPSHOT_TOTAL_SIZE", snap_size);
    }

    return snap_id;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualMachineDisk::revert_snapshot(int snap_id)
{
    if ( snapshots == 0 )
    {
        return -1;
    }

    return snapshots->active_snapshot(snap_id);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
//  +--------+-------------------------------------+
//  |LN/CLONE|     PERSISTENT    |   NO PERSISTENT |
//  |        |---------+---------+-----------------+
//  | TARGET | created |  quota  | created | quota |
//  +--------+---------+---------+-----------------+
//  | SYSTEM | system  | VM + DS | system  | VM    |
//  | SELF   | image   | DS      | image   | DS    |
//  | NONE   | image   | DS      | image   | DS    |
//  +----------------------------------------------+
/* -------------------------------------------------------------------------- */

void VirtualMachineDisk::delete_snapshot(int snap_id, Template **ds_quotas,
        Template **vm_quotas)
{
    if ( snapshots == 0 )
    {
        return;
    }

    long long ssize = snapshots->get_snapshot_size(snap_id);

    snapshots->delete_snapshot(snap_id);

    long long snap_size = snapshots->get_total_size();

    replace("DISK_SNAPSHOT_TOTAL_SIZE", snap_size);

    if (snapshots->size() == 0)
    {
        delete snapshots;

        snapshots = 0;
    }

    string tm_target = get_tm_target();

	if (is_persistent() || tm_target != "SYSTEM")
	{
        *ds_quotas = new Template();

        (*ds_quotas)->add("DATASTORE", vector_value("DATASTORE_ID"));
        (*ds_quotas)->add("SIZE", ssize);
        (*ds_quotas)->add("IMAGES",0 );
	}

    if (tm_target == "SYSTEM")
    {
        *vm_quotas = new Template();

        VectorAttribute * delta_disk = new VectorAttribute("DISK");
        delta_disk->replace("TYPE", "FS");
        delta_disk->replace("SIZE", ssize);

        (*vm_quotas)->add("VMS", 0);
        (*vm_quotas)->set(delta_disk);
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

long long VirtualMachineDisk::system_ds_size()
{
	long long disk_sz, snapshot_sz = 0;

	if ( vector_value("SIZE", disk_sz) != 0 )
	{
		return 0;
	}

	//Volatile disks don't have snapshots
	if (vector_value("DISK_SNAPSHOT_TOTAL_SIZE", snapshot_sz) == 0)
	{
		disk_sz += snapshot_sz;
	}

	if ( is_volatile() || get_tm_target() == "SYSTEM" )
	{
		return disk_sz;
	}

	return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualMachineDisk::resize_quotas(long long new_size, Template& ds_deltas,
        Template& vm_deltas)
{
    long long current_size, delta_size;

	if ( vector_value("SIZE", current_size) != 0 )
    {
        return;
    }

    delta_size = new_size - current_size;

    bool is_system = get_tm_target() == "SYSTEM";
    string ds_id   = vector_value("DATASTORE_ID");

    if ( !is_volatile() && ( is_persistent() || !is_system ) )
    {
        ds_deltas.add("DATASTORE", ds_id);
        ds_deltas.add("SIZE", delta_size);
        ds_deltas.add("IMAGES", 0);
    }

    if ( is_volatile() || is_system )
    {
        VectorAttribute * delta_disk = new VectorAttribute("DISK");
        delta_disk->replace("TYPE", "FS");
        delta_disk->replace("SIZE", delta_size);

        vm_deltas.add("VMS", 0);
        vm_deltas.set(delta_disk);
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualMachineDisk::datastore_sizes(int& ds_id, long long& image_sz,
        long long& system_sz)
{
	long long tmp_size, snapshot_size;

	image_sz  = 0;
	system_sz = 0;
	ds_id     = -1;

	if ( vector_value("SIZE", tmp_size) != 0 )
	{
		return;
	}

	if ( vector_value("DISK_SNAPSHOT_TOTAL_SIZE", snapshot_size) == 0 )
	{
		tmp_size += snapshot_size;
	}

	if ( is_volatile() )
	{
		system_sz = tmp_size;
		return;
	}
	else
	{
		string target = get_tm_target();

		if ( target  == "SYSTEM" )
		{
			system_sz = tmp_size;
		}
		else if ( target == "SELF" )
		{
            vector_value("DATASTORE_ID", ds_id);

			image_sz = tmp_size;
		}// else if ( target == "NONE" )
	}
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualMachineDisk::clear_resize(bool restore)
{
    string size, size_prev;

    if ( restore && vector_value("SIZE_PREV", size_prev) == 0 )
    {
        replace("SIZE", size_prev);
    }

    remove("SIZE_PREV");
    clear_resize();
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
/* VIRTUALMACHINEDISKS                                                        */
/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

const char * VirtualMachineDisks::DISK_NAME = "DISK";

const char * VirtualMachineDisks::DISK_ID_NAME = "DISK_ID";

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

long long VirtualMachineDisks::system_ds_size()
{
    long long size = 0;

    for ( disk_iterator disk = begin() ; disk != end() ; ++disk )
    {
		size += (*disk)->system_ds_size();
    }

    return size;
}

long long VirtualMachineDisks::system_ds_size(Template * ds_tmpl)
{
    VirtualMachineDisks disks(ds_tmpl, false);

    return disks.system_ds_size();
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
/*
void VirtualMachineDisks::image_ds_size(bool resize_snapshot, long long system,
		std::map<int, long long>& ds_size) const
{
	int ds_id;
	long long system_sz, image_sz;

    for ( disk_iterator disk = begin() ; disk != end() ; ++disk )
    {
		(*disk)->ds_size(resize_snapshot, ds_id, image_sz, system_sz);

		system += system_sz;

		if ( ds_id != -1 && image_sz > 0 )
		{
			if (ds_size.count(ds_id) == 0)
			{
				ds_size[ds_id] = 0;
			}

			ds_size[ds_id] += image_sz;
		}
    }
}
*/
/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualMachineDisks::extended_info(int uid)
{
    for ( disk_iterator disk = begin() ; disk != end() ; ++disk )
    {
        (*disk)->extended_info(uid);
    }
}

void VirtualMachineDisks::extended_info(int uid, Template * tmpl)
{
    VirtualMachineDisks disks(tmpl, false);

    return disks.extended_info(uid);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

bool VirtualMachineDisks::volatile_info(int ds_id)
{
    DatastorePool * ds_pool = Nebula::instance().get_dspool();

    bool found = false;

    for ( disk_iterator disk = begin() ; disk != end() ; ++disk )
    {
        if ( !(*disk)->is_volatile() )
        {
            continue;
        }

        ds_pool->disk_attribute(ds_id, *disk);

        found = true;
    }

    return found;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualMachineDisks::get_image_ids(set<int>& ids, int uid)
{
    int id;

    for ( disk_iterator disk = begin() ; disk != end() ; ++disk )
    {
        if ( (*disk)->get_image_id(id, uid) == 0 )
        {
            ids.insert(id);
        }
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualMachineDisks::assign_disk_targets(
        std::queue<pair <string, VirtualMachineDisk *> >& dqueue,
        std::set<string>& used_targets)

{
    int    index = 0;
    string target;

    pair <string, VirtualMachineDisk *> disk_pair;

    while (dqueue.size() > 0 )
    {
        disk_pair = dqueue.front();
        index     = 0;

        do
        {
            target = disk_pair.first + static_cast<char>(('a'+ index));
            index++;
        }
        while ( used_targets.count(target) > 0 && index < 26 );

        disk_pair.second->replace("TARGET", target);

        used_targets.insert(target);

        dqueue.pop();
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualMachineDisks::get_images(int vm_id, int uid,
        vector<Attribute *> disks, VectorAttribute * vcontext,
        std::string& error_str)
{
    Nebula&    nd    = Nebula::instance();
    ImagePool* ipool = nd.get_ipool();

    vector<Attribute*>::iterator it;

    int         disk_id, image_id;
    std::string dev_prefix, target;

    Image::ImageType image_type;

    std::vector<int>      acquired_images;
    std::set<std::string> used_targets;

    std::queue<pair <std::string, VirtualMachineDisk *> > os_disk;
    std::queue<pair <std::string, VirtualMachineDisk *> > cdrom_disks;
    std::queue<pair <std::string, VirtualMachineDisk *> > datablock_disks;

    std::ostringstream oss;

    for(it = disks.begin(), disk_id = 0; it != disks.end(); ++it, ++disk_id)
    {
        Snapshots*       snapshots;
        VectorAttribute* vdisk = static_cast<VectorAttribute * >(*it);

        // ---------------------------------------------------------------------
        // Initialize DISK attribute information and acquire associated IMAGE
        // ---------------------------------------------------------------------
        VirtualMachineDisk * disk = new VirtualMachineDisk(vdisk, disk_id);

        if ( ipool->acquire_disk(vm_id, disk, disk_id, image_type, dev_prefix,
                uid, image_id, &snapshots, error_str) != 0 )
        {
            oss << "DISK " << disk_id << ": " << error_str;
            error_str = oss.str();

            goto error_common;
        }

        add_attribute(disk, disk_id);

        if (snapshots != 0)
        {
            if (image_type == Image::OS || image_type == Image::DATABLOCK)
            {
                disk->set_snapshots(snapshots);
            }
            else
            {
                delete snapshots;
            }
        }

        acquired_images.push_back(image_id);

        // ---------------------------------------------------------------------
        // Check TARGET and add disk to target assigment queue
        // ---------------------------------------------------------------------
        target = disk->vector_value("TARGET");

        if ( !target.empty() )
        {
            if (  used_targets.insert(target).second == false )
            {
                goto error_duplicated_target;
            }
        }
        else
        {
            switch(image_type)
            {
                case Image::OS:
                    if (os_disk.empty())//First OS disk gets the first device(a)
                    {
                        os_disk.push(make_pair(dev_prefix, disk));
                    }
                    else
                    {
                        datablock_disks.push(make_pair(dev_prefix, disk));
                    }
                    break;

                case Image::CDROM:
                    cdrom_disks.push(make_pair(dev_prefix, disk));
                    break;

                case Image::DATABLOCK:
                    datablock_disks.push(make_pair(dev_prefix, disk));
                    break;

                default:
                    break;
            }
        }
    }

    // -------------------------------------------------------------------------
    // Targets for OS Disks
    // -------------------------------------------------------------------------
    assign_disk_targets(os_disk, used_targets);

    // -------------------------------------------------------------------------
    // Target for CDROMs and Context disk (the last of the cdroms)
    // -------------------------------------------------------------------------
    if ( vcontext != 0 )
    {
        VirtualMachineDisk context(vcontext, disk_id);

        target = context.vector_value("TARGET");

        if ( !target.empty() )
        {
            if (  used_targets.insert(target).second == false )
            {
                goto error_duplicated_target;
            }
        }
        else
        {
            dev_prefix = context.vector_value("DEV_PREFIX");

            if (dev_prefix.empty())
            {
                dev_prefix = ipool->default_cdrom_dev_prefix();
            }

            cdrom_disks.push(make_pair(dev_prefix, &context));
        }

        // Disk IDs are 0..num-1, context disk is num
        vcontext->replace("DISK_ID", disk_id);

        assign_disk_targets(cdrom_disks, used_targets);
    }
    else
    {
        assign_disk_targets(cdrom_disks, used_targets);
    }

    // -------------------------------------------------------------------------
    // Targets for DATABLOCK Disks
    // -------------------------------------------------------------------------
    assign_disk_targets(datablock_disks, used_targets);

    return 0;

error_duplicated_target:
    oss << "Two disks have defined the same target " << target;
    error_str = oss.str();

error_common:
    ImageManager *  imagem = nd.get_imagem();

    for ( std::vector<int>::iterator img_it = acquired_images.begin() ;
            img_it != acquired_images.end(); ++img_it )
    {
        imagem->release_image(vm_id, *img_it, false);
    }

    return -1;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualMachineDisks::release_images(int vmid, bool image_error,
        map<int, Template *>& ds_quotas)
{
    Nebula& nd = Nebula::instance();
    ImageManager * imagem = nd.get_imagem();

    for (disk_iterator it = begin(); it != end() ; ++it)
    {
        int iid;

        if ( (*it)->vector_value("IMAGE_ID", iid) == 0 )
        {
            long long original_size, size;

            int rc;

            /* ---------- Update size on source image if needed ------------- */
            rc  = (*it)->vector_value("SIZE", size);
            rc += (*it)->vector_value("ORIGINAL_SIZE", original_size);

            if ( size > original_size )
            {
                imagem->set_image_size(iid, size);
            }

            /* ------- Update snapshots  on source image if needed ---------- */
            if ( (*it)->has_snapshots() )
            {
                imagem->set_image_snapshots(iid, *(*it)->get_snapshots());
            }

            /* --------- Compute space to free on image datastore ----------- */
            if ( !(*it)->is_persistent() && (*it)->get_tm_target() != "SYSTEM" )
            {
                long long delta_size = 0;

                if ( size > original_size )
                {
                    delta_size = size - original_size;
                }

                delta_size += (*it)->get_total_snapshot_size();

                Template * d_ds = new Template();

                d_ds->add("DATASTORE", (*it)->vector_value("DATASTORE_ID"));
                d_ds->add("SIZE", delta_size);
                d_ds->add("IMAGES", 0);

                ds_quotas.insert(pair<int, Template *>(iid, d_ds));
            }

            imagem->release_image(vmid, iid, image_error);
        }
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
/* DISK cloning functions                                                     */
/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

bool VirtualMachineDisks::has_cloning()
{
    for ( disk_iterator disk = begin() ; disk != end() ; ++disk )
    {
        if ( (*disk)->is_cloning() )
        {
            return true;
        }
    }

    return false;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualMachineDisks::get_cloning_image_ids(std::set<int>& ids)
{
    int image_id;

    for ( disk_iterator disk = begin() ; disk != end() ; ++disk )
    {
        if ( (*disk)->is_cloning() &&
                ((*disk)->vector_value("IMAGE_ID", image_id) == 0) )
        {
            ids.insert(image_id);
        }
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualMachineDisks::clear_cloning_image_id(int iid, const string& source)
{
    int image_id;

    for ( disk_iterator disk = begin() ; disk != end() ; ++disk )
    {
        if (((*disk)->vector_value("IMAGE_ID", image_id)== 0) && image_id == iid)
        {
            (*disk)->clear_cloning();
            (*disk)->replace("SOURCE", source);

            break;
        }
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
/* ATTACH DISK INTERFACE                                                      */
/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualMachineDisks::set_attach(int id)
{
    VirtualMachineDisk * disk = get_disk(id);

    if ( disk == 0 )
    {
        return -1;
    }

    disk->set_attach();

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

VirtualMachineDisk * VirtualMachineDisks::set_up_attach(int vmid, int uid,
        int cluster_id, VectorAttribute * vdisk, VectorAttribute * vcontext,
        string& error)
{
    set<string> used_targets;
    int         max_disk_id = -1;

    // -------------------------------------------------------------------------
    // Get the list of used targets and max_disk_id
    // -------------------------------------------------------------------------
    for ( disk_iterator disk = begin() ; disk != end() ; ++disk )
    {
        string target = (*disk)->vector_value("TARGET");

        if ( !target.empty() )
        {
            used_targets.insert(target);
        }

        int disk_id = (*disk)->get_disk_id();

        if ( disk_id > max_disk_id )
        {
            max_disk_id = disk_id;
        }
    }

    if ( vcontext != 0 )
    {
        string target = vcontext->vector_value("TARGET");

        if ( !target.empty() )
        {
            used_targets.insert(target);
        }

        int disk_id;

        vcontext->vector_value("DISK_ID", disk_id);

        if ( disk_id > max_disk_id )
        {
            max_disk_id = disk_id;
        }
    }

    // -------------------------------------------------------------------------
    // Acquire the new disk image
    // -------------------------------------------------------------------------
    Nebula&       nd     = Nebula::instance();
    ImagePool *   ipool  = nd.get_ipool();
    ImageManager* imagem = nd.get_imagem();

    Snapshots * snap = 0;

    string           dev_prefix;
    Image::ImageType img_type;

    int image_id;

    VirtualMachineDisk * disk = new VirtualMachineDisk(vdisk, max_disk_id + 1);

    int rc = ipool->acquire_disk(vmid, disk, max_disk_id + 1, img_type,
                         dev_prefix, uid, image_id, &snap, error);
    if ( rc != 0 )
    {
        return 0;
    }

    disk->set_snapshots(snap);

    string target = disk->vector_value("TARGET");

    if ( !target.empty() )
    {
        if (  used_targets.insert(target).second == false )
        {
            error = "Target " + target + " is already in use.";

            imagem->release_image(vmid, image_id, false);

            delete disk;
            return 0;
        }
    }
    else
    {
        queue<pair <string, VirtualMachineDisk *> > disks_queue;

        disks_queue.push(make_pair(dev_prefix, disk));

        assign_disk_targets(disks_queue, used_targets);
    }

    // -------------------------------------------------------------------------
    // Check that we don't have a cluster incompatibility.
    // -------------------------------------------------------------------------
    string disk_cluster_ids = disk->vector_value("CLUSTER_ID");

    if ( !disk_cluster_ids.empty() )
    {
        set<int> cluster_ids;
        one_util::split_unique(disk_cluster_ids, ',', cluster_ids);

        if (cluster_ids.count(cluster_id) == 0)
        {
            ostringstream oss;

            oss << "Image [" << image_id << "] is not part of cluster ["
                << cluster_id << "]";

            error = oss.str();

            imagem->release_image(vmid, image_id, false);

            delete disk;
            return 0;
        }
    }

    // -------------------------------------------------------------------------
    // Add disk to the set
    // -------------------------------------------------------------------------

    disk->set_attach();

    add_attribute(disk, disk->get_disk_id());

    return disk;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
/* RESIZE DISK INTERFACE                                                      */
/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualMachineDisks::set_resize(int id)
{
    VirtualMachineDisk * disk = get_disk(id);

    if ( disk == 0 )
    {
        return -1;
    }

    disk->set_resize();

    return 0;
}

/* -------------------------------------------------------------------------- */

int VirtualMachineDisks::set_up_resize(int disk_id, long size, string& err)
{
    VirtualMachineDisk * disk = get_disk(disk_id);
    long size_prev;

    if ( disk == 0 )
    {
        err = "Disk not found";
        return -1;
    }

    if ( disk->vector_value("SIZE", size_prev) != 0 )
    {
        err = "Wrong format for disk SIZE";
        return -1;
    }

    if ( size <= size_prev )
    {
        err = "New size has to be bigger than current one";
        return -1;
    }

    disk->replace("SIZE_PREV", size_prev);

    disk->replace("SIZE", size);

    disk->set_resize();

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
/* SNAPSHOT INTERFACE                                                         */
/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualMachineDisks::set_snapshots(int id, Snapshots * snapshots)
{
    VirtualMachineDisk * disk = get_disk(id);

    if ( disk != 0 )
    {
        disk->set_snapshots(snapshots);
    }
}

/* -------------------------------------------------------------------------- */

int VirtualMachineDisks::set_active_snapshot(int id, int snap_id)
{
    VirtualMachineDisk * disk = get_disk(id);

    if ( disk == 0 )
    {
        return -1;
    }

    disk->set_active_snapshot();
    disk->replace("DISK_SNAPSHOT_ID", snap_id);

    return 0;
}

/* -------------------------------------------------------------------------- */

void VirtualMachineDisks::clear_active_snapshot()
{
    VirtualMachineDisk * disk = get_active_snapshot();

    if ( disk != 0 )
    {
        disk->clear_active_snapshot();
        disk->remove("DISK_SNAPSHOT_ID");
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualMachineDisks::get_active_snapshot(int& ds_id, string& tm_mad,
        int& disk_id, int& snap_id)
{
    int rc;
    VirtualMachineDisk * disk =
        static_cast<VirtualMachineDisk *>(get_attribute("DISK_SNAPSHOT_ACTIVE"));

    if ( disk == 0 )
    {
        return -1;
    }

    if ( !disk->has_snapshots() )
    {
        return -1;
    }

    tm_mad  = disk->vector_value("TM_MAD");
    disk_id = disk->get_disk_id();

    rc = disk->vector_value("DATASTORE_ID", ds_id);
    rc += disk->vector_value("DISK_SNAPSHOT_ID", snap_id);

    if ( rc != 0 || tm_mad.empty() )
    {
        return -1;
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualMachineDisks::create_snapshot(int disk_id, const string& name,
        string& error)
{
    VirtualMachineDisk * disk =
        static_cast<VirtualMachineDisk *>(get_attribute(disk_id));

    if ( disk == 0 )
    {
        error = "VM disk does not exist";
        return -1;
    }

    return disk->create_snapshot(name, error);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

const Snapshots * VirtualMachineDisks::get_snapshots(int id, string& error) const
{
    VirtualMachineDisk * disk =
        static_cast<VirtualMachineDisk *>(get_attribute(id));

    if ( disk == 0 )
    {
        error = "VM disk does not exist";
        return 0;
    }

    const Snapshots * snapshots = disk->get_snapshots();

    if ( snapshots == 0 )
    {
        error = "Snapshot does not exist";
    }

    return snapshots;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualMachineDisks::revert_snapshot(int id, int snap_id)
{
    VirtualMachineDisk * disk =
        static_cast<VirtualMachineDisk *>(get_attribute(id));

    if ( disk == 0 )
    {
        return -1;
    }

    return disk->revert_snapshot(snap_id);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualMachineDisks::delete_snapshot(int disk_id, int snap_id,
        Template **ds_quota, Template **vm_quota)
{
    VirtualMachineDisk * disk =
        static_cast<VirtualMachineDisk *>(get_attribute(disk_id));

    *ds_quota = 0;
    *vm_quota = 0;

    if ( disk == 0 )
    {
        return;
    }

    disk->delete_snapshot(snap_id, ds_quota, vm_quota);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualMachineDisks::delete_non_persistent_snapshots(Template **vm_quotas,
        map<int, Template *>& ds_quotas)
{
    long long system_disk = 0;

    for ( disk_iterator disk = begin() ; disk != end() ; ++disk )
    {
        string tm_target = (*disk)->get_tm_target();

        if ( !(*disk)->has_snapshots() || tm_target == "NONE" )
        {
            continue;
        }

        if ((*disk)->is_persistent() || tm_target != "SYSTEM" )
        {
            int image_id;

            if ( (*disk)->vector_value("IMAGE_ID", image_id) != 0 )
            {
                continue;
            }

            Template * d_ds = new Template();

            d_ds->add("DATASTORE", (*disk)->vector_value("DATASTORE_ID"));
            d_ds->add("SIZE", (*disk)->get_total_snapshot_size());
            d_ds->add("IMAGES", 0);

            ds_quotas.insert(pair<int, Template *>(image_id, d_ds));
        }

        if ( tm_target == "SYSTEM" )
        {
            system_disk += (*disk)->get_total_snapshot_size();
        }

        (*disk)->clear_snapshots();

        (*disk)->remove("DISK_SNAPSHOT_ACTIVE");
        (*disk)->remove("DISK_SNAPSHOT_ID");
        (*disk)->remove("DISK_SNAPSHOT_TOTAL_SIZE");
    }

    if ( system_disk > 0 )
    {
        *vm_quotas = new Template();

        VectorAttribute * delta_disk = new VectorAttribute("DISK");

        delta_disk->replace("TYPE", "FS");
        delta_disk->replace("SIZE", system_disk);

        (*vm_quotas)->add("VMS", 0);
        (*vm_quotas)->set(delta_disk);
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualMachineDisks::set_saveas(int disk_id, int snap_id, int &iid,
        long long &size, string& err_str)
{
    iid = -1;

    VirtualMachineDisk * disk =
        static_cast<VirtualMachineDisk *>(get_attribute(disk_id));

    if (disk == 0)
    {
        err_str = "DISK does not exist.";
        return -1;
    }

    if (disk->vector_value("IMAGE_ID", iid) != 0)
    {
        iid = -1;
        err_str = "DISK does not have a valid IMAGE_ID.";
        return -1;
    }

    const Snapshots * snaps = disk->get_snapshots();

    if (snap_id != -1)
    {
        if (snaps == 0 || !snaps->exists(snap_id))
        {
            err_str = "Snapshot does not exist.";
            return -1;
        }
    }

    disk->set_saveas();
    disk->replace("HOTPLUG_SAVE_AS_SNAPSHOT_ID", snap_id);

    size = 0;
    disk->vector_value("SIZE", size);

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualMachineDisks::set_saveas(int disk_id, const string& source, int iid)
{
    VirtualMachineDisk * disk = get_saveas();

    if ( disk == 0 )
    {
        return -1;
    }

    disk->replace("HOTPLUG_SAVE_AS", iid);
    disk->replace("HOTPLUG_SAVE_AS_SOURCE", source);

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualMachineDisks::clear_saveas()
{
    VirtualMachineDisk * disk = get_saveas();

    if ( disk == 0 )
    {
        return -1;
    }

    int  image_id;

    disk->clear_saveas();

    disk->vector_value("HOTPLUG_SAVE_AS", image_id);

    disk->remove("HOTPLUG_SAVE_AS");
    disk->remove("HOTPLUG_SAVE_AS_SOURCE");
    disk->remove("HOTPLUG_SAVE_AS_SNAPSHOT_ID");

    return image_id;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualMachineDisks::get_saveas_info(int& disk_id, string& source,
        int& image_id, string& snap_id, string& tm_mad, string& ds_id)
{
    int rc;

    VirtualMachineDisk * disk = get_saveas();

    if ( disk == 0 )
    {
        return -1;
    }

    rc  = disk->vector_value("HOTPLUG_SAVE_AS_SOURCE", source);
    rc += disk->vector_value("HOTPLUG_SAVE_AS", image_id);
    rc += disk->vector_value("HOTPLUG_SAVE_AS_SNAPSHOT_ID", snap_id);
    rc += disk->vector_value("DISK_ID",  disk_id);
    rc += disk->vector_value("DATASTORE_ID", ds_id);
    rc += disk->vector_value("TM_MAD", tm_mad);

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualMachineDisks::delete_non_persistent_resizes(Template **vm_quotas,
        map<int, Template *>& ds_quotas)
{
    long long original_size, size, delta_size, system_disk = 0;

    string tm_target;
    int    rc;

    for ( disk_iterator disk = begin() ; disk != end() ; ++disk )
    {
        tm_target = (*disk)->get_tm_target();

        rc  = (*disk)->vector_value("SIZE", size);
        rc += (*disk)->vector_value("ORIGINAL_SIZE", original_size);

        if ( rc != 0 || original_size >= size || tm_target == "NONE" )
        {
            continue;
        }

        delta_size = original_size - size;

        if ((*disk)->is_persistent() || tm_target != "SYSTEM" )
        {
            int image_id;

            if ( (*disk)->vector_value("IMAGE_ID", image_id) != 0 )
            {
                continue;
            }

            Template * d_ds = new Template();

            d_ds->add("DATASTORE", (*disk)->vector_value("DATASTORE_ID"));
            d_ds->add("SIZE", delta_size);
            d_ds->add("IMAGES", 0);

            ds_quotas.insert(pair<int, Template *>(image_id, d_ds));
        }

        if ( tm_target == "SYSTEM" )
        {
            system_disk += delta_size;
        }

        (*disk)->replace("SIZE", original_size);
    }

    if ( system_disk > 0 )
    {
        *vm_quotas = new Template();

        VectorAttribute * delta_disk = new VectorAttribute("DISK");

        delta_disk->replace("TYPE", "FS");
        delta_disk->replace("SIZE", system_disk);

        (*vm_quotas)->add("VMS", 0);
        (*vm_quotas)->set(delta_disk);
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
