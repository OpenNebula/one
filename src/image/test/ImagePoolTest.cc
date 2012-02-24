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

#include "ImagePool.h"
#include "PoolTest.h"

using namespace std;

const int uids[] = {0,1,2};

const char* unames[] = {"one","two","three"};
const char* gnames[] = {"oneadmin","oneadmin","users"};


const string names[] = {"Image one", "Second Image", "The third image"};

const string templates[] =
{
    "NAME          = \"Image one\"\n"
    "PATH = /tmp/image_test\n"
    "PERSISTENT    = YES\n"
    "DESCRIPTION   = \"This is a very long description of an image, and to achieve the longness I will copy this over. This is a very long description of an image, and to achieve the longness I will copy this over. And over. This is a very long description of an image, and to achieve the longness I will copy this over. And over. This is a very long description of an image, and to achieve the longness I will copy this over. And over.This is a very long description of an image, and to achieve the longness I will copy this over.\"\n",

    "NAME          = \"Second Image\"\n"
    "PATH = /tmp/image_second_test\n"
    "DESCRIPTION   = \"This is a rather short description.\"\n",

    "NAME          = \"The third image\"\n"
    "PATH = /tmp/image_test\n"
    "# DESCRIPTION   = \"An image description\"\n"
    "BUS           = SCSI\n"
    "PROFILE       = STUDENT\n"
};

const string xmls[] =
{
"<IMAGE><ID>0</ID><UID>0</UID><GID>1</GID><UNAME>one</UNAME><GNAME>oneadmin</GNAME><NAME>Image one</NAME><PERMISSIONS><OWNER_U>1</OWNER_U><OWNER_M>1</OWNER_M><OWNER_A>0</OWNER_A><GROUP_U>0</GROUP_U><GROUP_M>0</GROUP_M><GROUP_A>0</GROUP_A><OTHER_U>0</OTHER_U><OTHER_M>0</OTHER_M><OTHER_A>0</OTHER_A></PERMISSIONS><TYPE>0</TYPE><PERSISTENT>1</PERSISTENT><REGTIME>0000000000</REGTIME><SOURCE></SOURCE><PATH>/tmp/image_test</PATH><FSTYPE></FSTYPE><SIZE>0</SIZE><STATE>4</STATE><RUNNING_VMS>0</RUNNING_VMS><DATASTORE_ID>0</DATASTORE_ID><DATASTORE>none</DATASTORE><TEMPLATE><DESCRIPTION><![CDATA[This is a very long description of an image, and to achieve the longness I will copy this over. This is a very long description of an image, and to achieve the longness I will copy this over. And over. This is a very long description of an image, and to achieve the longness I will copy this over. And over. This is a very long description of an image, and to achieve the longness I will copy this over. And over.This is a very long description of an image, and to achieve the longness I will copy this over.]]></DESCRIPTION><DEV_PREFIX><![CDATA[hd]]></DEV_PREFIX></TEMPLATE></IMAGE>",

"<IMAGE><ID>1</ID><UID>1</UID><GID>1</GID><UNAME>two</UNAME><GNAME>oneadmin</GNAME><NAME>Second Image</NAME><PERMISSIONS><OWNER_U>1</OWNER_U><OWNER_M>1</OWNER_M><OWNER_A>0</OWNER_A><GROUP_U>0</GROUP_U><GROUP_M>0</GROUP_M><GROUP_A>0</GROUP_A><OTHER_U>0</OTHER_U><OTHER_M>0</OTHER_M><OTHER_A>0</OTHER_A></PERMISSIONS><TYPE>0</TYPE><PERSISTENT>0</PERSISTENT><REGTIME>0000000000</REGTIME><SOURCE></SOURCE><PATH>/tmp/image_second_test</PATH><FSTYPE></FSTYPE><SIZE>0</SIZE><STATE>4</STATE><RUNNING_VMS>0</RUNNING_VMS><DATASTORE_ID>0</DATASTORE_ID><DATASTORE>none</DATASTORE><TEMPLATE><DESCRIPTION><![CDATA[This is a rather short description.]]></DESCRIPTION><DEV_PREFIX><![CDATA[hd]]></DEV_PREFIX></TEMPLATE></IMAGE>",

"<IMAGE><ID>0</ID><UID>2</UID><GID>1</GID><UNAME>three</UNAME><GNAME>users</GNAME><NAME>The third image</NAME><PERMISSIONS><OWNER_U>1</OWNER_U><OWNER_M>1</OWNER_M><OWNER_A>0</OWNER_A><GROUP_U>0</GROUP_U><GROUP_M>0</GROUP_M><GROUP_A>0</GROUP_A><OTHER_U>0</OTHER_U><OTHER_M>0</OTHER_M><OTHER_A>0</OTHER_A></PERMISSIONS><TYPE>0</TYPE><PERSISTENT>0</PERSISTENT><REGTIME>0000000000</REGTIME><SOURCE></SOURCE><PATH>/tmp/image_test</PATH><FSTYPE></FSTYPE><SIZE>0</SIZE><STATE>4</STATE><RUNNING_VMS>0</RUNNING_VMS><DATASTORE_ID>0</DATASTORE_ID><DATASTORE>none</DATASTORE><TEMPLATE><BUS><![CDATA[SCSI]]></BUS><DEV_PREFIX><![CDATA[hd]]></DEV_PREFIX><PROFILE><![CDATA[STUDENT]]></PROFILE></TEMPLATE></IMAGE>",
};


