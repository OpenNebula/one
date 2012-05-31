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

#include <string>
#include <iostream>
#include <stdlib.h>

#include "VirtualMachinePool.h"
#include "ImagePool.h"
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
    "<VM><ID>0</ID><UID>123</UID><GID>1</GID><UNAME>the_user</UNAME><GNAME>users</GNAME><NAME>VM one</NAME><PERMISSIONS><OWNER_U>1</OWNER_U><OWNER_M>1</OWNER_M><OWNER_A>0</OWNER_A><GROUP_U>0</GROUP_U><GROUP_M>0</GROUP_M><GROUP_A>0</GROUP_A><OTHER_U>0</OTHER_U><OTHER_M>0</OTHER_M><OTHER_A>0</OTHER_A></PERMISSIONS><LAST_POLL>0</LAST_POLL><STATE>1</STATE><LCM_STATE>0</LCM_STATE><RESCHED>0</RESCHED><STIME>0000000000</STIME><ETIME>0</ETIME><DEPLOY_ID></DEPLOY_ID><MEMORY>0</MEMORY><CPU>0</CPU><NET_TX>0</NET_TX><NET_RX>0</NET_RX><TEMPLATE><CPU><![CDATA[1]]></CPU><MEMORY><![CDATA[128]]></MEMORY><NAME><![CDATA[VM one]]></NAME><VMID><![CDATA[0]]></VMID></TEMPLATE><HISTORY_RECORDS/></VM>",

    "<VM><ID>1</ID><UID>261</UID><GID>1</GID><UNAME>the_user</UNAME><GNAME>users</GNAME><NAME>Second VM</NAME><PERMISSIONS><OWNER_U>1</OWNER_U><OWNER_M>1</OWNER_M><OWNER_A>0</OWNER_A><GROUP_U>0</GROUP_U><GROUP_M>0</GROUP_M><GROUP_A>0</GROUP_A><OTHER_U>0</OTHER_U><OTHER_M>0</OTHER_M><OTHER_A>0</OTHER_A></PERMISSIONS><LAST_POLL>0</LAST_POLL><STATE>1</STATE><LCM_STATE>0</LCM_STATE><RESCHED>0</RESCHED><STIME>0000000000</STIME><ETIME>0</ETIME><DEPLOY_ID></DEPLOY_ID><MEMORY>0</MEMORY><CPU>0</CPU><NET_TX>0</NET_TX><NET_RX>0</NET_RX><TEMPLATE><CPU><![CDATA[2]]></CPU><MEMORY><![CDATA[256]]></MEMORY><NAME><![CDATA[Second VM]]></NAME><VMID><![CDATA[1]]></VMID></TEMPLATE><HISTORY_RECORDS/></VM>",

    "<VM><ID>0</ID><UID>123</UID><GID>1</GID><UNAME>the_user</UNAME><GNAME>users</GNAME><NAME>VM one</NAME><LAST_POLL>0</LAST_POLL><ST"
    "ATE>1</STATE><LCM_STATE>0</LCM_STATE><RESCHED>0</RESCHED><STIME>0000000000</STIME><ETIME>0</ET"
    "IME><DEPLOY_ID></DEPLOY_ID><MEMORY>0</MEMORY><CPU>0</CPU><NET_TX>0</NET_TX"
    "><NET_RX>0</NET_RX><TEMPLATE><CPU>1</CPU><MEMORY>1024</MEMORY><NAME>VM one"
    "</NAME><VMID>0</VMID></TEMPLATE><HISTORY_RECORDS/></VM>"
};


