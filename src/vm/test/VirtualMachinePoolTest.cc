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

#include <string>
#include <iostream>
#include <stdlib.h>

#include "VirtualMachinePool.h"
#include "PoolTest.h"

using namespace std;

const int uids[] = {123, 261, 123};

const string names[] = {"VM one", "Second VM", "VM one"};

const string templates[] =
{
    "NAME   = \"VM one\"\n"
    "MEMORY = 128\n"
    "CPU    = 1",

    "NAME   = \"Second VM\"\n"
    "MEMORY = 256\n"
    "CPU    = 2",

    "NAME   = \"VM one\"\n"
    "MEMORY = 1024\n"
    "CPU    = 1"
};


const string xmls[] =
{
    "<VM><ID>0</ID><UID>123</UID><NAME>VM one</NAME><LAST_POLL>0</LAST_POLL><ST"
    "ATE>1</STATE><LCM_STATE>0</LCM_STATE><STIME>0000000000</STIME><ETIME>0</ET"
    "IME><DEPLOY_ID></DEPLOY_ID><MEMORY>0</MEMORY><CPU>0</CPU><NET_TX>0</NET_TX"
    "><NET_RX>0</NET_RX><LAST_SEQ>-1</LAST_SEQ><TEMPLATE><CPU><![CDATA[1]]></CPU><MEMORY><![CDATA[128]"
    "]></MEMORY><NAME><![CDATA[VM one]]></NAME><VMID><![CDATA[0]]></VMID>"
    "</TEMPLATE></VM>",

    "<VM><ID>1</ID><UID>261</UID><NAME>Second VM</NAME><LAST_POLL>0</LAST_POLL>"
    "<STATE>1</STATE><LCM_STATE>0</LCM_STATE><STIME>0000000000</STIME><ETIME>0<"
    "/ETIME><DEPLOY_ID></DEPLOY_ID><MEMORY>0</MEMORY><CPU>0</CPU><NET_TX>0</NET"
    "_TX><NET_RX>0</NET_RX><LAST_SEQ>-1</LAST_SEQ><TEMPLATE><CPU><![CDATA[2]]></CPU><MEMORY>"
    "<![CDATA[256]]></MEMORY><NAME><![CDATA[Second VM]]></NAME><VMID>"
    "<![CDATA[1]]></VMID></TEMPLATE></VM>",

    "<VM><ID>0</ID><UID>123</UID><NAME>VM one</NAME><LAST_POLL>0</LAST_POLL><ST"
    "ATE>1</STATE><LCM_STATE>0</LCM_STATE><STIME>0000000000</STIME><ETIME>0</ET"
    "IME><DEPLOY_ID></DEPLOY_ID><MEMORY>0</MEMORY><CPU>0</CPU><NET_TX>0</NET_TX"
    "><NET_RX>0</NET_RX><LAST_SEQ>-1</LAST_SEQ><TEMPLATE><CPU>1</CPU><MEMORY>1024</MEMORY><NAME>VM one"
    "</NAME><VMID>0</VMID></TEMPLATE></VM>"
};


// This xml dump result has the STIMEs modified to 0000000000
const string xml_dump =
    "<VM_POOL><VM><ID>0</ID><UID>1</UID><USERNAME>A user</USERNAME><NAME>VM one</NAME><LAST_POLL>0</LAST_POLL><STATE>1</STATE><LCM_STATE>0</LCM_STATE><STIME>0000000000</STIME><ETIME>0</ETIME><DEPLOY_ID></DEPLOY_ID><MEMORY>0</MEMORY><CPU>0</CPU><NET_TX>0</NET_TX><NET_RX>0</NET_RX><LAST_SEQ>-1</LAST_SEQ></VM><VM><ID>1</ID><UID>2</UID><USERNAME>B user</USERNAME><NAME>Second VM</NAME><LAST_POLL>0</LAST_POLL><STATE>2</STATE><LCM_STATE>0</LCM_STATE><STIME>0000000000</STIME><ETIME>0</ETIME><DEPLOY_ID></DEPLOY_ID><MEMORY>0</MEMORY><CPU>0</CPU><NET_TX>0</NET_TX><NET_RX>0</NET_RX><LAST_SEQ>-1</LAST_SEQ></VM></VM_POOL>";

const string xml_dump_where =
    "<VM_POOL><VM><ID>0</ID><UID>1</UID><USERNAME>A user</USERNAME><NAME>VM one</NAME><LAST_POLL>0</LAST_POLL><STATE>1</STATE><LCM_STATE>0</LCM_STATE><STIME>0000000000</STIME><ETIME>0</ETIME><DEPLOY_ID></DEPLOY_ID><MEMORY>0</MEMORY><CPU>0</CPU><NET_TX>0</NET_TX><NET_RX>0</NET_RX><LAST_SEQ>-1</LAST_SEQ></VM></VM_POOL>";