// This xml dump result has the STIMEs modified to 0000000000
const string xml_dump =
"<IMAGE_POOL><IMAGE><ID>0</ID><UID>0</UID><GID>1</GID><UNAME>one</UNAME><GNAME>oneadmin</GNAME><NAME>Image one</NAME><PERMISSIONS><OWNER_U>1</OWNER_U><OWNER_M>1</OWNER_M><OWNER_A>0</OWNER_A><GROUP_U>0</GROUP_U><GROUP_M>0</GROUP_M><GROUP_A>0</GROUP_A><OTHER_U>0</OTHER_U><OTHER_M>0</OTHER_M><OTHER_A>0</OTHER_A></PERMISSIONS><TYPE>0</TYPE><PERSISTENT>1</PERSISTENT><REGTIME>0000000000</REGTIME><SOURCE></SOURCE><PATH>/tmp/image_test</PATH><FSTYPE></FSTYPE><SIZE>0</SIZE><STATE>4</STATE><RUNNING_VMS>0</RUNNING_VMS><DATASTORE_ID>0</DATASTORE_ID><DATASTORE>none</DATASTORE><TEMPLATE><DESCRIPTION><![CDATA[This is a very long description of an image, and to achieve the longness I will copy this over. This is a very long description of an image, and to achieve the longness I will copy this over. And over. This is a very long description of an image, and to achieve the longness I will copy this over. And over. This is a very long description of an image, and to achieve the longness I will copy this over. And over.This is a very long description of an image, and to achieve the longness I will copy this over.]]></DESCRIPTION><DEV_PREFIX><![CDATA[hd]]></DEV_PREFIX></TEMPLATE></IMAGE><IMAGE><ID>1</ID><UID>1</UID><GID>1</GID><UNAME>two</UNAME><GNAME>oneadmin</GNAME><NAME>Second Image</NAME><PERMISSIONS><OWNER_U>1</OWNER_U><OWNER_M>1</OWNER_M><OWNER_A>0</OWNER_A><GROUP_U>0</GROUP_U><GROUP_M>0</GROUP_M><GROUP_A>0</GROUP_A><OTHER_U>0</OTHER_U><OTHER_M>0</OTHER_M><OTHER_A>0</OTHER_A></PERMISSIONS><TYPE>0</TYPE><PERSISTENT>0</PERSISTENT><REGTIME>0000000000</REGTIME><SOURCE></SOURCE><PATH>/tmp/image_second_test</PATH><FSTYPE></FSTYPE><SIZE>0</SIZE><STATE>4</STATE><RUNNING_VMS>0</RUNNING_VMS><DATASTORE_ID>0</DATASTORE_ID><DATASTORE>none</DATASTORE><TEMPLATE><DESCRIPTION><![CDATA[This is a rather short description.]]></DESCRIPTION><DEV_PREFIX><![CDATA[hd]]></DEV_PREFIX></TEMPLATE></IMAGE><IMAGE><ID>2</ID><UID>2</UID><GID>1</GID><UNAME>three</UNAME><GNAME>users</GNAME><NAME>The third image</NAME><PERMISSIONS><OWNER_U>1</OWNER_U><OWNER_M>1</OWNER_M><OWNER_A>0</OWNER_A><GROUP_U>0</GROUP_U><GROUP_M>0</GROUP_M><GROUP_A>0</GROUP_A><OTHER_U>0</OTHER_U><OTHER_M>0</OTHER_M><OTHER_A>0</OTHER_A></PERMISSIONS><TYPE>0</TYPE><PERSISTENT>0</PERSISTENT><REGTIME>0000000000</REGTIME><SOURCE></SOURCE><PATH>/tmp/image_test</PATH><FSTYPE></FSTYPE><SIZE>0</SIZE><STATE>4</STATE><RUNNING_VMS>0</RUNNING_VMS><DATASTORE_ID>0</DATASTORE_ID><DATASTORE>none</DATASTORE><TEMPLATE><BUS><![CDATA[SCSI]]></BUS><DEV_PREFIX><![CDATA[hd]]></DEV_PREFIX><PROFILE><![CDATA[STUDENT]]></PROFILE></TEMPLATE></IMAGE></IMAGE_POOL>";

