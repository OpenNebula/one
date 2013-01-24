/* -------------------------------------------------------------------------- */
/* Copyright 2002-2013, OpenNebula Project (OpenNebula.org), C12G Labs        */
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
const string memory[] = {"128", "256", "1024"};

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
        string st;

        CPPUNIT_ASSERT( obj != 0 );

        VirtualMachine* vm = static_cast<VirtualMachine*>(obj);

        ObjectXML xml(vm->to_xml(st));

        CPPUNIT_ASSERT( vm->get_name() == names[index] );

        xml.xpath(st, "/VM/TEMPLATE/MEMORY", "-");
        CPPUNIT_ASSERT( st == memory[index] );
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
        string tm_mad       = "tm_mad";
        int ds_id           = 1;


        // Allocate a VM
        oid = allocate(0);
        CPPUNIT_ASSERT( oid != -1 );

        vm = vmp->get(oid, false);
        CPPUNIT_ASSERT( vm != 0 );

        // Add a history item

        vm->add_history(0, hostname, vmm_mad, vnm_mad, tm_mad, ds_id);

        rc = vmp->update(vm);
        CPPUNIT_ASSERT( rc == 0 );

        rc = vmp->update_history(vm);
        CPPUNIT_ASSERT( rc == 0 );

        vm->add_history(0, new_hostname, vmm_mad, vnm_mad, tm_mad, ds_id);

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
