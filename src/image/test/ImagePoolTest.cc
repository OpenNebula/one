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

#include "ImagePool.h"
#include "PoolTest.h"

using namespace std;

const int uids[] = {0,1,2};

const string names[] = {"Image one", "Second Image", "The third image"};

const string templates[] =
{
    "NAME          = \"Image one\"\n"
    "ORIGINAL_PATH = /tmp/image_test\n"
    "DESCRIPTION   = \"This is a very long description of an image, and to achieve the longness I will copy this over. This is a very long description of an image, and to achieve the longness I will copy this over. And over. This is a very long description of an image, and to achieve the longness I will copy this over. And over. This is a very long description of an image, and to achieve the longness I will copy this over. And over.This is a very long description of an image, and to achieve the longness I will copy this over.\"\n",

    "NAME          = \"Second Image\"\n"
    "ORIGINAL_PATH = /tmp/image_second_test\n"
    "PUBLIC        = YES\n"
    "DESCRIPTION   = \"This is a rather short description.\"\n",

    "NAME          = \"The third image\"\n"
    "ORIGINAL_PATH = /tmp/image_test\n"
    "# DESCRIPTION   = \"An image description\"\n"
    "BUS           = SCSI\n"
    "PROFILE       = STUDENT\n"
};


const string xmls[] =
{
    "<IMAGE><ID>0</ID><UID>0</UID><NAME>Image one</NAME><TYPE>0</TYPE><PUBLIC>0</PUBLIC><REGTIME>0000000000</REGTIME><SOURCE>source_prefix/9ab4a4e021ee2883f57e3aeecc9e2aed7c3fa198</SOURCE><STATE>0</STATE><RUNNING_VMS>0</RUNNING_VMS><TEMPLATE><DESCRIPTION><![CDATA[This is a very long description of an image, and to achieve the longness I will copy this over. This is a very long description of an image, and to achieve the longness I will copy this over. And over. This is a very long description of an image, and to achieve the longness I will copy this over. And over. This is a very long description of an image, and to achieve the longness I will copy this over. And over.This is a very long description of an image, and to achieve the longness I will copy this over.]]></DESCRIPTION><DEV_PREFIX><![CDATA[hd]]></DEV_PREFIX><NAME><![CDATA[Image one]]></NAME><ORIGINAL_PATH><![CDATA[/tmp/image_test]]></ORIGINAL_PATH></TEMPLATE></IMAGE>",

    "<IMAGE><ID>1</ID><UID>1</UID><NAME>Second Image</NAME><TYPE>0</TYPE><PUBLIC>1</PUBLIC><REGTIME>0000000000</REGTIME><SOURCE>source_prefix/c9d51800847467911c755e5e4c13dfe28c3a79f3</SOURCE><STATE>0</STATE><RUNNING_VMS>0</RUNNING_VMS><TEMPLATE><DESCRIPTION><![CDATA[This is a rather short description.]]></DESCRIPTION><DEV_PREFIX><![CDATA[hd]]></DEV_PREFIX><NAME><![CDATA[Second Image]]></NAME><ORIGINAL_PATH><![CDATA[/tmp/image_second_test]]></ORIGINAL_PATH><PUBLIC><![CDATA[YES]]></PUBLIC></TEMPLATE></IMAGE>",

    "<IMAGE><ID>0</ID><UID>2</UID><NAME>The third image</NAME><TYPE>0</TYPE><PUBLIC>0</PUBLIC><REGTIME>0000000000</REGTIME><SOURCE>source_prefix/e50b0c738be9d431475bf5859629e5580301a7d6</SOURCE><STATE>0</STATE><RUNNING_VMS>0</RUNNING_VMS><TEMPLATE><BUS><![CDATA[SCSI]]></BUS><DEV_PREFIX><![CDATA[hd]]></DEV_PREFIX><NAME><![CDATA[The third image]]></NAME><ORIGINAL_PATH><![CDATA[/tmp/image_test]]></ORIGINAL_PATH><PROFILE><![CDATA[STUDENT]]></PROFILE></TEMPLATE></IMAGE>"
};