const string xml_dump_where =
"<IMAGE_POOL><IMAGE><ID>0</ID><UID>0</UID><GID>1</GID><UNAME>one</UNAME><GNAME>oneadmin</GNAME><NAME>Image one</NAME><PERMISSIONS><OWNER_U>1</OWNER_U><OWNER_M>1</OWNER_M><OWNER_A>0</OWNER_A><GROUP_U>0</GROUP_U><GROUP_M>0</GROUP_M><GROUP_A>0</GROUP_A><OTHER_U>0</OTHER_U><OTHER_M>0</OTHER_M><OTHER_A>0</OTHER_A></PERMISSIONS><TYPE>0</TYPE><PERSISTENT>1</PERSISTENT><REGTIME>0000000000</REGTIME><SOURCE></SOURCE><PATH>/tmp/image_test</PATH><FSTYPE></FSTYPE><SIZE>0</SIZE><STATE>4</STATE><RUNNING_VMS>0</RUNNING_VMS><DATASTORE_ID>0</DATASTORE_ID><DATASTORE>none</DATASTORE><TEMPLATE><DESCRIPTION><![CDATA[This is a very long description of an image, and to achieve the longness I will copy this over. This is a very long description of an image, and to achieve the longness I will copy this over. And over. This is a very long description of an image, and to achieve the longness I will copy this over. And over. This is a very long description of an image, and to achieve the longness I will copy this over. And over.This is a very long description of an image, and to achieve the longness I will copy this over.]]></DESCRIPTION><DEV_PREFIX><![CDATA[hd]]></DEV_PREFIX></TEMPLATE></IMAGE><IMAGE><ID>1</ID><UID>1</UID><GID>1</GID><UNAME>two</UNAME><GNAME>oneadmin</GNAME><NAME>Second Image</NAME><PERMISSIONS><OWNER_U>1</OWNER_U><OWNER_M>1</OWNER_M><OWNER_A>0</OWNER_A><GROUP_U>0</GROUP_U><GROUP_M>0</GROUP_M><GROUP_A>0</GROUP_A><OTHER_U>0</OTHER_U><OTHER_M>0</OTHER_M><OTHER_A>0</OTHER_A></PERMISSIONS><TYPE>0</TYPE><PERSISTENT>0</PERSISTENT><REGTIME>0000000000</REGTIME><SOURCE></SOURCE><PATH>/tmp/image_second_test</PATH><FSTYPE></FSTYPE><SIZE>0</SIZE><STATE>4</STATE><RUNNING_VMS>0</RUNNING_VMS><DATASTORE_ID>0</DATASTORE_ID><DATASTORE>none</DATASTORE><TEMPLATE><DESCRIPTION><![CDATA[This is a rather short description.]]></DESCRIPTION><DEV_PREFIX><![CDATA[hd]]></DEV_PREFIX></TEMPLATE></IMAGE></IMAGE_POOL>";

/* ************************************************************************* */
/* ************************************************************************* */