// This xml dump result has the STIMEs modified to 0000000000
const string xml_dump =
    "<VM_POOL><VM><ID>0</ID><UID>1</UID><GID>1</GID><UNAME>the_user</UNAME><GNAME>users</GNAME><NAME>VM one</NAME><PERMISSIONS><OWNER_U>1</OWNER_U><OWNER_M>1</OWNER_M><OWNER_A>0</OWNER_A><GROUP_U>0</GROUP_U><GROUP_M>0</GROUP_M><GROUP_A>0</GROUP_A><OTHER_U>0</OTHER_U><OTHER_M>0</OTHER_M><OTHER_A>0</OTHER_A></PERMISSIONS><LAST_POLL>0</LAST_POLL><STATE>1</STATE><LCM_STATE>0</LCM_STATE><RESCHED>0</RESCHED><STIME>0000000000</STIME><ETIME>0</ETIME><DEPLOY_ID></DEPLOY_ID><MEMORY>0</MEMORY><CPU>0</CPU><NET_TX>0</NET_TX><NET_RX>0</NET_RX><TEMPLATE><CPU><![CDATA[1]]></CPU><MEMORY><![CDATA[128]]></MEMORY><NAME><![CDATA[VM one]]></NAME><VMID><![CDATA[0]]></VMID></TEMPLATE><HISTORY_RECORDS/></VM><VM><ID>1</ID><UID>2</UID><GID>1</GID><UNAME>the_user</UNAME><GNAME>users</GNAME><NAME>Second VM</NAME><PERMISSIONS><OWNER_U>1</OWNER_U><OWNER_M>1</OWNER_M><OWNER_A>0</OWNER_A><GROUP_U>0</GROUP_U><GROUP_M>0</GROUP_M><GROUP_A>0</GROUP_A><OTHER_U>0</OTHER_U><OTHER_M>0</OTHER_M><OTHER_A>0</OTHER_A></PERMISSIONS><LAST_POLL>0</LAST_POLL><STATE>2</STATE><LCM_STATE>0</LCM_STATE><RESCHED>0</RESCHED><STIME>0000000000</STIME><ETIME>0</ETIME><DEPLOY_ID></DEPLOY_ID><MEMORY>0</MEMORY><CPU>0</CPU><NET_TX>0</NET_TX><NET_RX>0</NET_RX><TEMPLATE><CPU><![CDATA[2]]></CPU><MEMORY><![CDATA[256]]></MEMORY><NAME><![CDATA[Second VM]]></NAME><VMID><![CDATA[1]]></VMID></TEMPLATE><HISTORY_RECORDS/></VM></VM_POOL>";

const string xml_dump_where =
    "<VM_POOL><VM><ID>0</ID><UID>1</UID><GID>1</GID><UNAME>the_user</UNAME><GNAME>users</GNAME><NAME>VM one</NAME><PERMISSIONS><OWNER_U>1</OWNER_U><OWNER_M>1</OWNER_M><OWNER_A>0</OWNER_A><GROUP_U>0</GROUP_U><GROUP_M>0</GROUP_M><GROUP_A>0</GROUP_A><OTHER_U>0</OTHER_U><OTHER_M>0</OTHER_M><OTHER_A>0</OTHER_A></PERMISSIONS><LAST_POLL>0</LAST_POLL><STATE>1</STATE><LCM_STATE>0</LCM_STATE><RESCHED>0</RESCHED><STIME>0000000000</STIME><ETIME>0</ETIME><DEPLOY_ID></DEPLOY_ID><MEMORY>0</MEMORY><CPU>0</CPU><NET_TX>0</NET_TX><NET_RX>0</NET_RX><TEMPLATE><CPU><![CDATA[1]]></CPU><MEMORY><![CDATA[128]]></MEMORY><NAME><![CDATA[VM one]]></NAME><VMID><![CDATA[0]]></VMID></TEMPLATE><HISTORY_RECORDS/></VM></VM_POOL>";