// This xml dump result has the STIMEs modified to 0000000000
const string xml_dump =
"<IMAGE_POOL><IMAGE><ID>0</ID><UID>0</UID><USERNAME>one_user_test</USERNAME><NAME>Image one</NAME><TYPE>0</TYPE><PUBLIC>0</PUBLIC><REGTIME>0000000000</REGTIME><SOURCE>source_prefix/9ab4a4e021ee2883f57e3aeecc9e2aed7c3fa198</SOURCE><STATE>0</STATE><RUNNING_VMS>0</RUNNING_VMS></IMAGE><IMAGE><ID>1</ID><UID>1</UID><USERNAME>A user</USERNAME><NAME>Second Image</NAME><TYPE>0</TYPE><PUBLIC>1</PUBLIC><REGTIME>0000000000</REGTIME><SOURCE>source_prefix/c9d51800847467911c755e5e4c13dfe28c3a79f3</SOURCE><STATE>0</STATE><RUNNING_VMS>0</RUNNING_VMS></IMAGE><IMAGE><ID>2</ID><UID>2</UID><USERNAME>B user</USERNAME><NAME>The third image</NAME><TYPE>0</TYPE><PUBLIC>0</PUBLIC><REGTIME>0000000000</REGTIME><SOURCE>source_prefix/e50b0c738be9d431475bf5859629e5580301a7d6</SOURCE><STATE>0</STATE><RUNNING_VMS>0</RUNNING_VMS></IMAGE></IMAGE_POOL>";

const string xml_dump_where =
"<IMAGE_POOL><IMAGE><ID>0</ID><UID>0</UID><USERNAME>one_user_test</USERNAME><NAME>Image one</NAME><TYPE>0</TYPE><PUBLIC>0</PUBLIC><REGTIME>0000000000</REGTIME><SOURCE>source_prefix/9ab4a4e021ee2883f57e3aeecc9e2aed7c3fa198</SOURCE><STATE>0</STATE><RUNNING_VMS>0</RUNNING_VMS></IMAGE><IMAGE><ID>1</ID><UID>1</UID><USERNAME>A user</USERNAME><NAME>Second Image</NAME><TYPE>0</TYPE><PUBLIC>1</PUBLIC><REGTIME>0000000000</REGTIME><SOURCE>source_prefix/c9d51800847467911c755e5e4c13dfe28c3a79f3</SOURCE><STATE>0</STATE><RUNNING_VMS>0</RUNNING_VMS></IMAGE></IMAGE_POOL>";

const string replacement = "0000000000";


/* ************************************************************************* */
/* ************************************************************************* */

class ImagePoolTest : public PoolTest
{
    CPPUNIT_TEST_SUITE (ImagePoolTest);

    ALL_POOLTEST_CPPUNIT_TESTS();

    CPPUNIT_TEST ( names_initialization );
    CPPUNIT_TEST ( update );
    CPPUNIT_TEST ( get_using_name );
    CPPUNIT_TEST ( wrong_get_name );
    CPPUNIT_TEST ( duplicates );
    CPPUNIT_TEST ( extra_attributes );
    CPPUNIT_TEST ( wrong_templates );
    CPPUNIT_TEST ( target_generation );
    CPPUNIT_TEST ( bus_source_assignment );
    CPPUNIT_TEST ( public_attribute );
    CPPUNIT_TEST ( dump );
    CPPUNIT_TEST ( dump_where );

    CPPUNIT_TEST_SUITE_END ();

protected:

    void bootstrap(SqlDB* db)
    {
        ImagePool::bootstrap(db);
    };

    PoolSQL* create_pool(SqlDB* db)
    {
        return new ImagePool(db, "source_prefix", "OS", "hd");
    };

    int allocate(int index)
    {
        int oid;
        return ((ImagePool*)pool)->allocate(uids[index],
                                            templates[index],
                                            &oid);

    };