#include "NebulaTest.h"

class NebulaTestImage: public NebulaTest
{
public:
    NebulaTestImage():NebulaTest()
    {
        NebulaTest::the_tester = this;

        need_image_pool = true;
        need_imagem     = true;
        need_datastore_pool = true;
    }
};


class ImagePoolFriend : public ImagePool
{
public:
    ImagePoolFriend(SqlDB *                     db,
                    const string&               _default_type,
                    const string&               _default_dev_prefix,
                    vector<const Attribute *>   _restricted_attrs):

                    ImagePool(  db,
                                _default_type,
                                _default_dev_prefix,
                                _restricted_attrs){};


    int allocate(const int& uid, const std::string& stemplate, int* oid)
    {
        ImageTemplate * img_template;
        char *          error_msg = 0;
        int             rc;
        string          err;

        img_template = new ImageTemplate;
        rc = img_template->parse(stemplate,&error_msg);

        if( rc == 0 )
        {
            string uname = unames[uid];
            string gname = gnames[uid];

            return ImagePool::allocate(uid, 1, uname, gname, 
                        img_template, 0,"none", "", oid, err);
        }
        else
        {
            if (error_msg != 0 )
            {
                free(error_msg);
            }

            delete img_template;
            return -2;
        }
    };
};


/* ************************************************************************* */
/* ************************************************************************* */

class ImagePoolTest : public PoolTest
{
    CPPUNIT_TEST_SUITE (ImagePoolTest);

    ALL_POOLTEST_CPPUNIT_TESTS();

    CPPUNIT_TEST ( names_initialization );
    CPPUNIT_TEST ( update );
    CPPUNIT_TEST ( duplicates );
    CPPUNIT_TEST ( extra_attributes );
    CPPUNIT_TEST ( wrong_templates );
    CPPUNIT_TEST ( target_generation );
    CPPUNIT_TEST ( bus_source_assignment );
    CPPUNIT_TEST ( persistence );
    CPPUNIT_TEST ( imagepool_disk_attribute );
    CPPUNIT_TEST ( dump );
    CPPUNIT_TEST ( dump_where );
    CPPUNIT_TEST ( get_using_name );
    CPPUNIT_TEST ( wrong_get_name );
    CPPUNIT_TEST ( name_index );
    CPPUNIT_TEST ( chown_name_index );

    CPPUNIT_TEST_SUITE_END ();

protected:

    NebulaTestImage * tester;
    ImagePool *       ipool;
    ImageManager *    imagem;

    void bootstrap(SqlDB* db)
    {
        // setUp overwritten
    };

    PoolSQL* create_pool(SqlDB* db)
    {
        // setUp overwritten
        return ipool;
    };

