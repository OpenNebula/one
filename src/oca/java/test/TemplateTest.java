/*******************************************************************************
 * Copyright 2002-2012, OpenNebula Project Leads (OpenNebula.org)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 ******************************************************************************/
import static org.junit.Assert.assertTrue;

import org.junit.After;
import org.junit.AfterClass;
import org.junit.Before;
import org.junit.BeforeClass;
import org.junit.Test;
import org.opennebula.client.Client;
import org.opennebula.client.OneResponse;
import org.opennebula.client.group.Group;
import org.opennebula.client.template.*;
import org.opennebula.client.user.User;
import org.opennebula.client.vm.VirtualMachine;



public class TemplateTest
{

    private static Template template;
    private static TemplatePool templatePool;

    private static Client client;

    private static OneResponse res;
    private static String name = "new_test_template";


    private static String template_str =
        "NAME = \"" + name + "\"\n" +
        "ATT1 = \"VAL1\"\n" +
        "ATT2 = \"VAL2\"";

    /**
     * @throws java.lang.Exception
     */
    @BeforeClass
    public static void setUpBeforeClass() throws Exception
    {
        client          = new Client();
        templatePool    = new TemplatePool(client);
    }

    /**
     * @throws java.lang.Exception
     */
    @AfterClass
    public static void tearDownAfterClass() throws Exception
    {
    }

    /**
     * @throws java.lang.Exception
     */
    @Before
    public void setUp() throws Exception
    {
        res = Template.allocate(client, template_str);

        int oid = res.isError() ? -1 : Integer.parseInt(res.getMessage());
        template = new Template(oid, client);
    }

    /**
     * @throws java.lang.Exception
     */
    @After
    public void tearDown() throws Exception
    {
        template.delete();
    }

    @Test
    public void allocate()
    {
        template.delete();

        res = Template.allocate(client, template_str);
        assertTrue( !res.isError() );

        int oid = res.isError() ? -1 : Integer.parseInt(res.getMessage());
        template = new Template(oid, client);


        templatePool.info();

        boolean found = false;
        for(Template temp : templatePool)
        {
            found = found || temp.getName().equals(name);
        }

        assertTrue( found );
    }

    @Test
    public void info()
    {
        res = template.info();
        assertTrue( !res.isError() );

//        assertTrue( template.getId().equals("0") );
//        assertTrue( template.id() == 0 );
        assertTrue( template.getName().equals(name) );
    }

    @Test
    public void update()
    {
        res = template.info();
        assertTrue( !res.isError() );

        assertTrue( template.xpath("TEMPLATE/ATT1").equals( "VAL1" ) );
        assertTrue( template.xpath("TEMPLATE/ATT2").equals( "VAL2" ) );

        String new_template =   "ATT2 = NEW_VAL\n" +
                                "ATT3 = VAL3";

        res = template.update(new_template);
        assertTrue( !res.isError() );


        res = template.info();
        assertTrue( !res.isError() );
        assertTrue( template.xpath("TEMPLATE/ATT1").equals( "" ) );
        assertTrue( template.xpath("TEMPLATE/ATT2").equals( "NEW_VAL" ) );
        assertTrue( template.xpath("TEMPLATE/ATT3").equals( "VAL3" ) );
    }

    @Test
    public void publish()
    {
        res = template.publish();
        assertTrue( !res.isError() );

        template.info();
        assertTrue( template.xpath("PERMISSIONS/GROUP_U").equals("1") );
    }

    @Test
    public void unpublish()
    {
        res = template.unpublish();
        assertTrue( !res.isError() );

        template.info();
        assertTrue( template.xpath("PERMISSIONS/GROUP_U").equals("0") );
    }

    @Test
    public void chmod()
    {
        res = template.info();
        assertTrue( !res.isError() );

        String owner_a = template.xpath("PERMISSIONS/OWNER_A");
        String group_a = template.xpath("PERMISSIONS/GROUP_A");

        res = template.chmod(0, 1, -1, 1, 0, -1, 1, 1, 0);
        assertTrue( !res.isError() );

        res = template.info();
        assertTrue( !res.isError() );

        assertTrue( template.xpath("PERMISSIONS/OWNER_U").equals("0") );
        assertTrue( template.xpath("PERMISSIONS/OWNER_M").equals("1") );
        assertTrue( template.xpath("PERMISSIONS/OWNER_A").equals(owner_a) );
        assertTrue( template.xpath("PERMISSIONS/GROUP_U").equals("1") );
        assertTrue( template.xpath("PERMISSIONS/GROUP_M").equals("0") );
        assertTrue( template.xpath("PERMISSIONS/GROUP_A").equals(group_a) );
        assertTrue( template.xpath("PERMISSIONS/OTHER_U").equals("1") );
        assertTrue( template.xpath("PERMISSIONS/OTHER_M").equals("1") );
        assertTrue( template.xpath("PERMISSIONS/OTHER_A").equals("0") );
    }