const string xml_history_dump =
    "<VM_POOL><VM><ID>0</ID><UID>0</UID><GID>1</GID><UNAME>the_user</UNAME><GNAME>users</GNAME><NAME>VM one</NAME><PERMISSIONS><OWNER_U>1</OWNER_U><OWNER_M>1</OWNER_M><OWNER_A>0</OWNER_A><GROUP_U>0</GROUP_U><GROUP_M>0</GROUP_M><GROUP_A>0</GROUP_A><OTHER_U>0</OTHER_U><OTHER_M>0</OTHER_M><OTHER_A>0</OTHER_A></PERMISSIONS><LAST_POLL>0</LAST_POLL><STATE>1</STATE><LCM_STATE>0</LCM_STATE><RESCHED>0</RESCHED><STIME>0000000000</STIME><ETIME>0</ETIME><DEPLOY_ID></DEPLOY_ID><MEMORY>0</MEMORY><CPU>0</CPU><NET_TX>0</NET_TX><NET_RX>0</NET_RX><TEMPLATE><CPU><![CDATA[1]]></CPU><MEMORY><![CDATA[128]]></MEMORY><NAME><![CDATA[VM one]]></NAME><VMID><![CDATA[0]]></VMID></TEMPLATE><HISTORY_RECORDS/></VM><VM><ID>1</ID><UID>0</UID><GID>1</GID><UNAME>the_user</UNAME><GNAME>users</GNAME><NAME>Second VM</NAME><PERMISSIONS><OWNER_U>1</OWNER_U><OWNER_M>1</OWNER_M><OWNER_A>0</OWNER_A><GROUP_U>0</GROUP_U><GROUP_M>0</GROUP_M><GROUP_A>0</GROUP_A><OTHER_U>0</OTHER_U><OTHER_M>0</OTHER_M><OTHER_A>0</OTHER_A></PERMISSIONS><LAST_POLL>0</LAST_POLL><STATE>2</STATE><LCM_STATE>0</LCM_STATE><RESCHED>0</RESCHED><STIME>0000000000</STIME><ETIME>0</ETIME><DEPLOY_ID></DEPLOY_ID><MEMORY>0</MEMORY><CPU>0</CPU><NET_TX>0</NET_TX><NET_RX>0</NET_RX><TEMPLATE><CPU><![CDATA[2]]></CPU><MEMORY><![CDATA[256]]></MEMORY><NAME><![CDATA[Second VM]]></NAME><VMID><![CDATA[1]]></VMID></TEMPLATE><HISTORY_RECORDS><HISTORY><SEQ>0</SEQ><HOSTNAME>A_hostname</HOSTNAME><HID>0</HID><STIME>0</STIME><ETIME>0</ETIME><VMMMAD>A_vmm_mad</VMMMAD><VNMMAD>A_vnm_mad</VNMMAD><PSTIME>0</PSTIME><PETIME>0</PETIME><RSTIME>0</RSTIME><RETIME>0</RETIME><ESTIME>0</ESTIME><EETIME>0</EETIME><REASON>0</REASON></HISTORY></HISTORY_RECORDS></VM><VM><ID>2</ID><UID>0</UID><GID>1</GID><UNAME>the_user</UNAME><GNAME>users</GNAME><NAME>VM one</NAME><PERMISSIONS><OWNER_U>1</OWNER_U><OWNER_M>1</OWNER_M><OWNER_A>0</OWNER_A><GROUP_U>0</GROUP_U><GROUP_M>0</GROUP_M><GROUP_A>0</GROUP_A><OTHER_U>0</OTHER_U><OTHER_M>0</OTHER_M><OTHER_A>0</OTHER_A></PERMISSIONS><LAST_POLL>0</LAST_POLL><STATE>2</STATE><LCM_STATE>0</LCM_STATE><RESCHED>0</RESCHED><STIME>0000000000</STIME><ETIME>0</ETIME><DEPLOY_ID></DEPLOY_ID><MEMORY>0</MEMORY><CPU>0</CPU><NET_TX>0</NET_TX><NET_RX>0</NET_RX><TEMPLATE><CPU><![CDATA[1]]></CPU><MEMORY><![CDATA[1024]]></MEMORY><NAME><![CDATA[VM one]]></NAME><VMID><![CDATA[2]]></VMID></TEMPLATE><HISTORY_RECORDS><HISTORY><SEQ>1</SEQ><HOSTNAME>C_hostname</HOSTNAME><HID>2</HID><STIME>0</STIME><ETIME>0</ETIME><VMMMAD>C_vmm_mad</VMMMAD><VNMMAD>C_vnm_mad</VNMMAD><PSTIME>0</PSTIME><PETIME>0</PETIME><RSTIME>0</RSTIME><RETIME>0</RETIME><ESTIME>0</ESTIME><EETIME>0</EETIME><REASON>0</REASON></HISTORY></HISTORY_RECORDS></VM><VM><ID>3</ID><UID>1</UID><GID>1</GID><UNAME>the_user</UNAME><GNAME>users</GNAME><NAME>VM one</NAME><PERMISSIONS><OWNER_U>1</OWNER_U><OWNER_M>1</OWNER_M><OWNER_A>0</OWNER_A><GROUP_U>0</GROUP_U><GROUP_M>0</GROUP_M><GROUP_A>0</GROUP_A><OTHER_U>0</OTHER_U><OTHER_M>0</OTHER_M><OTHER_A>0</OTHER_A></PERMISSIONS><LAST_POLL>0</LAST_POLL><STATE>6</STATE><LCM_STATE>0</LCM_STATE><RESCHED>0</RESCHED><STIME>0000000000</STIME><ETIME>0</ETIME><DEPLOY_ID></DEPLOY_ID><MEMORY>0</MEMORY><CPU>0</CPU><NET_TX>0</NET_TX><NET_RX>0</NET_RX><TEMPLATE><CPU><![CDATA[1]]></CPU><MEMORY><![CDATA[128]]></MEMORY><NAME><![CDATA[VM one]]></NAME><VMID><![CDATA[3]]></VMID></TEMPLATE><HISTORY_RECORDS/></VM></VM_POOL>";