const string xml_history_dump =
    "<VM_POOL><VM><ID>0</ID><UID>0</UID><USERNAME>one_user_test</USERNAME><NAME>VM one</NAME><LAST_POLL>0</LAST_POLL><STATE>1</STATE><LCM_STATE>0</LCM_STATE><STIME>0000000000</STIME><ETIME>0</ETIME><DEPLOY_ID></DEPLOY_ID><MEMORY>0</MEMORY><CPU>0</CPU><NET_TX>0</NET_TX><NET_RX>0</NET_RX><LAST_SEQ>-1</LAST_SEQ></VM><VM><ID>1</ID><UID>0</UID><USERNAME>one_user_test</USERNAME><NAME>Second VM</NAME><LAST_POLL>0</LAST_POLL><STATE>2</STATE><LCM_STATE>0</LCM_STATE><STIME>0000000000</STIME><ETIME>0</ETIME><DEPLOY_ID></DEPLOY_ID><MEMORY>0</MEMORY><CPU>0</CPU><NET_TX>0</NET_TX><NET_RX>0</NET_RX><LAST_SEQ>0</LAST_SEQ><HISTORY><SEQ>0</SEQ><HOSTNAME>A_hostname</HOSTNAME><HID>0</HID><STIME>0</STIME><ETIME>0</ETIME><PSTIME>0</PSTIME><PETIME>0</PETIME><RSTIME>0</RSTIME><RETIME>0</RETIME><ESTIME>0</ESTIME><EETIME>0</EETIME><REASON>0</REASON></HISTORY></VM><VM><ID>2</ID><UID>0</UID><USERNAME>one_user_test</USERNAME><NAME>VM one</NAME><LAST_POLL>0</LAST_POLL><STATE>2</STATE><LCM_STATE>0</LCM_STATE><STIME>0000000000</STIME><ETIME>0</ETIME><DEPLOY_ID></DEPLOY_ID><MEMORY>0</MEMORY><CPU>0</CPU><NET_TX>0</NET_TX><NET_RX>0</NET_RX><LAST_SEQ>1</LAST_SEQ><HISTORY><SEQ>1</SEQ><HOSTNAME>C_hostname</HOSTNAME><HID>2</HID><STIME>0</STIME><ETIME>0</ETIME><PSTIME>0</PSTIME><PETIME>0</PETIME><RSTIME>0</RSTIME><RETIME>0</RETIME><ESTIME>0</ESTIME><EETIME>0</EETIME><REASON>0</REASON></HISTORY></VM></VM_POOL>";

const string replacement = "0000000000";


/* ************************************************************************* */
/* ************************************************************************* */

class VirtualMachinePoolTest : public PoolTest
{
    CPPUNIT_TEST_SUITE (VirtualMachinePoolTest);

    // Not all PoolTest tests can be used. Drop method isn't defined for
    // the VirtualMachinePool.
    CPPUNIT_TEST (oid_assignment);
    CPPUNIT_TEST (get_from_cache);
    CPPUNIT_TEST (get_from_db);
    CPPUNIT_TEST (wrong_get);

    CPPUNIT_TEST (update);
    CPPUNIT_TEST (dump);
    CPPUNIT_TEST (dump_where);
    CPPUNIT_TEST (dump_history);
    CPPUNIT_TEST (history);

    CPPUNIT_TEST_SUITE_END ();

protected:

    void bootstrap(SqlDB* db)
    {
        VirtualMachinePool::bootstrap(db);
    };

    PoolSQL* create_pool(SqlDB* db)
    {
        // The VM pool needs a vector containing the vm hooks
        vector<const Attribute *> vm_hooks;
        return new VirtualMachinePool(db, vm_hooks);
    };

    int allocate(int index)
    {
        int oid;
        return ((VirtualMachinePool*)pool)->allocate(uids[index],
                                                     templates[index],
                                                     &oid, false);
    };

    void check(int index, PoolObjectSQL* obj)
    {
        CPPUNIT_ASSERT( obj != 0 );

        string xml_str = "";

        // Get the xml and replace the STIME to 0, so we can compare it
        ((VirtualMachine*)obj)->to_xml(xml_str);
        xml_str.replace( xml_str.find("<STIME>")+7, 10, replacement);
//cout << endl << xml_str << endl;
        CPPUNIT_ASSERT( ((VirtualMachine*)obj)->get_name() == names[index] );
        CPPUNIT_ASSERT( xml_str == xmls[index]);
    };

