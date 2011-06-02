/* -------------------------------------------------------------------------- */
/* Copyright 2002-2011, OpenNebula Project Leads (OpenNebula.org)             */
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

#include "VMTemplatePool.h"
#include "PoolTest.h"

using namespace std;

const int uids[] = {0,1,2};

const string names[] = {"Template one", "Second Template", "Third Template"};

const string templates[] =
{
    "NAME   = \"Template one\"\n"
    "MEMORY = 128\n"
    "CPU    = 1",

    "NAME   = \"Second Template\"\n"
    "MEMORY = 256\n"
    "CPU    = 2",

    "NAME   = \"Third Template\"\n"
    "MEMORY = 1024\n"
    "CPU    = 3"
};


const string xmls[] =
{
    "<VMTEMPLATE><ID>0</ID><UID>0</UID><GID>0</GID><NAME>Template one</NAME><PUBLIC>0</PUBLIC><REGTIME>0000000000</REGTIME><TEMPLATE><CPU><![CDATA[1]]></CPU><MEMORY><![CDATA[128]]></MEMORY><NAME><![CDATA[Template one]]></NAME></TEMPLATE></VMTEMPLATE>",

    "<VMTEMPLATE><ID>1</ID><UID>1</UID><GID>0</GID><NAME>Second Template</NAME><PUBLIC>0</PUBLIC><REGTIME>0000000000</REGTIME><TEMPLATE><CPU><![CDATA[2]]></CPU><MEMORY><![CDATA[256]]></MEMORY><NAME><![CDATA[Second Template]]></NAME></TEMPLATE></VMTEMPLATE>",

    "<VMTEMPLATE><ID>2</ID><UID>2</UID><GID>0</GID><NAME>Third Template</NAME><PUBLIC>0</PUBLIC><REGTIME>0000000000</REGTIME><TEMPLATE><CPU><![CDATA[3]]></CPU><MEMORY><![CDATA[1024]]></MEMORY><NAME><![CDATA[Third Template]]></NAME></TEMPLATE></VMTEMPLATE>"
};


// This xml dump result has the STIMEs modified to 0000000000
const string xml_dump =
    "<VMTEMPLATE_POOL><VMTEMPLATE><ID>0</ID><UID>0</UID><GID>0</GID><NAME>Template one</NAME><PUBLIC>0</PUBLIC><REGTIME>0000000000</REGTIME><TEMPLATE><CPU><![CDATA[1]]></CPU><MEMORY><![CDATA[128]]></MEMORY><NAME><![CDATA[Template one]]></NAME></TEMPLATE></VMTEMPLATE><VMTEMPLATE><ID>1</ID><UID>1</UID><GID>0</GID><NAME>Second Template</NAME><PUBLIC>0</PUBLIC><REGTIME>0000000000</REGTIME><TEMPLATE><CPU><![CDATA[2]]></CPU><MEMORY><![CDATA[256]]></MEMORY><NAME><![CDATA[Second Template]]></NAME></TEMPLATE></VMTEMPLATE><VMTEMPLATE><ID>2</ID><UID>2</UID><GID>0</GID><NAME>Third Template</NAME><PUBLIC>0</PUBLIC><REGTIME>0000000000</REGTIME><TEMPLATE><CPU><![CDATA[3]]></CPU><MEMORY><![CDATA[1024]]></MEMORY><NAME><![CDATA[Third Template]]></NAME></TEMPLATE></VMTEMPLATE></VMTEMPLATE_POOL>";
const string xml_dump_where =
    "<VMTEMPLATE_POOL><VMTEMPLATE><ID>0</ID><UID>0</UID><GID>0</GID><NAME>Template one</NAME><PUBLIC>0</PUBLIC><REGTIME>0000000000</REGTIME><TEMPLATE><CPU><![CDATA[1]]></CPU><MEMORY><![CDATA[128]]></MEMORY><NAME><![CDATA[Template one]]></NAME></TEMPLATE></VMTEMPLATE><VMTEMPLATE><ID>1</ID><UID>1</UID><GID>0</GID><NAME>Second Template</NAME><PUBLIC>0</PUBLIC><REGTIME>0000000000</REGTIME><TEMPLATE><CPU><![CDATA[2]]></CPU><MEMORY><![CDATA[256]]></MEMORY><NAME><![CDATA[Second Template]]></NAME></TEMPLATE></VMTEMPLATE></VMTEMPLATE_POOL>";

