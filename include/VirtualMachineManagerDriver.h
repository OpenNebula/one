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

#ifndef VIRTUAL_MACHINE_MANAGER_DRIVER_H_
#define VIRTUAL_MACHINE_MANAGER_DRIVER_H_

#include <map>
#include <string>
#include <sstream>

#include "Mad.h"
#include "ActionSet.h"
#include "VirtualMachinePool.h"
#include "History.h"

using namespace std;

/**
 *  VirtualMachineManagerDriver provides a base class to implement VM Manager
 *  Drivers. This class implements the protocol and recover functions
 *  from the Mad interface. Classes derived from the VirtualMachineManagerDriver
 *  must implement the deployment function to generate specific VM
 *  deployment information for the unerlying MAD.
 */
class VirtualMachineManagerDriver : public Mad
{
public:

    VirtualMachineManagerDriver(
        int                         userid,
        const map<string,string>&   attrs,
        bool                        sudo,
        VirtualMachinePool *        pool);

    virtual ~VirtualMachineManagerDriver(){};

    /**
     *  Implements the VM Manager driver protocol.
     *    @param message the string read from the driver
     */
    void protocol(const string& message) const;

    /**
     *  TODO: What do we need here? just poll the active VMs to recover
     *  connections? Or an specific recover action from the MAD?
     */
    void recover();

    /**
     *  Generates a driver-specific deployment file:
     *    @param vm pointer to a virtual machine
     *    @param file_name to generate the deployment description
     *    @return 0 on success
     */
    virtual int deployment_description(
        const VirtualMachine *  vm,
        const string&           file_name) const = 0;

    /**
     * Updates the VM with the information gathered by the drivers
     *
     * @param id VM id
     * @param monitor_str String returned by the poll driver call
     */
    static void process_poll(int id, const string &monitor_str);

    /**
     * Updates the VM with the information gathered by the drivers
     *
     * @param vm VM to update, must be locked
     * @param monitor_str String returned by the poll driver call
     */
    static void process_poll(VirtualMachine* vm, const string &monitor_str);

    /**
     *  Check if action is supported for imported VMs
     *    @param action
     *    @return True if it is supported
     */
    bool is_imported_action_supported(History::VMAction action) const
    {
        return imported_actions.is_set(action);
    }

protected:
    /**
     *  Gets a configuration attr from driver configuration file (single
     *  version)
     *    @param name of config attribute
     *    @param value of the attribute
     */
    template<typename T>
    void get_default(const string& name, T& value) const
    {
        driver_conf.get(name, value);
    }

    /**
     *  Gets a configuration attr from driver configuration file (vector
     *  version)
     *    @param name of config vector attribute for the domain
     *    @param vname of the attribute
     *    @param value of the attribute
     */
    template<typename T>
    int get_default(const char* name, const char* vname, T& value) const
    {
        const VectorAttribute * vattr = driver_conf.get(name);

        if (vattr == 0)
        {
            return -1;
        }

        return vattr->vector_value(vname, value);
    }

private:
    friend class VirtualMachineManager;

    static const string imported_actions_default;
    static const string imported_actions_default_public;

    /**
     *  Configuration file for the driver
     */
    Template    driver_conf;

    /**
     *  List of available actions for imported VMs. Each bit is an action
     *  as defined in History.h, 1=supported and 0=not supported
     */
    ActionSet<History::VMAction> imported_actions;

    /**
     *  Pointer to the Virtual Machine Pool, to access VMs
     */
    VirtualMachinePool * vmpool;

    /**
     *  Sends a deploy request to the MAD: "DEPLOY ID XML_DRV_MSG"
     *    @param oid the virtual machine id.
     *    @param drv_msg xml data for the mad operation
     */
    void deploy (
        const int     oid,
        const string& drv_msg) const
    {
        write_drv("DEPLOY", oid, drv_msg);
    }

    /**
     *  Sends a shutdown request to the MAD: "SHUTDOWN ID XML_DRV_MSG"
     *    @param oid the virtual machine id.
     *    @param drv_msg xml data for the mad operation
     */
    void shutdown (
        const int     oid,
        const string& drv_msg) const
    {
        write_drv("SHUTDOWN", oid, drv_msg);
    }

    /**
     *  Sends a reset request to the MAD: "RESET ID XML_DRV_MSG"
     *    @param oid the virtual machine id.
     *    @param drv_msg xml data for the mad operation
     */
    void reset (
        const int     oid,
        const string& drv_msg) const
    {
        write_drv("RESET", oid, drv_msg);
    }

    /**
     *  Sends a reboot request to the MAD: "REBOOT ID XML_DRV_MSG"
     *    @param oid the virtual machine id.
     *    @param drv_msg xml data for the mad operation
     */
    void reboot (
        const int     oid,
        const string& drv_msg) const
    {
        write_drv("REBOOT", oid, drv_msg);
    }

    /**
     *  Sends a cancel request to the MAD: "CANCEL ID XML_DRV_MSG"
     *    @param oid the virtual machine id.
     *    @param drv_msg xml data for the mad operation
     */
    void cancel (
        const int     oid,
        const string& drv_msg) const
    {
        write_drv("CANCEL", oid, drv_msg);
    }

    /**
     *  Sends a cleanup request to the MAD: "CLEANUP ID XML_DRV_MSG"
     *    @param oid the virtual machine id.
     *    @param drv_msg xml data for the mad operation
     */
    void cleanup (
        const int     oid,
        const string& drv_msg) const
    {
        write_drv("CLEANUP", oid, drv_msg);
    }