/* ************************************************************************* */
/* ************************************************************************* */
#include "NebulaTest.h"

class NebulaTestVM: public NebulaTest
{
public:
    NebulaTestVM():NebulaTest()
    {
        NebulaTest::the_tester = this;

        need_vm_pool = true;
    }
};

class VirtualMachinePoolFriend : public VirtualMachinePool
{
public:
    VirtualMachinePoolFriend(
            SqlDB * db,
            vector<const Attribute *> hook_mads,
            vector<const Attribute *> restricted_attrs):
                VirtualMachinePool(db, hook_mads,
                        "./", "./", restricted_attrs, 0)
        {};


    int allocate (
        int    uid,
        const  string& stemplate,
        int *  oid,
        bool   on_hold = false)
    {
        VirtualMachineTemplate * vm_template;
        char *          error_msg = 0;
        int             rc;
        string          err;

        vm_template = new VirtualMachineTemplate;
        rc = vm_template->parse(stemplate,&error_msg);

        if( rc == 0 )
        {
            return VirtualMachinePool::allocate(uid, 1, "the_user", "users",vm_template,
                                                oid, err, on_hold);
        }
        else
        {
            return -1;
        }
    };
};

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
    NebulaTestVM * tester;
    VirtualMachinePool *       vmpool;

    void bootstrap(SqlDB* db)
    {
        // setUp overwritten
    };

    PoolSQL* create_pool(SqlDB* db)
    {
        // setUp overwritten
        return vmpool;
    };

    int allocate(int index)
    {
        int oid;
        return ((VirtualMachinePoolFriend*)pool)->allocate( uids[index],
                                                            templates[index],
                                                            &oid, false);
    };

    void check(int index, PoolObjectSQL* obj)
    {
        CPPUNIT_ASSERT( obj != 0 );

        string xml_str = "";

        // Get the xml and replace the STIME to 0, so we can compare it
        ((VirtualMachine*)obj)->to_xml(xml_str);
        fix_stimes(xml_str);

//*
        if( xml_str != xmls[index] )
        {
            cout << endl << xml_str << endl << "========"
                 << endl << xmls[index] << endl << "--------";
        }
//*/

        CPPUNIT_ASSERT( ((VirtualMachine*)obj)->get_name() == names[index] );
        CPPUNIT_ASSERT( xml_str == xmls[index]);
    };