    void check(int index, PoolObjectSQL* obj)
    {
        CPPUNIT_ASSERT( obj != 0 );

        string xml_str = "";

        // Get the xml and replace the REGTIME to 0, so we can compare
        // it.
        ((Image*)obj)->to_xml(xml_str);
        xml_str.replace( xml_str.find("<REGTIME>")+9, 10, replacement);

        //cout << endl << xml_str << endl << xmls[index] << endl;

        CPPUNIT_ASSERT( ((Image*)obj)->get_name() == names[index] );
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
    ImagePoolTest(){};

    ~ImagePoolTest(){};


    /* ********************************************************************* */

    void names_initialization()
    {
        ImagePool * imp;
        Image *     img;

        // Allocate 2 users, so they are written to the DB.
        allocate(0);
        allocate(2);

        // Create a new pool, using the same DB. This new pool should read the
        // allocated images.
        imp = new ImagePool(db, "source_prefix", "OS", "hd");

        img = imp->get(names[0], false);
        CPPUNIT_ASSERT( img != 0 );

        img = imp->get(names[1], false);
        CPPUNIT_ASSERT( img == 0 );

        img = imp->get(names[2], false);
        CPPUNIT_ASSERT( img != 0 );


        delete imp;
    }

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

        ImagePool * ip;
        Image *     img;
        int         oid_1;

        ip = static_cast<ImagePool *>(pool);
        oid_1 = allocate(0);

        img = ip->get(oid_1, true);
        CPPUNIT_ASSERT( img != 0 );

        // Image object should be cached. Let's change some template attributes
        ip->replace_attribute(img, description_name, new_description);
        ip->replace_attribute(img, attr_name,        new_attr_value);
        ip->remove_attribute(img, "ORIGINAL_PATH");

        img->unlock();

        img = ip->get(oid_1,false);
        CPPUNIT_ASSERT( img != 0 );


        img->get_template_attribute("DESCRIPTION",   description_val);
        img->get_template_attribute("NEW_ATTRIBUTE", attr_val);
        img->get_template_attribute("ORIGINAL_PATH", no_value);

        CPPUNIT_ASSERT( description_val == new_description );
        CPPUNIT_ASSERT( attr_val        == new_attr_value );
        CPPUNIT_ASSERT( no_value        == "" );

        //Now force access to DB

        pool->clean();
        img = ip->get(oid_1,false);

        CPPUNIT_ASSERT( img != 0 );

        description_val = "";
        attr_val        = "";
        no_value        = "Random value";
        img->get_template_attribute("DESCRIPTION",   description_val);
        img->get_template_attribute("NEW_ATTRIBUTE", attr_val);
        img->get_template_attribute("ORIGINAL_PATH", no_value);

        CPPUNIT_ASSERT( description_val == new_description );
        CPPUNIT_ASSERT( attr_val        == new_attr_value );
        CPPUNIT_ASSERT( no_value        == "" );
    };

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

    void get_using_name()
    {
        int oid_0, oid_1;
        ImagePool * imp = static_cast<ImagePool *>(pool);

        // Allocate two objects
        oid_0 = allocate(0);
        oid_1 = allocate(1);

        // ---------------------------------
        // Get first object and check its integrity
        obj = pool->get(oid_0, false);
        CPPUNIT_ASSERT( obj != 0 );
        check(0, obj);

        // Get using its name
        obj = imp->get(names[1], true);
        CPPUNIT_ASSERT( obj != 0 );
        obj->unlock();

        check(1, obj);


        // ---------------------------------
        // Clean the cache, forcing the pool to read the objects from the DB
        pool->clean();

        // Get first object and check its integrity
        obj = imp->get(names[0], false);
        check(0, obj);

        // Get using its name
        obj = imp->get(oid_1, false);
        check(1, obj);
    };


    void wrong_get_name()
    {
        ImagePool * imp = static_cast<ImagePool *>(pool);

        // The pool is empty
        // Non existing name
        obj = imp->get("Wrong name", true);
        CPPUNIT_ASSERT( obj == 0 );

        // Allocate an object
        allocate(0);

        // Ask again for a non-existing name
        obj = imp->get("Non existing name", true);
        CPPUNIT_ASSERT( obj == 0 );
    }

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

    void duplicates()
    {
        int rc, oid;
        ImagePool * imp = static_cast<ImagePool *>(pool);

        // Allocate an image.
        rc = imp->allocate(uids[0], templates[0], &oid);
        CPPUNIT_ASSERT( oid == 0 );
        CPPUNIT_ASSERT( oid == rc );

        // Try to allocate twice the same image, should fail
        rc = imp->allocate(uids[0], templates[0], &oid);
        CPPUNIT_ASSERT( rc  == -1 );
        CPPUNIT_ASSERT( oid == rc );

        // Try again, with different uid
        rc = imp->allocate(uids[1], templates[0], &oid);
        CPPUNIT_ASSERT( rc  == -1 );
        CPPUNIT_ASSERT( oid == rc );
    }

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