    /**
     *  Sends a checkpoint request to the MAD: "CHECKPOINT ID XML_DRV_MSG"
     *    @param oid the virtual machine id.
     *    @param drv_msg xml data for the mad operation
     */
    void checkpoint (
        const int     oid,
        const string& drv_msg) const
    {
        write_drv("CHECKPOINT", oid, drv_msg);
    }

    /**
     *  Sends a save request to the MAD: "SAVE ID XML_DRV_MSG"
     *    @param oid the virtual machine id.
     *    @param drv_msg xml data for the mad operation
     */
    void save (
        const int     oid,
        const string& drv_msg) const
    {
        write_drv("SAVE", oid, drv_msg);
    }


    /**
     *  Sends a save request to the MAD: "RESTORE ID XML_DRV_MSG"
     *    @param oid the virtual machine id.
     *    @param drv_msg xml data for the mad operation
     */
    void restore (
        const int     oid,
        const string& drv_msg) const
    {
        write_drv("RESTORE", oid, drv_msg);
    }


    /**
     *  Sends a migrate request to the MAD: "MIGRATE ID XML_DRV_MSG"
     *    @param oid the virtual machine id.
     *    @param drv_msg xml data for the mad operation
     */
    void migrate (
        const int     oid,
        const string& drv_msg) const
    {
        write_drv("MIGRATE", oid, drv_msg);
    }

    /**
     *  Sends a poll request to the MAD: "POLL ID XML_DRV_MSG"
     *    @param oid the virtual machine id.
     *    @param drv_msg xml data for the mad operation
     */
    void poll (
        const int     oid,
        const string& drv_msg) const
    {
        write_drv("POLL", oid, drv_msg);
    }

    /**
     *  Sends an attach request to the MAD: "ATTACHDISK ID XML_DRV_MSG"
     *    @param oid the virtual machine id.
     *    @param drv_msg xml data for the mad operation
     */
    void attach (
        const int     oid,
        const string& drv_msg) const
    {
        write_drv("ATTACHDISK", oid, drv_msg);
    }

    /**
     *  Sends a detach request to the MAD: "DETACHDISK ID XML_DRV_MSG"
     *    @param oid the virtual machine id.
     *    @param drv_msg xml data for the mad operation
     */
    void detach (
        const int     oid,
        const string& drv_msg) const
    {
        write_drv("DETACHDISK", oid, drv_msg);
    }

    /**
     *  Sends an attach NIC request to the MAD: "ATTACHNIC ID XML_DRV_MSG"
     *    @param oid the virtual machine id.
     *    @param drv_msg xml data for the mad operation
     */
    void attach_nic (
        const int     oid,
        const string& drv_msg) const
    {
        write_drv("ATTACHNIC", oid, drv_msg);
    }

    /**
     *  Sends a detach request to the MAD: "DETACHNIC ID XML_DRV_MSG"
     *    @param oid the virtual machine id.
     *    @param drv_msg xml data for the mad operation
     */
    void detach_nic (
        const int     oid,
        const string& drv_msg) const
    {
        write_drv("DETACHNIC", oid, drv_msg);
    }

    /**
     *  Sends a snapshot create request to the MAD:
     *  "SNAPSHOTCREATE ID XML_DRV_MSG"
     *    @param oid the virtual machine id.
     *    @param drv_msg xml data for the mad operation
     */
    void snapshot_create (
        const int     oid,
        const string& drv_msg) const
    {
        write_drv("SNAPSHOTCREATE", oid, drv_msg);
    }

    /**
     *  Sends a snapshot revert request to the MAD:
     *  "SNAPSHOTREVERT ID XML_DRV_MSG"
     *    @param oid the virtual machine id.
     *    @param drv_msg xml data for the mad operation
     */
    void snapshot_revert (
        const int     oid,
        const string& drv_msg) const
    {
        write_drv("SNAPSHOTREVERT", oid, drv_msg);
    }

    /**
     *  Sends a snapshot delete request to the MAD:
     *  "SNAPSHOTDELETE ID XML_DRV_MSG"
     *    @param oid the virtual machine id.
     *    @param drv_msg xml data for the mad operation
     */
    void snapshot_delete (
        const int     oid,
        const string& drv_msg) const
    {
        write_drv("SNAPSHOTDELETE", oid, drv_msg);
    }

    /**
     *  Sends a disk snapshot create request to the MAD:
     *  "DISKSNAPSHOTCREATE ID XML_DRV_MSG"
     *    @param oid the virtual machine id.
     *    @param drv_msg xml data for the mad operation
     */
    void disk_snapshot_create (
        const int     oid,
        const string& drv_msg) const
    {
        write_drv("DISKSNAPSHOTCREATE", oid, drv_msg);
    }

    /**
     *  Sends a request to update the VM security groups:
     *  "UPDATESG ID XML_DRV_MSG"
     *    @param oid the virtual machine id.
     *    @param drv_msg xml data for the mad operation
     */
    void updatesg (
        const int     oid,
        const string& drv_msg) const
    {
        write_drv("UPDATESG", oid, drv_msg);
    }

    /**
     *
     */
    void write_drv(const char * aname, const int oid, const string& msg) const
    {
        ostringstream os;

        os << aname << " " << oid << " " << msg << endl;

        write(os);
    }
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

#endif /*VIRTUAL_MACHINE_MANAGER_DRIVER_H_*/