class VMTemplatePoolFriend : public VMTemplatePool
{
public:
    VMTemplatePoolFriend(SqlDB * db) : VMTemplatePool(db){};

    int allocate(int    uid,
                 const  string& stemplate,
                 int *  oid)
     {
        VirtualMachineTemplate *    template_contents;
        char *                      error_msg = 0;
        int                         rc;
        string                      err;

        template_contents = new VirtualMachineTemplate();
        rc = template_contents->parse(stemplate,&error_msg);

        if( rc == 0 )
        {
            return VMTemplatePool::allocate(uid, 0,template_contents, oid, err);
        }
        else
        {
            if (error_msg != 0 )
            {
                free(error_msg);
            }

            delete template_contents;
            return -2;
        }
    };
};

/* ************************************************************************* */
/* ************************************************************************* */

class VMTemplatePoolTest : public PoolTest
{
    CPPUNIT_TEST_SUITE (VMTemplatePoolTest);

    ALL_POOLTEST_CPPUNIT_TESTS();

    CPPUNIT_TEST ( names_initialization );
    CPPUNIT_TEST ( clone_template );
    CPPUNIT_TEST ( update );
    CPPUNIT_TEST ( get_using_name );
    CPPUNIT_TEST ( wrong_get_name );
    CPPUNIT_TEST ( duplicates );
    CPPUNIT_TEST ( public_attribute );
    CPPUNIT_TEST ( dump );
    CPPUNIT_TEST ( dump_where );

    CPPUNIT_TEST_SUITE_END ();

protected:

    void bootstrap(SqlDB* db)
    {
        VMTemplatePool::bootstrap(db);
    };

    PoolSQL* create_pool(SqlDB* db)
    {
        return new VMTemplatePoolFriend(db);
    };

    int allocate(int index)
    {
        int oid;
        return ((VMTemplatePoolFriend*)pool)->allocate(uids[index],
                                               templates[index],
                                               &oid);

    };

    void check(int index, PoolObjectSQL* obj)
    {
        CPPUNIT_ASSERT( obj != 0 );

        string xml_str = "";

        // Get the xml and replace the REGTIME to 0, so we can compare
        // it.
        ((VMTemplate*)obj)->to_xml(xml_str);
        fix_regtimes( xml_str );

/*
        if( xml_str != xmls[index] )
        {
            cout << endl << xml_str << endl << xmls[index] << endl;
        }
//*/

        CPPUNIT_ASSERT( obj->get_name() == names[index] );
        CPPUNIT_ASSERT( xml_str == xmls[index]);
    };

public:
    VMTemplatePoolTest(){xmlInitParser();};

    ~VMTemplatePoolTest(){xmlCleanupParser();};


    /* ********************************************************************* */

    void names_initialization()
    {
        VMTemplatePoolFriend *  tpool;
        VMTemplate *            temp;

        // Allocate 2 Templates, so they are written to the DB.
        allocate(0);
        allocate(2);

        // Create a new pool, using the same DB. This new pool should read the
        // allocated Templates.
        tpool = new VMTemplatePoolFriend(db);

        temp = tpool->get(names[0], uids[0], false);
        CPPUNIT_ASSERT( temp != 0 );

        temp = tpool->get(names[1], uids[1], false);
        CPPUNIT_ASSERT( temp == 0 );

        temp = tpool->get(names[2], uids[2], false);
        CPPUNIT_ASSERT( temp != 0 );


        delete tpool;
    }

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