    void extra_attributes()
    {
        int     oid;
        string  value = "";
        Image * img;

        // The third template doen't have a description, but has some
        // extra attibutes
        oid = allocate(2);
        CPPUNIT_ASSERT( oid == 0 );

        pool->clean();


        img = ((ImagePool*)pool)->get(oid, false);
        check(2, img);

        img->get_template_attribute("DESCRIPTION", value);
        CPPUNIT_ASSERT( value == "" );

        img->get_template_attribute("PROFILE", value);
        CPPUNIT_ASSERT( value == "STUDENT" );
    }

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

    void wrong_templates()
    {
        int rc;
        ImagePool * imp = static_cast<ImagePool *>(pool);

        string templates[] =
        {
            "ORIGINAL_PATH  = /tmp/image_test\n"
            "DESCRIPTION    = \"This template lacks name!\"\n",

            "NAME           = \"name A\"\n"
            "ORIGINAL_PATH  = /tmp/image_test\n"
            "TYPE           = WRONG\n",

            "NAME           \"PARSE ERROR\"\n"
            "TYPE           = WRONG\n",

            "END"
        };

        int results[] = { -1, -1, -2 };

        int i = 0;
        while( templates[i] != "END" )
        {

            imp->allocate(0, templates[i], &rc);

            //cout << endl << i << " - rc: " << rc << "  expected: "
            //     << results[i] << endl;

            CPPUNIT_ASSERT( rc == results[i] );

            i++;
        }
    }

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

    void target_generation()
    {
        ImagePool *         imp = static_cast<ImagePool *>(pool);
        Image *             img;

        VectorAttribute *   disk;
        int                 oid;
        string              value;
        int                 index=0;

        disk = new VectorAttribute("DISK");

        // Allocate an OS type image
        oid = allocate(0);
        img = imp->get(oid, false);

        CPPUNIT_ASSERT( img != 0 );
        CPPUNIT_ASSERT( oid == 0 );

        img->disk_attribute(disk, &index);

        value = disk->vector_value("TARGET");

        CPPUNIT_ASSERT( value == "hda" );
        // clean up
        delete disk;
        value = "";

        disk = new VectorAttribute("DISK");

        // Allocate a CDROM type image
        string templ = "NAME = \"name A\" TYPE = CDROM ORIGINAL_PATH = /tmp";
        imp->allocate(0, templ, &oid);

        CPPUNIT_ASSERT(oid >= 0);

        img = imp->get(oid, false);

        img->disk_attribute(disk, &index);

        value = disk->vector_value("TARGET");
        CPPUNIT_ASSERT(value == "hdc");

        // clean up
        delete disk;
        value = "";

        disk = new VectorAttribute("DISK");

        // Allocate a DATABLOCK type image
        templ = "NAME = \"name B\" TYPE = DATABLOCK";
        imp->allocate(0, templ, &oid);

        CPPUNIT_ASSERT(oid >= 0);

        img = imp->get(oid, false);

        img->disk_attribute(disk, &index);

        value = disk->vector_value("TARGET");
        CPPUNIT_ASSERT(value == "hdd");

        // clean up
        delete disk;
        value = "";

        disk = new VectorAttribute("DISK");

        // Allocate a DATABLOCK type image
        templ = "NAME = \"name C\" TYPE = DATABLOCK DEV_PREFIX = \"sd\"";
        imp->allocate(0, templ, &oid);

        CPPUNIT_ASSERT(oid >= 0);

        img = imp->get(oid, false);

        img->disk_attribute(disk, &index);

        value = disk->vector_value("TARGET");
        CPPUNIT_ASSERT(value == "sde");

        // clean up
        delete disk;
    }

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