    int allocate(int index)
    {
        int oid;
        return ((ImagePoolFriend*)pool)->allocate(uids[index],
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
        fix_regtimes(xml_str);

//*
        if( xml_str != xmls[index] )
        {
            cout << endl << xml_str << endl << xmls[index] << endl;
        }
//*/

        CPPUNIT_ASSERT( ((Image*)obj)->get_name() == names[index] );
        CPPUNIT_ASSERT( xml_str == xmls[index]);
    };

public:
    ImagePoolTest(){xmlInitParser();};

    ~ImagePoolTest(){xmlCleanupParser();};

    void setUp()
    {
        create_db();

        tester = new NebulaTestImage();

        Nebula& neb = Nebula::instance();
        neb.start();

        ipool   = neb.get_ipool();
        imagem  = neb.get_imagem();

        pool    = ipool;
    };

    void tearDown()
    {
        // -----------------------------------------------------------
        // Stop the managers & free resources
        // -----------------------------------------------------------

        imagem->finalize();
        pthread_join(imagem->get_thread_id(),0);

        //XML Library
        xmlCleanupParser();

        delete_db();

        delete tester;
    };
    /* ********************************************************************* */

    void names_initialization()
    {
        ImagePool * imp;
        Image *     img;

        // Allocate 2 images, so they are written to the DB.
        allocate(0);
        allocate(2);

        // Create a new pool, using the same DB. This new pool should read the
        // allocated images.
        vector<const Attribute *> restricted_attrs;
        imp = new ImagePool(db,"OS", "hd", restricted_attrs);

        img = imp->get(0, false);
        CPPUNIT_ASSERT( img != 0 );

        img = imp->get(2, false);
        CPPUNIT_ASSERT( img == 0 );

        img = imp->get(1, false);
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
        img->replace_template_attribute(description_name, new_description);
        img->replace_template_attribute(attr_name,        new_attr_value);
        img->remove_template_attribute("PATH");

        ip->update(img);

        img->unlock();

        img = ip->get(oid_1,false);
        CPPUNIT_ASSERT( img != 0 );


        img->get_template_attribute("DESCRIPTION",   description_val);
        img->get_template_attribute("NEW_ATTRIBUTE", attr_val);
        img->get_template_attribute("PATH", no_value);

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
        img->get_template_attribute("PATH", no_value);

        CPPUNIT_ASSERT( description_val == new_description );
        CPPUNIT_ASSERT( attr_val        == new_attr_value );
        CPPUNIT_ASSERT( no_value        == "" );
    };

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

    void duplicates()
    {
        int rc, oid;
        ImagePoolFriend * imp = static_cast<ImagePoolFriend *>(pool);

        // Allocate an image.
        rc = imp->allocate(uids[0], templates[0], &oid);
        CPPUNIT_ASSERT( oid == 0 );
        CPPUNIT_ASSERT( oid == rc );

        // Try to allocate twice the same image, shouldn't work
        rc = imp->allocate(uids[0], templates[0], &oid);
        CPPUNIT_ASSERT( rc  == -1 );
        CPPUNIT_ASSERT( oid == -1 );

        // Try again, this time with different uid. Should be allowed
        rc = imp->allocate(uids[1], templates[0], &oid);
        CPPUNIT_ASSERT( rc  >= 0 );
        CPPUNIT_ASSERT( oid == 1 );
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
        ImagePoolFriend * imp = static_cast<ImagePoolFriend *>(pool);

        string templates[] =
        {
            "PATH  = /tmp/image_test\n"
            "DESCRIPTION    = \"This template lacks name!\"\n",

            "NAME           = \"name A\"\n"
            "PATH  = /tmp/image_test\n"
            "TYPE           = WRONG\n",

            "NAME           \"PARSE ERROR\"\n"
            "TYPE           = WRONG\n",

            "END"
        };

        int results[] = { -1, -1, -1 };

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
        ImagePoolFriend *         imp = static_cast<ImagePoolFriend *>(pool);
        Image *             img;

        VectorAttribute *   disk;
        int                 oid;
        string              value;
        int                 index=0;
        Image::ImageType    img_type;

        disk = new VectorAttribute("DISK");

        // Allocate an OS type image
        oid = allocate(0);
        img = imp->get(oid, false);

        CPPUNIT_ASSERT( img != 0 );
        CPPUNIT_ASSERT( oid == 0 );

        img->set_state(Image::READY);
        img->disk_attribute(disk, &index, &img_type);

        value = disk->vector_value("TARGET");

        CPPUNIT_ASSERT( value == "hda" );
        CPPUNIT_ASSERT( img_type == Image::OS );

        // clean up
        delete disk;
        value = "";

        disk = new VectorAttribute("DISK");

        // Allocate a CDROM type image
        string templ = "NAME = \"name A\" TYPE = CDROM PATH = /tmp";
        imp->allocate(0, templ, &oid);

        CPPUNIT_ASSERT(oid >= 0);

        img = imp->get(oid, false);
        CPPUNIT_ASSERT( img != 0 );

        img->set_state(Image::READY);
        img->disk_attribute(disk, &index, &img_type);

        value = disk->vector_value("TARGET");
        CPPUNIT_ASSERT(value == "hdc");
        CPPUNIT_ASSERT( img_type == Image::CDROM );

        // clean up
        delete disk;
        value = "";

        disk = new VectorAttribute("DISK");

        // Allocate a DATABLOCK type image
        templ = "NAME = \"name B\" TYPE = DATABLOCK PATH=\"/dev/null\"";
        imp->allocate(0, templ, &oid);

        CPPUNIT_ASSERT(oid >= 0);

        img = imp->get(oid, false);
        CPPUNIT_ASSERT( img != 0 );

        img->set_state(Image::READY);
        img->disk_attribute(disk, &index, &img_type);

        value = disk->vector_value("TARGET");
        CPPUNIT_ASSERT(value == "hde");
        CPPUNIT_ASSERT( img_type == Image::DATABLOCK );

        // clean up
        delete disk;
        value = "";

        disk = new VectorAttribute("DISK");

        // Allocate a DATABLOCK type image
        templ = "NAME = \"name C\" TYPE = DATABLOCK DEV_PREFIX = \"sd\""
                " SIZE=4 FSTYPE=ext3";
        imp->allocate(0, templ, &oid);

        CPPUNIT_ASSERT(oid >= 0);

        img = imp->get(oid, false);
        CPPUNIT_ASSERT( img != 0 );

        img->set_state(Image::READY);
        img->disk_attribute(disk, &index, &img_type);

        value = disk->vector_value("TARGET");
        CPPUNIT_ASSERT(value == "sdf");

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
        int                 rc, oid;
        string              value;
        int                 index = 0;
        Image::ImageType    img_type;

        // Allocate an OS type image
        oid = allocate(0);
        img = imp->get(oid, false);
        CPPUNIT_ASSERT( img != 0 );

        // ---------------------------------------------------------------------
        // A disk without a BUS attribute should not have it added.
        disk = new VectorAttribute("DISK");

        img->set_state(Image::READY);
        rc = img->disk_attribute(disk, &index, &img_type);
        CPPUNIT_ASSERT( rc == 0 );

        value = "";
        value = disk->vector_value("BUS");
        CPPUNIT_ASSERT( value == "" );

        value = "";
        value = disk->vector_value("SOURCE");
        CPPUNIT_ASSERT( value == "" );

        // clean up
        //img->release_image();
        delete disk;

        // ---------------------------------------------------------------------
        // A disk with a BUS attribute should not have it overwritten.
        disk = new VectorAttribute("DISK");
        disk->replace("BUS", "SCSI");

        img->set_state(Image::READY);
        rc = img->disk_attribute(disk, &index, &img_type);
        CPPUNIT_ASSERT( rc == 0 );

        value = disk->vector_value("BUS");
        CPPUNIT_ASSERT( value == "SCSI" );

        value = "";
        value = disk->vector_value("SOURCE");
        CPPUNIT_ASSERT( value == "" );

        // clean up
        delete disk;
    }

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

    void imagepool_disk_attribute()
    {
        ImagePoolFriend *   imp = static_cast<ImagePoolFriend *>(pool);
        Image *             img;

        VectorAttribute *   disk;
        int                 oid_0, oid_1, index, img_id;
        string              value, error;
        Image::ImageType    img_type;

        // ---------------------------------------------------------------------
        // Allocate 2 images, with different dev_prefix

        string template_0 = "NAME          = \"Image 0\"\n"
                            "DEV_PREFIX    = \"hd\"\n"
                            "PATH          = /dev/null\n";

        string template_1 = "NAME          = \"Image 1\"\n"
                            "DEV_PREFIX    = \"sd\"\n"
                            "PATH          = /dev/null\n";


        imp->allocate(0, template_0, &oid_0);
        CPPUNIT_ASSERT( oid_0 == 0 );

        imp->allocate(0, template_1, &oid_1);
        CPPUNIT_ASSERT( oid_1 == 1 );


        img = imp->get(oid_0, false);
        CPPUNIT_ASSERT( img != 0 );
        img->set_state(Image::READY);

        img = imp->get(oid_1, false);
        CPPUNIT_ASSERT( img != 0 );
        img->set_state(Image::READY);


        // Disk using image 0
        disk = new VectorAttribute("DISK");
        disk->replace("IMAGE_ID", "0");

        ((ImagePool*)imp)->disk_attribute(disk, 0, &index, &img_type,0, img_id,error);

        value = "";
        value = disk->vector_value("TARGET");
        CPPUNIT_ASSERT( value == "hda" );


        delete disk;


        // Disk using image 1 index
        disk = new VectorAttribute("DISK");
        disk->replace("IMAGE_ID", "1");

        ((ImagePool*)imp)->disk_attribute(disk, 0, &index, &img_type,0, img_id,error);

        value = "";
        value = disk->vector_value("TARGET");
        CPPUNIT_ASSERT( value == "sda" );

        value = "";
        value = disk->vector_value("IMAGE");
        CPPUNIT_ASSERT( value == "Image 1" );

        delete disk;
    }

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

    void persistence()
    {
        int     oid;
        int     success;
        string  error_msg;
        ImagePoolFriend * imp = static_cast<ImagePoolFriend *>(pool);
        Image *           img;

        string templates [] =
        {
            "NAME       = \"Image 1\"\n"
            "PERSISTENT = NO\n"
            "PATH       = /dev/null\n",

            "NAME       = \"Image 2\"\n"
            "PERSISTENT = NO\n"
            "PATH       = /dev/null\n",

            "NAME       = \"Image 3\"\n"
            "PERSISTENT = YES\n"
            "PATH       = /dev/null\n",

            "END"
        };

        bool persistent[]   = { false, false, true };

        int i = 0;
        while( templates[i] != "END" )
        {
            imp->allocate(0, templates[i], &oid);

            CPPUNIT_ASSERT( oid >= 0 );

            img = imp->get( oid, false );
            CPPUNIT_ASSERT( img != 0 );

            CPPUNIT_ASSERT( img->isPersistent() == persistent[i] );

            i++;
        }

        // img 0 is not persistent
        img = imp->get( 0, false );
        CPPUNIT_ASSERT( img != 0 );

        // make it persistent
        success = img->persistent(true, error_msg);
        CPPUNIT_ASSERT( success == 0 );
        CPPUNIT_ASSERT( img->isPersistent() == true );

        // it isn't public, try to unpublish
        success = img->set_permissions(1,1,0, 0,0,0, 0,0,0, error_msg);
        CPPUNIT_ASSERT( success == 0 );
        CPPUNIT_ASSERT( img->isPublic() == false );

        // try to publish, should fail because it is persistent
        success = img->set_permissions(1,1,0, 1,0,0, 0,0,0, error_msg);
        CPPUNIT_ASSERT( success == -1 );
        CPPUNIT_ASSERT( img->isPublic() == false );


        // make it non-persistent
        success = img->persistent(false, error_msg);
        CPPUNIT_ASSERT( success == 0 );
        CPPUNIT_ASSERT( img->isPersistent() == false );

        // it isn't public, try to unpublish
        success = img->set_permissions(1,1,0, 0,0,0, 0,0,0, error_msg);
        CPPUNIT_ASSERT( success == 0 );
        CPPUNIT_ASSERT( img->isPublic() == false );

        // try to publish, now it should be possible
        success = img->set_permissions(1,1,0, 1,0,0, 0,0,0, error_msg);
        CPPUNIT_ASSERT( success == 0 );
        CPPUNIT_ASSERT( img->isPublic() == true );
    }

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

    void dump()
    {
        ImagePool * imp = static_cast<ImagePool*>(pool);

        ostringstream oss;
        int rc;
        string nan;

        allocate(0);
        allocate(1);
        allocate(2);

        rc = imp->dump(oss,nan);
        CPPUNIT_ASSERT(rc == 0);

        string result = oss.str();
        fix_regtimes(result);

//*
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
        ImagePool * imp = static_cast<ImagePool*>(pool);

        int rc;
        ostringstream oss;
        ostringstream where;

        allocate(0);
        allocate(1);
        allocate(2);

        where << "uid < 2";

        rc = imp->dump(oss, where.str());
        CPPUNIT_ASSERT(rc == 0);

        string result = oss.str();
        fix_regtimes(result);

//*
        if( result != xml_dump_where )
        {
            cout << endl << result << endl << xml_dump_where << endl;
        }
//*/

        CPPUNIT_ASSERT( result == xml_dump_where );
    }

    /* ********************************************************************* */

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
        obj = imp->get(names[1], uids[1], true);
        CPPUNIT_ASSERT( obj != 0 );
        obj->unlock();

        check(1, obj);


        // ---------------------------------
        // Clean the cache, forcing the pool to read the objects from the DB
        pool->clean();

        // Get first object and check its integrity
        obj = imp->get(names[0], uids[0], false);
        check(0, obj);

        // Get using its name
        obj = imp->get(oid_1, false);
        check(1, obj);
    };

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