    void set_up_user_pool()
    {

        // The UserPool constructor checks if the DB contains at least
        // one user, and adds one automatically from the ONE_AUTH file.
        // So the ONE_AUTH environment is forced to point to a test one_auth
        // file.
        ostringstream oss;

        oss << getenv("PWD") << "/one_auth";
        setenv("ONE_AUTH", oss.str().c_str(), 1);

        UserPool::bootstrap(db);
        UserPool * user_pool = new UserPool(db);
        int uid_1, uid_2;
        
        string username_1 = "A user";
        string username_2 = "B user";

        string pass_1     = "A pass";
        string pass_2     = "B pass";

        user_pool->allocate(&uid_1, username_1, pass_1, true);
        user_pool->allocate(&uid_2, username_2, pass_2, true);
        
        delete user_pool;
    };
    
public:
    VirtualMachinePoolTest(){};

    ~VirtualMachinePoolTest(){};


    /* ********************************************************************* */
    /* ********************************************************************* */

    void update()
    {
        VirtualMachinePool * vmp = static_cast<VirtualMachinePool*>(pool);
        VirtualMachine *     vm;
        int oid;

        string hostname     = "hostname";
        string vm_dir       = "vm_dir";
        string vmm_mad      = "vm_mad";
        string tm_mad       = "tm_mad";

        // Allocate two VMs
        oid = allocate(0);
        CPPUNIT_ASSERT( oid != -1 );

        // Get the first one, and change one of the templates attributes
        vm = vmp->get(oid, true);

        CPPUNIT_ASSERT( vm != 0 );

        string attribute = "MEMORY";
        string value     = "1024";

        vm->set_state(VirtualMachine::ACTIVE);

        // VirtualMachine object should be cached. Let's update the DB
        vmp->update_template_attribute(vm, attribute, value);

        vmp->update(vm);

        //In memory (cache) check
        string new_mem;

        vm->get_template_attribute("MEMORY",new_mem);

        CPPUNIT_ASSERT( new_mem == "1024" );
        CPPUNIT_ASSERT( vm->get_state() == VirtualMachine::ACTIVE );

        vm->unlock();

        //Now force access to DB

        pool->clean();
        vm = vmp->get(oid,false);

        new_mem.clear();

        vm->get_template_attribute("MEMORY",new_mem);

        CPPUNIT_ASSERT( new_mem == "1024" );
        CPPUNIT_ASSERT( vm->get_state() == VirtualMachine::ACTIVE );
    };

    void dump()
    {
        VirtualMachinePool * vmp = static_cast<VirtualMachinePool*>(pool);

        set_up_user_pool();

        ostringstream oss;
        int oid, rc;

        vmp->allocate(1, templates[0], &oid, false);
        vmp->allocate(2, templates[1], &oid, true);

        rc = vmp->dump(oss, "");
        CPPUNIT_ASSERT(rc == 0);

        string result = oss.str();
        result.replace(152, 10, replacement);
        result.replace(449, 10, replacement);

        CPPUNIT_ASSERT( result == xml_dump );
    }

    void dump_where()
    {
        VirtualMachinePool * vmp = static_cast<VirtualMachinePool*>(pool);

        set_up_user_pool();

        int oid, rc;
        ostringstream oss;
        ostringstream where;

        vmp->allocate(1, templates[0], &oid, false);
        vmp->allocate(2, templates[1], &oid, true);

        where << "uid < 2";
        rc = vmp->dump(oss, where.str());
        CPPUNIT_ASSERT(rc == 0);

        string result = oss.str();
        result.replace(152, 10, replacement);
        CPPUNIT_ASSERT( result == xml_dump_where );
    }