public:
    VirtualMachinePoolTest(){xmlInitParser();};

    ~VirtualMachinePoolTest(){xmlCleanupParser();};

    void setUp()
    {
       create_db();

        tester = new NebulaTestVM();

        Nebula& neb = Nebula::instance();
        neb.start();

        vmpool   = neb.get_vmpool();
        pool    = vmpool;
    };

    void tearDown()
    {
        // -----------------------------------------------------------
        // Stop the managers & free resources
        // -----------------------------------------------------------

        //XML Library
        xmlCleanupParser();

        delete_db();

        delete tester;
    };

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
        vm->replace_template_attribute(attribute, value);

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
        VirtualMachinePoolFriend * vmp =
                                static_cast<VirtualMachinePoolFriend*>(pool);

        ostringstream oss;
        int oid, rc;

        vmp->allocate(1, templates[0], &oid, false);
        vmp->allocate(2, templates[1], &oid, true);

        rc = vmp->dump(oss, "");
        CPPUNIT_ASSERT(rc == 0);

        string result = oss.str();
        fix_stimes(result);

        if( result != xml_dump )
        {
            cout << endl << result << endl << "========"
                 << endl << xml_dump << endl << "--------";
        }

        CPPUNIT_ASSERT( result == xml_dump );
    }

    void dump_where()
    {
        VirtualMachinePoolFriend * vmp =
                                static_cast<VirtualMachinePoolFriend*>(pool);

        int oid, rc;
        ostringstream oss;
        ostringstream where;

        vmp->allocate(1, templates[0], &oid, false);
        vmp->allocate(2, templates[1], &oid, true);

        where << "uid < 2";
        rc = vmp->dump(oss, where.str());
        CPPUNIT_ASSERT(rc == 0);

        string result = oss.str();
        fix_stimes(result);

        if( result != xml_dump_where )
        {
            cout << endl << result << endl << "========"
                 << endl << xml_dump_where << endl << "--------";
        }

        CPPUNIT_ASSERT( result == xml_dump_where );
    }

    void dump_history()
    {
        VirtualMachinePoolFriend * vmp =
                                static_cast<VirtualMachinePoolFriend*>(pool);
        VirtualMachine*      vm;

        string hostnames[] = {"A_hostname", "B_hostname", "C_hostname"};
        string vmm_mads[]  = {"A_vmm_mad", "B_vmm_mad", "C_vmm_mad"};
        string vnm_mads[]  = {"A_vnm_mad", "B_vnm_mad", "C_vnm_mad"};

        int oid, rc;
        ostringstream oss;
        ostringstream where;


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
        vm->add_history(0, hostnames[0], vmm_mads[0], vnm_mads[0]);

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
        vm->add_history(1, hostnames[1], vmm_mads[1], vnm_mads[1]);

        rc = vmp->update(vm);
        CPPUNIT_ASSERT( rc == 0 );

        rc = vmp->update_history(vm);
        CPPUNIT_ASSERT( rc == 0 );

        // Add another history item
        vm->add_history(2, hostnames[2], vmm_mads[2], vnm_mads[2]);

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
        fix_stimes(result);


        if( result != xml_history_dump )
        {
            cout << endl << result << endl << "========"
                 << endl << xml_history_dump << endl << "--------";
        }


        CPPUNIT_ASSERT( result == xml_history_dump );
    }

    void history()
    {
        VirtualMachine *           vm;
        VirtualMachinePoolFriend * vmp =
                                static_cast<VirtualMachinePoolFriend*>(pool);

        int rc, oid;

        string hostname     = "hostname";
        string new_hostname = "new_hostname";
        string vmm_mad      = "vm_mad";
        string vnm_mad      = "vn_mad";

        // Allocate a VM
        oid = allocate(0);
        CPPUNIT_ASSERT( oid != -1 );

        vm = vmp->get(oid, false);
        CPPUNIT_ASSERT( vm != 0 );

        // Add a history item
        vm->add_history(0, hostname, vmm_mad, vnm_mad);

        rc = vmp->update(vm);
        CPPUNIT_ASSERT( rc == 0 );

        rc = vmp->update_history(vm);
        CPPUNIT_ASSERT( rc == 0 );

        vm->add_history(0, new_hostname, vmm_mad, vnm_mad);

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
