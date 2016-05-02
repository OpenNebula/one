/* -------------------------------------------------------------------------- */
/* Copyright 2002-2015, OpenNebula Project, OpenNebula Systems                */
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

#include "ImageManagerDriver.h"
#include "ImagePool.h"

#include "NebulaLog.h"
#include "Quotas.h"

#include "Nebula.h"
#include <sstream>

/* ************************************************************************** */
/* Driver ASCII Protocol Implementation                                       */
/* ************************************************************************** */

void ImageManagerDriver::cp(int           oid,
                            const string& drv_msg) const
{
    ostringstream os;

    os << "CP " << oid << " " << drv_msg << endl;

    write(os);
}

/* -------------------------------------------------------------------------- */

void ImageManagerDriver::clone(int           oid,
                               const string& drv_msg) const
{
    ostringstream os;

    os << "CLONE " << oid << " " << drv_msg << endl;

    write(os);
}

/* -------------------------------------------------------------------------- */
void ImageManagerDriver::stat(int           oid,
                              const string& drv_msg) const
{
    ostringstream os;

    os << "STAT " << oid << " " << drv_msg << endl;

    write(os);
}

/* -------------------------------------------------------------------------- */

void ImageManagerDriver::mkfs(int           oid,
                              const string& drv_msg) const
{
    ostringstream os;

    os << "MKFS " << oid << " " << drv_msg << endl;

    write(os);
}

/* -------------------------------------------------------------------------- */

void ImageManagerDriver::rm(int oid, const string& drv_msg) const
{
    ostringstream os;

    os << "RM " << oid << " " << drv_msg << endl;

    write(os);
}

/* -------------------------------------------------------------------------- */

void ImageManagerDriver::monitor(int oid, const string& drv_msg) const
{
    ostringstream os;

    os << "MONITOR " << oid << " " << drv_msg << endl;

    write(os);
}

/* -------------------------------------------------------------------------- */

void ImageManagerDriver::snapshot_delete(int oid, const string& drv_msg) const
{
    ostringstream os;

    os << "SNAP_DELETE " << oid << " " << drv_msg << endl;

    write(os);
}

/* -------------------------------------------------------------------------- */

void ImageManagerDriver::snapshot_revert(int oid, const string& drv_msg) const
{
    ostringstream os;

    os << "SNAP_REVERT " << oid << " " << drv_msg << endl;

    write(os);
}

/* -------------------------------------------------------------------------- */