    void wrong_get_name()
    {
        ImagePool * imp = static_cast<ImagePool *>(pool);

        // The pool is empty
        // Non existing name
        obj = imp->get("Wrong name", 0, true);
        CPPUNIT_ASSERT( obj == 0 );

        // Allocate an object
        allocate(0);

        // Ask again for a non-existing name
        obj = imp->get("Non existing name",uids[0], true);
        CPPUNIT_ASSERT( obj == 0 );
    }

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

    void name_index()
    {
        Image   *img_oid, *img_name;
        int     oid_0;
        int     uid_0;
        string  name_0;

        oid_0 = allocate(0);

        CPPUNIT_ASSERT(oid_0 != -1);


        // ---------------------------------
        // Get by oid
        img_oid = ipool->get(oid_0, true);
        CPPUNIT_ASSERT(img_oid != 0);

        name_0 = img_oid->get_name();
        uid_0  = img_oid->get_uid();

        img_oid->unlock();

        // Get by name and check it is the same object
        img_name = ipool->get(name_0, uid_0, true);
        CPPUNIT_ASSERT(img_name != 0);
        img_name->unlock();

        CPPUNIT_ASSERT(img_oid == img_name);

        // ---------------------------------
        // Clean the cache, forcing the pool to read the objects from the DB
        ipool->clean();

        // Get by oid
        img_oid = ipool->get(oid_0, true);
        CPPUNIT_ASSERT(img_oid != 0);
        img_oid->unlock();

        // Get by name and check it is the same object
        img_name = ipool->get(name_0, uid_0, true);
        CPPUNIT_ASSERT(img_name != 0);
        img_name->unlock();

        CPPUNIT_ASSERT(img_oid == img_name);

        // ---------------------------------
        // Clean the cache, forcing the pool to read the objects from the DB
        ipool->clean();

        // Get by name
        img_name = ipool->get(name_0, uid_0, true);
        CPPUNIT_ASSERT(img_name != 0);
        img_name->unlock();

        // Get by oid and check it is the same object
        img_oid = ipool->get(oid_0, true);
        CPPUNIT_ASSERT(img_oid != 0);
        img_oid->unlock();

        CPPUNIT_ASSERT(img_oid == img_name);
    }

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