    @Test
    public void chmod_octet()
    {
        res = template.info();
        assertTrue( !res.isError() );

        res = template.chmod(640);
        assertTrue( !res.isError() );

        res = template.info();
        assertTrue( !res.isError() );

        assertTrue( template.xpath("PERMISSIONS/OWNER_U").equals("1") );
        assertTrue( template.xpath("PERMISSIONS/OWNER_M").equals("1") );
        assertTrue( template.xpath("PERMISSIONS/OWNER_A").equals("0") );
        assertTrue( template.xpath("PERMISSIONS/GROUP_U").equals("1") );
        assertTrue( template.xpath("PERMISSIONS/GROUP_M").equals("0") );
        assertTrue( template.xpath("PERMISSIONS/GROUP_A").equals("0") );
        assertTrue( template.xpath("PERMISSIONS/OTHER_U").equals("0") );
        assertTrue( template.xpath("PERMISSIONS/OTHER_M").equals("0") );
        assertTrue( template.xpath("PERMISSIONS/OTHER_A").equals("0") );

        res = template.chmod("147");
        assertTrue( !res.isError() );

        res = template.info();
        assertTrue( !res.isError() );

        assertTrue( template.xpath("PERMISSIONS/OWNER_U").equals("0") );
        assertTrue( template.xpath("PERMISSIONS/OWNER_M").equals("0") );
        assertTrue( template.xpath("PERMISSIONS/OWNER_A").equals("1") );
        assertTrue( template.xpath("PERMISSIONS/GROUP_U").equals("1") );
        assertTrue( template.xpath("PERMISSIONS/GROUP_M").equals("0") );
        assertTrue( template.xpath("PERMISSIONS/GROUP_A").equals("0") );
        assertTrue( template.xpath("PERMISSIONS/OTHER_U").equals("1") );
        assertTrue( template.xpath("PERMISSIONS/OTHER_M").equals("1") );
        assertTrue( template.xpath("PERMISSIONS/OTHER_A").equals("1") );
    }
    
    @Test
    public void attributes()
    {
        res = template.info();
        assertTrue( !res.isError() );

//        assertTrue( template.xpath("ID").equals("0") );
        assertTrue( template.xpath("NAME").equals(name) );
    }

    @Test
    public void delete()
    {
        res = template.delete();
        assertTrue( !res.isError() );

        res = template.info();
        assertTrue( res.isError() );
    }

    @Test
    public void chown()
    {
        // Create a new User and Group
        res = User.allocate(client, "template_test_user", "password");
        assertTrue( !res.isError() );

        int uid = Integer.parseInt(res.getMessage());

        res = Group.allocate(client, "template_test_group");
        assertTrue( !res.isError() );

        int gid = Integer.parseInt(res.getMessage());

        res = template.info();
        assertTrue( !res.isError() );

        assertTrue( template.uid() == 0 );
        assertTrue( template.gid() == 0 );

        res = template.chown(uid, gid);
        assertTrue( !res.isError() );

        res = template.info();
        assertTrue( !res.isError() );

        assertTrue( template.uid() == uid );
        assertTrue( template.gid() == gid );

        res = template.chgrp(0);

        res = template.info();
        assertTrue( !res.isError() );

        assertTrue( template.uid() == uid );
        assertTrue( template.gid() == 0 );
    }

    @Test
    public void instantiate()
    {
        res = template.instantiate("new_vm_name");
        assertTrue( !res.isError() );

        int vm_id = Integer.parseInt(res.getMessage());
        VirtualMachine vm = new VirtualMachine(vm_id, client);

        res = vm.info();
        assertTrue( !res.isError() );

        assertTrue( vm.getName().equals( "new_vm_name" ) );
    }
}