void ImageManagerDriver::snapshot_flatten(int oid, const string& drv_msg) const
{
    ostringstream os;

    os << "SNAP_FLATTEN " << oid << " " << drv_msg << endl;

    write(os);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

/* ************************************************************************** */
/* MAD Interface                                                              */
/* ************************************************************************** */

static void stat_action(istringstream& is, int id, const string& result)
{
    string size_mb;
    string info;

    Nebula& nd        = Nebula::instance();
    ImageManager * im = nd.get_imagem();

    if ( result == "SUCCESS" )
    {
        if ( is.good() )
        {
            is >> size_mb >> ws;
        }

        if ( is.fail() )
        {
            im->notify_request(id, false, "Cannot get size from STAT");
        }

        im->notify_request(id, true, size_mb);
    }
    else
    {
        getline(is,info);

        im->notify_request(id, false, info);
    }
}

/* -------------------------------------------------------------------------- */

static int cp_action(istringstream& is,
                     ImagePool*     ipool,
                     int            id,
                     const string&  result)
{
    string  source;
    string  info;
    int     ds_id = -1;

    Image * image;

    ostringstream oss;

    image = ipool->get(id,true);

    if ( image == 0 )
    {
        if (result == "SUCCESS")
        {
            ostringstream oss;

            if ( is.good())
            {
                is >> source >> ws;
            }

            if (!source.empty())
            {
                oss << "CP operation succeeded but image no longer exists."
                    << " Source image: " << source << ", may be left in datastore";

                NebulaLog::log("ImM", Log::ERROR, oss);
            }
        }

        return ds_id;
    }

    ds_id = image->get_ds_id();

    if ( result == "FAILURE" )
    {
       goto error;
    }

    if ( is.good() )
    {
        is >> source >> ws;
    }

    if ( is.fail() )
    {
        goto error;
    }

    image->set_source(source);

    image->set_state_unlock();

    ipool->update(image);

    image->unlock();

    oss << "Image (" << id << ") copied and ready to use.";
    NebulaLog::log("ImM", Log::INFO, oss);

    return ds_id;

error:
    oss << "Error copying image in the datastore";

    getline(is, info);

    if (!info.empty() && (info[0] != '-'))
    {
        oss << ": " << info;
    }

    NebulaLog::log("ImM", Log::ERROR, oss);

    image->set_template_error_message(oss.str());
    image->set_state(Image::ERROR);

    ipool->update(image);

    image->unlock();

    return ds_id;
}

/* -------------------------------------------------------------------------- */

static int clone_action(istringstream& is,
                        ImagePool*     ipool,
                        int            id,
                        const string&  result)
{
    int     cloning_id;
    int     ds_id = -1;
    string  source;
    string  info;

    Image * image;

    ostringstream oss;

    Nebula& nd        = Nebula::instance();
    ImageManager * im = nd.get_imagem();

    image = ipool->get(id, true);

    if ( image == 0 )
    {
        if (result == "SUCCESS")
        {
            ostringstream oss;

            if ( is.good())
            {
                is >> source >> ws;
            }

            if (!source.empty())
            {
                oss << "CLONE operation succeeded but image no longer exists."
                    << " Source image: " << source << ", may be left in datastore";

                NebulaLog::log("ImM", Log::ERROR, oss);
            }
        }

        return ds_id;
    }

    ds_id      = image->get_ds_id();
    cloning_id = image->get_cloning_id();

    if ( result == "FAILURE" )
    {
       goto error;
    }

    if ( is.good() )
    {
        is >> source >> ws;
    }

    if ( is.fail() )
    {
        goto error;
    }

    image->set_source(source);

    image->set_state_unlock();

    image->clear_cloning_id();

    ipool->update(image);

    image->unlock();

    NebulaLog::log("ImM", Log::INFO, "Image cloned and ready to use.");

    im->release_cloning_image(cloning_id, id);

    return ds_id;

error:
    oss << "Error cloning from Image " << cloning_id;

    getline(is, info);

    if (!info.empty() && (info[0] != '-'))
    {
        oss << ": " << info;
    }

    NebulaLog::log("ImM", Log::ERROR, oss);

    image->set_template_error_message(oss.str());
    image->set_state(Image::ERROR);

    image->clear_cloning_id();

    ipool->update(image);

    image->unlock();

    im->release_cloning_image(cloning_id, id);

    return ds_id;
}

/* -------------------------------------------------------------------------- */

static int mkfs_action(istringstream& is,
                       ImagePool*     ipool,
                       int            id,
                       const string&  result)
{
    string  source;
    Image * image;
    bool    is_saving = false;

    string info;

    int vm_id   = -1;
    int ds_id   = -1;
    int disk_id = -1;

    VirtualMachine * vm;
    ostringstream    oss;

    Nebula& nd                  = Nebula::instance();
    VirtualMachinePool * vmpool = nd.get_vmpool();
    TransferManager *  tm       = nd.get_tm();

    image = ipool->get(id, true);

    if ( image == 0 )
    {
        if (result == "SUCCESS")
        {
            ostringstream oss;

            if ( is.good())
            {
                is >> source >> ws;
            }

            if (!source.empty())
            {
                oss << "MkFS operation succeeded but image no longer exists."
                    << " Source image: " << source << ", may be left in datastore";

                NebulaLog::log("ImM", Log::ERROR, oss);
            }
        }

        return ds_id;
    }
    else if ( image->get_state() == Image::DELETE )
    {
        NebulaLog::log("ImM", Log::INFO, "Ignoring mkfs callback, image is "
                "being deleted");

        image->unlock();
        return ds_id;
    }

    is_saving = image->is_saving();
    ds_id     = image->get_ds_id();

    if ( is_saving )
    {
        image->get_template_attribute("SAVED_DISK_ID", disk_id);
        image->get_template_attribute("SAVED_VM_ID", vm_id);
    }

    if ( result == "FAILURE" )
    {
        goto error_img;
    }

    if ( !is.fail() )
    {
        is >> source >> ws;
    }
    else
    {
        goto error_img;
    }

    image->set_source(source);

    if (!is_saving)
    {
        image->set_state_unlock();
    }

    ipool->update(image);

    image->unlock();

    if ( !is_saving )
    {
        NebulaLog::log("ImM", Log::INFO, "Image created and ready to use");
        return ds_id;
    }

    vm = vmpool->get(vm_id, true);

    if ( vm == 0 )
    {
        goto error_save_get;
    }

    if ( vm->set_saveas_disk(disk_id, source, id) == -1 )
    {
        goto error_save_state;
    }

    tm->trigger(TransferManager::SAVEAS_HOT, vm_id);

    vmpool->update(vm);

    vm->unlock();

    return ds_id;

error_img:
    oss << "Error creating datablock";
    goto error;

error_save_get:
    oss << "Image created to save as a disk but VM does not exist.";
    goto error_save;

error_save_state:
    vm->unlock();
    oss << "Image created to save as disk but VM is no longer running";

error_save:
    image = ipool->get(id, true);

    if ( image == 0 )
    {
        NebulaLog::log("ImM", Log::ERROR, oss);
        return ds_id;
    }

error:
    getline(is,info);

    if (!info.empty() && (info[0] != '-'))
    {
        oss << ": " << info;
    }

    NebulaLog::log("ImM", Log::ERROR, oss);

    image->set_template_error_message(oss.str());
    image->set_state(Image::ERROR);

    ipool->update(image);

    image->unlock();

    if (is_saving && vm_id != -1)
    {
        if ((vm = vmpool->get(vm_id, true)) != 0)
        {
            vm->clear_saveas_state();

            vm->clear_saveas_disk();

            vmpool->update(vm);

            vm->unlock();
        }
    }

    return ds_id;
}

/* -------------------------------------------------------------------------- */

static int rm_action(istringstream& is,
                     ImagePool*     ipool,
                     int            id,
                     const string&  result)
{
    int rc;
    int ds_id = -1;

    string  tmp_error;
    string  source;
    string  info;
    Image * image;

    ostringstream oss;

    image = ipool->get(id, true);

    if ( image == 0 )
    {
        return ds_id;
    }

    ds_id  = image->get_ds_id();
    source = image->get_source();

    rc = ipool->drop(image, tmp_error);

    image->unlock();

    if ( result == "FAILURE" )
    {
       goto error;
    }
    else if ( rc < 0 )
    {
        goto error_drop;
    }

    NebulaLog::log("ImM", Log::INFO, "Image successfully removed.");

    return ds_id;

error_drop:
    oss << "Error removing image from DB: " << tmp_error
        << ". Remove image source " << source << " to completely delete image.";

    NebulaLog::log("ImM", Log::ERROR, oss);
    return ds_id;

error:
    oss << "Error removing image from datastore. Manually remove image source "
        << source << " to completely delete the image";

    getline(is,info);

    if (!info.empty() && (info[0] != '-'))
    {
        oss << ": " << info;
    }

    NebulaLog::log("ImM", Log::ERROR, oss);

    return ds_id;
}

/* -------------------------------------------------------------------------- */

static void monitor_action(istringstream& is,
                           DatastorePool* dspool,
                           int            id,
                           const string&  result)
{
    string  dsinfo64;
    string *dsinfo = 0;

    ostringstream oss;

    getline (is, dsinfo64);

    if (is.fail())
    {
        oss << "Error monitoring datastore " << id << ". Bad monitor data: "
            << dsinfo64;

        NebulaLog::log("ImM", Log::ERROR, oss);
        return;
    }

    dsinfo = one_util::base64_decode(dsinfo64);

    if (dsinfo == 0)
    {
        oss << "Error monitoring datastore " << id << ". Bad monitor data: "
            << dsinfo64;

        NebulaLog::log("ImM", Log::ERROR, oss);
        return;
    }

    if (result != "SUCCESS")
    {
        oss << "Error monitoring datastore " << id << ": " << *dsinfo;
        NebulaLog::log("ImM", Log::ERROR, oss);

        delete dsinfo;
        return;
    }

    Template monitor_data;

    char*  error_msg;
    int    rc = monitor_data.parse(*dsinfo, &error_msg);

    if ( rc != 0 )
    {
        oss << "Error parsing datastore information: " << error_msg
            << ". Monitoring information: " << endl << *dsinfo;

        NebulaLog::log("ImM", Log::ERROR, oss);

        delete dsinfo;
        free(error_msg);

        return;
    }

    delete dsinfo;

    float  total, free, used;
    string ds_name;

    monitor_data.get("TOTAL_MB", total);
    monitor_data.get("FREE_MB", free);
    monitor_data.get("USED_MB", used);

    Datastore * ds = dspool->get(id, true);

    if (ds == 0 )
    {
        return;
    }

    ds_name = ds->get_name();

    ds->update_monitor(total, free, used);

    dspool->update(ds);

    ds->unlock();

    vector<VectorAttribute *> vm_disk_info;
    vector<VectorAttribute *>::iterator it;

    monitor_data.get("VM", vm_disk_info);

    for ( it = vm_disk_info.begin(); it != vm_disk_info.end(); ++it )
    {
        int    vm_id;
        string poll_info;

        if ( (*it)->vector_value("ID", vm_id) == -1 ||
                (*it)->vector_value("POLL", poll_info) == -1 )
        {
            continue;
        }

        VirtualMachineManagerDriver::process_poll(vm_id, poll_info);
    }

    oss << "Datastore " << ds_name << " (" << id << ") successfully monitored.";

    NebulaLog::log("ImM", Log::DEBUG, oss);

    return;
}

/* -------------------------------------------------------------------------- */

static void snap_delete_action(istringstream& is,
         ImagePool*     ipool,
         int            id,
         const string&  result)
{
    ostringstream oss;
    string info;

    long long   snap_size;
    int         ds_id, uid, gid;

    Image * image = ipool->get(id, true);

    if ( image == 0 )
    {
        return;
    }

    image->set_state_unlock();

    int snap_id = image->get_target_snapshot();

    if (snap_id == -1)
    {
        NebulaLog::log("ImM", Log::ERROR, "No target snapshot in callback");

        ipool->update(image);

        image->unlock();
        return;
    }

    if ( result == "SUCCESS")
    {
        ds_id     = image->get_ds_id();
        uid       = image->get_uid();
        gid       = image->get_gid();
        snap_size = (image->get_snapshots()).get_snapshot_size(snap_id);

        image->delete_snapshot(snap_id);
    }
    else
    {
        oss << "Error removing snapshot " << snap_id << " from image " << id;

        getline(is, info);

        if (!info.empty() && (info[0] != '-'))
        {
            oss << ": " << info;
        }

        image->set_template_error_message(oss.str());

        NebulaLog::log("ImM", Log::ERROR, oss);
    }

    image->clear_target_snapshot();

    ipool->update(image);

    image->unlock();

    if (result == "SUCCESS")
    {
        Template quotas;

        quotas.add("DATASTORE", ds_id);
        quotas.add("SIZE", snap_size);
        quotas.add("IMAGES",0 );

        Quotas::ds_del(uid, gid, &quotas);
    }
}

/* -------------------------------------------------------------------------- */

static void snap_revert_action(istringstream& is,
         ImagePool*     ipool,
         int            id,
         const string&  result)
{
    ostringstream oss;
    string info;

    Image * image = ipool->get(id, true);

    if ( image == 0 )
    {
        return;
    }

    int snap_id = image->get_target_snapshot();

    image->set_state_unlock();

    if (snap_id == -1)
    {
        NebulaLog::log("ImM", Log::ERROR, "No target snapshot in callback");

        ipool->update(image);

        image->unlock();
        return;
    }

    if ( result == "SUCCESS")
    {
        image->revert_snapshot(snap_id);
    }
    else
    {
        oss << "Error reverting image " << id << " to snapshot " << snap_id;

        getline(is, info);

        if (!info.empty() && (info[0] != '-'))
        {
            oss << ": " << info;
        }

        image->set_template_error_message(oss.str());

        NebulaLog::log("ImM", Log::ERROR, oss);
    }

    image->clear_target_snapshot();

    ipool->update(image);

    image->unlock();
}

/* -------------------------------------------------------------------------- */

static void snap_flatten_action(istringstream& is,
         ImagePool*     ipool,
         int            id,
         const string&  result)
{
    ostringstream oss;
    string info;

    long long   snap_size;
    int         ds_id, uid, gid;

    Image * image = ipool->get(id, true);

    if ( image == 0 )
    {
        return;
    }

    if ( result == "SUCCESS")
    {
        ds_id     = image->get_ds_id();
        uid       = image->get_uid();
        gid       = image->get_gid();
        snap_size = (image->get_snapshots()).get_total_size();

        image->clear_snapshots();
    }
    else
    {
        oss << "Error flattening image snapshot";

        getline(is, info);

        if (!info.empty() && (info[0] != '-'))
        {
            oss << ": " << info;
        }

        image->set_template_error_message(oss.str());

        NebulaLog::log("ImM", Log::ERROR, oss);
    }

    image->set_state_unlock();

    image->clear_target_snapshot();

    ipool->update(image);

    image->unlock();

    if (result == "SUCCESS")
    {
        Template quotas;

        quotas.add("DATASTORE", ds_id);
        quotas.add("SIZE", snap_size);
        quotas.add("IMAGES",0 );

        Quotas::ds_del(uid, gid, &quotas);
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void ImageManagerDriver::protocol(const string& message) const
{
    istringstream is(message);
    ostringstream oss;

    string action;
    string result;
    string source;
    string info;

    int id;
    int ds_id = -1;

    oss << "Message received: " << message;
    NebulaLog::log("ImG", Log::DDEBUG, oss);

    // --------------------- Parse the driver message --------------------------

    if ( is.good() )
        is >> action >> ws;
    else
        return;

    if ( is.good() )
        is >> result >> ws;
    else
        return;

    if ( is.good() )
    {
        is >> id >> ws;

        if ( is.fail() )
        {
            if ( action == "LOG" )
            {
                is.clear();
                getline(is,info);

                NebulaLog::log("ImG",log_type(result[0]), info.c_str());
            }

            return;
        }
    }
    else
        return;

    if (action == "STAT")
    {
        stat_action(is, id, result);
    }
    else if (action == "CP")
    {
        ds_id = cp_action(is, ipool, id, result);
    }
    else if (action == "CLONE")
    {
        ds_id = clone_action(is, ipool, id, result);
    }
    else if (action == "MKFS")
    {
        ds_id = mkfs_action(is, ipool, id, result);
    }
    else if (action == "RM")
    {
        ds_id = rm_action(is, ipool, id, result);
    }
    else if (action == "MONITOR")
    {
        monitor_action(is, dspool, id, result);
    }
    else if (action == "SNAP_DELETE")
    {
        snap_delete_action(is, ipool, id, result);
    }
    else if (action == "SNAP_REVERT")
    {
        snap_revert_action(is, ipool, id, result);
    }
    else if (action == "SNAP_FLATTEN")
    {
        snap_flatten_action(is, ipool, id, result);
    }
    else if (action == "LOG")
    {
        getline(is,info);
        NebulaLog::log("ImM", log_type(result[0]), info.c_str());
    }

    if (ds_id != -1)
    {
        Nebula& nd        = Nebula::instance();
        ImageManager * im = nd.get_imagem();

        im->monitor_datastore(ds_id);
    }

    return;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void ImageManagerDriver::recover()
{
    NebulaLog::log("ImG",Log::INFO,"Recovering Image Repository drivers");
}