    void chown_name_index()
    {
        Image   *img_oid, *img_name;
        int     oid;
        int     old_uid;
        int     new_uid = 3456;
        string  name;

        oid = allocate(0);

        CPPUNIT_ASSERT(oid != -1);


        // ---------------------------------
        // Get by oid
        img_oid = ipool->get(oid, true);
        CPPUNIT_ASSERT(img_oid != 0);

        name = img_oid->get_name();
        old_uid  = img_oid->get_uid();

        // Change owner and update cache index
        img_oid->set_user(new_uid, "new_username");
        ipool->update(img_oid);
        img_oid->unlock();

        ipool->update_cache_index(name, old_uid, name, new_uid);

        // Get by name, new_uid and check it is the same object
        img_name = ipool->get(name, new_uid, true);
        CPPUNIT_ASSERT(img_name != 0);
        img_name->unlock();

        CPPUNIT_ASSERT(img_oid == img_name);

        // Get by name, old_uid and check it does not exist
        img_name = ipool->get(name, old_uid, true);
        CPPUNIT_ASSERT(img_name == 0);

        // ---------------------------------
        // Clean the cache, forcing the pool to read the objects from the DB
        ipool->clean();


        // Get by name, old_uid and check it does not exist
        img_name = ipool->get(name, old_uid, true);
        CPPUNIT_ASSERT(img_name == 0);

        // Get by oid
        img_oid = ipool->get(oid, true);
        CPPUNIT_ASSERT(img_oid != 0);
        img_oid->unlock();

        // Get by name, new_uid and check it is the same object
        img_name = ipool->get(name, new_uid, true);
        CPPUNIT_ASSERT(img_name != 0);
        img_name->unlock();

        CPPUNIT_ASSERT(img_oid == img_name);
    }
};

/* ************************************************************************* */
/* ************************************************************************* */

int main(int argc, char ** argv)
{
    return PoolTest::main(argc, argv, ImagePoolTest::suite());
}