    void bus_source_assignment()
    {
        ImagePool *         imp = static_cast<ImagePool *>(pool);
        Image *             img;

        VectorAttribute *   disk;
        int                 oid;
        string              value;
        int                 index = 0;
        // Allocate an OS type image
        oid = allocate(0);
        img = imp->get(oid, false);

        // ---------------------------------------------------------------------
        // A disk without a BUS attribute should not have it added.
        disk = new VectorAttribute("DISK");

        img->disk_attribute(disk, &index);

        value = "";
        value = disk->vector_value("BUS");
        CPPUNIT_ASSERT( value == "" );

        value = "";
        value = disk->vector_value("SOURCE");
        CPPUNIT_ASSERT( value ==
                    "source_prefix/9ab4a4e021ee2883f57e3aeecc9e2aed7c3fa198" );

        // clean up
        delete disk;

        // ---------------------------------------------------------------------
        // A disk with a BUS attribute should not have it overwritten.
        disk = new VectorAttribute("DISK");
        disk->replace("BUS", "SCSI");

        img->disk_attribute(disk, &index);

        value = disk->vector_value("BUS");
        CPPUNIT_ASSERT( value == "SCSI" );

        value = "";
        value = disk->vector_value("SOURCE");
        CPPUNIT_ASSERT( value ==
                    "source_prefix/9ab4a4e021ee2883f57e3aeecc9e2aed7c3fa198" );

        // clean up
        delete disk;
    }

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

    void public_attribute()
    {
        int oid;
        ImagePool * imp = static_cast<ImagePool *>(pool);
        Image *     img;

        string templates[] =
        {
            // false
            "NAME           = \"name A\"\n"
            "ORIGINAL_PATH  = \"/tmp/nothing\"\n",

            // true
            "NAME           = \"name B\"\n"
            "ORIGINAL_PATH  = \"/tmp/nothing\"\n"
            "PUBLIC         = YES",

            // false
            "NAME           = \"name C\"\n"
            "ORIGINAL_PATH  = \"/tmp/nothing\"\n"
            "PUBLIC         = NO",

            // false
            "NAME           = \"name D\"\n"
            "ORIGINAL_PATH  = \"/tmp/nothing\"\n"
            "PUBLIC         = 1",

            // true
            "NAME           = \"name E\"\n"
            "ORIGINAL_PATH  = \"/tmp/nothing\"\n"
            "PUBLIC         = Yes",

            // false
            "NAME           = \"name F\"\n"
            "ORIGINAL_PATH  = \"/tmp/nothing\"\n"
            "PUBLIC         = TRUE",

            // true
            "NAME           = \"name G\"\n"
            "ORIGINAL_PATH  = \"/tmp/nothing\"\n"
            "PUBLIC         = yes",

            // false
            "NAME           = \"name H\"\n"
            "ORIGINAL_PATH  = \"/tmp/nothing\"\n"
            "PUBLIC         = 'YES'",

            // true
            "NAME           = \"name I\"\n"
            "ORIGINAL_PATH  = \"/tmp/nothing\"\n"
            "PUBLIC         = \"YES\"",

            "END"
        };

        bool results[] = {  false, true, false, false,
                            true, false, true, false, true };

        int i = 0;
        while( templates[i] != "END" )
        {

            imp->allocate(0, templates[i], &oid);

            CPPUNIT_ASSERT( oid >= 0 );

            img = imp->get( oid, false );
            CPPUNIT_ASSERT( img != 0 );
//cout << endl << i << " : exp. " << results[i] << " got " << img->is_public();
            CPPUNIT_ASSERT( img->is_public() == results[i] );

            i++;
        }
    }

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

    void dump()
    {
        ImagePool * imp = static_cast<ImagePool*>(pool);

        ostringstream oss;
        int rc;
        string nan;

        set_up_user_pool();

        allocate(0);
        allocate(1);
        allocate(2);

        rc = imp->dump(oss,nan);
        CPPUNIT_ASSERT(rc == 0);

        string result = oss.str();

        result.replace(138,  10, replacement);
        result.replace(403, 10, replacement);
        result.replace(671, 10, replacement);

        CPPUNIT_ASSERT( result == xml_dump );
    }

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

    void dump_where()
    {
        ImagePool * imp = static_cast<ImagePool*>(pool);

        int rc;
        ostringstream oss;
        ostringstream where;

        set_up_user_pool();

        allocate(0);
        allocate(1);
        allocate(2);

        where << "uid < 2";

        rc = imp->dump(oss, where.str());
        CPPUNIT_ASSERT(rc == 0);

        string result = oss.str();

        result.replace(138, 10, replacement);
        result.replace(403, 10, replacement);

        CPPUNIT_ASSERT( result == xml_dump_where );
    }

    /* ********************************************************************* */

};

/* ************************************************************************* */
/* ************************************************************************* */

int main(int argc, char ** argv)
{
    return PoolTest::main(argc, argv, ImagePoolTest::suite());
}