    void clone_template()
    {
        string      attr_temp;
        string      attr_vmt;

        string      name1 = "NAME";
        string      name2 = "MEMORY";

        VMTemplatePoolFriend *   tpool;
        VMTemplate *             temp;
        VirtualMachineTemplate * vmt;

        int                     oid_1;

        tpool = static_cast<VMTemplatePoolFriend *>(pool);
        oid_1 = allocate(0);

        temp = tpool->get(oid_1, true);
        CPPUNIT_ASSERT( temp != 0 );

        vmt = temp->clone_template();

        vmt->get(name1,attr_vmt);
        CPPUNIT_ASSERT( attr_vmt == "Template one");

        temp->get_template_attribute(name1.c_str(), attr_temp);
        CPPUNIT_ASSERT( attr_temp == "Template one");

        temp->replace_template_attribute(name2.c_str(), "1024");

        vmt->get(name2,attr_vmt);
        CPPUNIT_ASSERT( attr_vmt == "128");

        temp->get_template_attribute(name2.c_str(), attr_temp);
        CPPUNIT_ASSERT( attr_temp == "1024");

        delete vmt;

        temp->get_template_attribute(name2.c_str(), attr_temp);
        CPPUNIT_ASSERT( attr_temp == "1024");

        tpool->update(temp);

        temp->unlock();
    };
/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

    void update()
    {
        string      description_name    = "DESCRIPTION";
        string      description_val     = "";
        string      new_description     = "A new description";

        string      attr_name       = "NEW_ATTRIBUTE";
        string      attr_val        = "";
        string      new_attr_value  = "New value";

        string      no_value        = "Some random value";

        VMTemplatePoolFriend *  tpool;
        VMTemplate *            temp;
        int                     oid_1;

        tpool = static_cast<VMTemplatePoolFriend *>(pool);
        oid_1 = allocate(0);

        temp = tpool->get(oid_1, true);
        CPPUNIT_ASSERT( temp != 0 );

        // Object should be cached. Let's change some template attributes
        temp->replace_template_attribute(description_name, new_description);
        temp->replace_template_attribute(attr_name,        new_attr_value);
        temp->remove_template_attribute("ORIGINAL_PATH");

        tpool->update(temp);

        temp->unlock();

        temp = tpool->get(oid_1,false);
        CPPUNIT_ASSERT( temp != 0 );


        temp->get_template_attribute("DESCRIPTION",   description_val);
        temp->get_template_attribute("NEW_ATTRIBUTE", attr_val);
        temp->get_template_attribute("ORIGINAL_PATH", no_value);

        CPPUNIT_ASSERT( description_val == new_description );
        CPPUNIT_ASSERT( attr_val        == new_attr_value );
        CPPUNIT_ASSERT( no_value        == "" );

        //Now force access to DB

        pool->clean();
        temp = tpool->get(oid_1,false);

        CPPUNIT_ASSERT( temp != 0 );

        description_val = "";
        attr_val        = "";
        no_value        = "Random value";
        temp->get_template_attribute("DESCRIPTION",   description_val);
        temp->get_template_attribute("NEW_ATTRIBUTE", attr_val);
        temp->get_template_attribute("ORIGINAL_PATH", no_value);

        CPPUNIT_ASSERT( description_val == new_description );
        CPPUNIT_ASSERT( attr_val        == new_attr_value );
        CPPUNIT_ASSERT( no_value        == "" );
    };

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

    void get_using_name()
    {
        int oid_0, oid_1;

        // Allocate two objects
        oid_0 = allocate(0);
        oid_1 = allocate(1);

        // ---------------------------------
        // Get first object and check its integrity
        obj = pool->get(oid_0, false);
        CPPUNIT_ASSERT( obj != 0 );
        check(0, obj);

        // Get using its name
        obj = pool->get(names[1], uids[1], true);
        CPPUNIT_ASSERT( obj != 0 );
        obj->unlock();

        check(1, obj);


        // ---------------------------------
        // Clean the cache, forcing the pool to read the objects from the DB
        pool->clean();

        // Get first object and check its integrity
        obj = pool->get(names[0], uids[0], false);
        check(0, obj);

        // Get using its name
        obj = pool->get(oid_1, false);
        check(1, obj);
    };

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

    void wrong_get_name()
    {
        // The pool is empty
        // Non existing name
        obj = pool->get("Wrong name", 0, true);
        CPPUNIT_ASSERT( obj == 0 );

        // Allocate an object
        allocate(0);

        // Ask again for a non-existing name
        obj = pool->get("Non existing name",uids[0], true);
        CPPUNIT_ASSERT( obj == 0 );
    }

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