    void dump_history()
    {
        VirtualMachinePool * vmp = static_cast<VirtualMachinePool*>(pool);
        VirtualMachine*      vm;

        string hostnames[] = {"A_hostname", "B_hostname", "C_hostname"};
        string vm_dirs[]   = {"A_vm_dir", "B_vm_dir", "C_vm_dir"};
        string vmm_mads[]  = {"A_vmm_mad", "B_vmm_mad", "C_vmm_mad"};
        string tm_mads[]   = {"A_tm_mad", "B_tm_mad", "C_tm_mad"};

        int oid, rc;
        ostringstream oss;
        ostringstream where;


        set_up_user_pool();

        // Allocate a VM
        rc = vmp->allocate(0, templates[0], &oid, false);
        CPPUNIT_ASSERT( rc == oid );
        CPPUNIT_ASSERT( oid >= 0 );
        //----------------------------------------------------------------------

        // Allocate a VM with one history item
        rc = vmp->allocate(0, templates[1], &oid, true);
        CPPUNIT_ASSERT( rc == oid );
        CPPUNIT_ASSERT( oid >= 0 );

        vm = vmp->get(oid, false);
        CPPUNIT_ASSERT( vm != 0 );

        // Add a history item
        vm->add_history(0, hostnames[0], vm_dirs[0], vmm_mads[0], tm_mads[0]);

        rc = vmp->update(vm);
        CPPUNIT_ASSERT( rc == 0 );

        rc = vmp->update_history(vm);
        CPPUNIT_ASSERT( rc == 0 );
        //----------------------------------------------------------------------

        // Allocate a VM with two history items
        rc = vmp->allocate(0, templates[2], &oid, true);
        CPPUNIT_ASSERT( rc == oid );
        CPPUNIT_ASSERT( oid >= 0 );

        vm = vmp->get(oid, false);
        CPPUNIT_ASSERT( vm != 0 );

        // Add a history item
        vm->add_history(1, hostnames[1], vm_dirs[1], vmm_mads[1], tm_mads[1]);

        rc = vmp->update(vm);
        CPPUNIT_ASSERT( rc == 0 );

        rc = vmp->update_history(vm);
        CPPUNIT_ASSERT( rc == 0 );

        // Add another history item
        vm->add_history(2, hostnames[2], vm_dirs[2], vmm_mads[2], tm_mads[2]);

        rc = vmp->update(vm);
        CPPUNIT_ASSERT( rc == 0 );

        rc = vmp->update_history(vm);
        CPPUNIT_ASSERT( rc == 0 );
        //----------------------------------------------------------------------

        // Allocate a VM, will be set to DONE
        rc = vmp->allocate(1, templates[0], &oid, false);
        CPPUNIT_ASSERT( rc == oid );
        CPPUNIT_ASSERT( oid >= 0 );

        vm = vmp->get(oid, false);
        CPPUNIT_ASSERT( vm != 0 );

        vm->set_state(VirtualMachine::DONE);
        vmp->update(vm);
        //----------------------------------------------------------------------

        // Call dump. Should return:
        //    the first VM, with no history.
        //    the second VM, with the first and only history item
        //    the third VM, with only its last history item

        where << "uid < 2";
        rc = vmp->dump(oss, where.str());
        CPPUNIT_ASSERT(rc == 0);

        // Get the xml and replace the STIME to 0, so we can compare it
        string result = oss.str();

        result.replace(159, 10, replacement);
        result.replace(463, 10, replacement);
        result.replace(995, 10, replacement);

        CPPUNIT_ASSERT( result == xml_history_dump );
    }

    void history()
    {
        VirtualMachine *      vm;
        VirtualMachinePool *  vmp = static_cast<VirtualMachinePool*>(pool);

        int rc, oid;

        string hostname     = "hostname";
        string new_hostname = "new_hostname";
        string vm_dir       = "vm_dir";
        string vmm_mad      = "vm_mad";
        string tm_mad       = "tm_mad";

        // Allocate a VM
        oid = allocate(0);
        CPPUNIT_ASSERT( oid != -1 );

        vm = vmp->get(oid, false);
        CPPUNIT_ASSERT( vm != 0 );

        // Add a history item
        vm->add_history(0, hostname, vm_dir, vmm_mad, tm_mad);

	rc = vmp->update(vm);
        CPPUNIT_ASSERT( rc == 0 );

        rc = vmp->update_history(vm);
        CPPUNIT_ASSERT( rc == 0 );

        vm->add_history(0, new_hostname, vm_dir, vmm_mad, tm_mad);

	rc = vmp->update(vm);
        CPPUNIT_ASSERT( rc == 0 );

        vm->set_reason(History::USER);
        vm->set_previous_reason(History::ERROR);

        rc = vmp->update_history(vm);
        rc = vmp->update_previous_history(vm);

        CPPUNIT_ASSERT( rc == 0 );

        // Clean the DB cache
        pool->clean();

        vm = vmp->get(oid, false);

        CPPUNIT_ASSERT( vm != 0 );
        CPPUNIT_ASSERT( vm->hasHistory() == true );
        CPPUNIT_ASSERT( vm->hasPreviousHistory() == true );

        CPPUNIT_ASSERT( vm->get_hostname() == new_hostname );
        CPPUNIT_ASSERT( vm->get_previous_hostname() == hostname );

        CPPUNIT_ASSERT( vm->get_vmm_mad() == vmm_mad );
        CPPUNIT_ASSERT( vm->get_previous_vmm_mad() == vmm_mad );

        CPPUNIT_ASSERT( vm->get_previous_reason() == History::ERROR );
    }
};


/* ************************************************************************* */
/* ************************************************************************* */

int main(int argc, char ** argv)
{
    return PoolTest::main(argc, argv, VirtualMachinePoolTest::suite());
}