    void duplicates()
    {
        int rc, oid;
        VMTemplatePoolFriend * tpool = static_cast<VMTemplatePoolFriend*>(pool);

        // Allocate a template
        rc = tpool->allocate(uids[0], templates[0], &oid);
        CPPUNIT_ASSERT( oid == 0 );
        CPPUNIT_ASSERT( oid == rc );

        // Try to allocate twice the same template, should fail
        rc = tpool->allocate(uids[0], templates[0], &oid);
        CPPUNIT_ASSERT( rc  == -1 );
        CPPUNIT_ASSERT( oid == rc );

        // Try again, this time with different uid. Should be allowed
        rc = tpool->allocate(uids[1], templates[0], &oid);
        CPPUNIT_ASSERT( rc  >= 0 );
        CPPUNIT_ASSERT( oid == rc );
    }

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

    void public_attribute()
    {
        int oid;
        VMTemplatePoolFriend *  tpool = static_cast<VMTemplatePoolFriend *>(pool);
        VMTemplate *            temp;

        string templates[] =
        {
            // false
            "NAME           = \"name A\"\n",

            // true
            "NAME           = \"name B\"\n"
            "PUBLIC         = YES",

            // false
            "NAME           = \"name C\"\n"
            "PUBLIC         = NO",

            // false
            "NAME           = \"name D\"\n"
            "PUBLIC         = 1",

            // true
            "NAME           = \"name E\"\n"
            "PUBLIC         = Yes",

            // false
            "NAME           = \"name F\"\n"
            "PUBLIC         = TRUE",

            // true
            "NAME           = \"name G\"\n"
            "PUBLIC         = yes",

            // false
            "NAME           = \"name H\"\n"
            "PUBLIC         = 'YES'",

            // true
            "NAME           = \"name I\"\n"
            "PUBLIC         = \"YES\"",

            "END"
        };

        bool results[] = {  false, true, false, false,
                            true, false, true, false, true };

        int i = 0;
        while( templates[i] != "END" )
        {

            tpool->allocate(0, templates[i], &oid);

            CPPUNIT_ASSERT( oid >= 0 );

            temp = tpool->get( oid, false );
            CPPUNIT_ASSERT( temp != 0 );
//cout << endl << i << " : exp. " << results[i] << " got " << temp->is_public();

            CPPUNIT_ASSERT( temp->isPublic() == results[i] );

            i++;
        }

        int success;

        // temp 0 is not public.
        temp = tpool->get( 0, false );
        CPPUNIT_ASSERT( temp != 0 );

        success = temp->publish(false);
        CPPUNIT_ASSERT( success == 0 );
        CPPUNIT_ASSERT( temp->isPublic() == false );

        success = temp->publish(true);
        CPPUNIT_ASSERT( success == 0 );
        CPPUNIT_ASSERT( temp->isPublic() == true );
    }

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

    void dump()
    {
        VMTemplatePool * tpool = static_cast<VMTemplatePool*>(pool);

        ostringstream   oss;
        int             rc;
        string          nan;

        allocate(0);
        allocate(1);
        allocate(2);

        rc = tpool->dump(oss,nan);
        CPPUNIT_ASSERT(rc == 0);

        string result = oss.str();
        fix_regtimes(result);

/*
        if( result != xml_dump )
        {
            cout << endl << result << endl << xml_dump << endl;
        }
//*/

        CPPUNIT_ASSERT( result == xml_dump );
    }

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

    void dump_where()
    {
        VMTemplatePool * tpool = static_cast<VMTemplatePool*>(pool);

        int             rc;
        ostringstream   oss;
        ostringstream   where;

        allocate(0);
        allocate(1);
        allocate(2);

        where << "uid < 2";

        rc = tpool->dump(oss, where.str());
        CPPUNIT_ASSERT(rc == 0);

        string result = oss.str();
        fix_regtimes(result);

/*
        if( result != xml_dump_where )
        {
            cout << endl << result << endl << xml_dump_where << endl;
        }
//*/

        CPPUNIT_ASSERT( result == xml_dump_where );
    }

    /* ********************************************************************* */

};

/* ************************************************************************* */
/* ************************************************************************* */

int main(int argc, char ** argv)
{
    return PoolTest::main(argc, argv, VMTemplatePoolTest::suite());
}
