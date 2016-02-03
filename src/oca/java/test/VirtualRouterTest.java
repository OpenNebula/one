/*******************************************************************************
 * Copyright 2002-2015, OpenNebula Project, OpenNebula Systems
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
import org.opennebula.client.vrouter.*;
import org.opennebula.client.vm.*;
import org.opennebula.client.user.User;
import org.opennebula.client.vm.VirtualMachine;



public class VirtualRouterTest
{
    private static VirtualRouter vrouter;
    private static VirtualRouterPool vrouterPool;

    private static Client client;

    private static OneResponse res;
    private static String name = "new_test_vrouter";


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
        vrouterPool     = new VirtualRouterPool(client);
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
        res = VirtualRouter.allocate(client, template_str);

        int oid = res.isError() ? -1 : Integer.parseInt(res.getMessage());
        vrouter = new VirtualRouter(oid, client);
    }

    /**
     * @throws java.lang.Exception
     */
    @After
    public void tearDown() throws Exception
    {
        vrouter.delete();
    }

    @Test
    public void allocate()
    {
        vrouter.delete();

        res = VirtualRouter.allocate(client, template_str);
        assertTrue( res.getErrorMessage(), !res.isError() );

        int oid = res.isError() ? -1 : Integer.parseInt(res.getMessage());
        vrouter = new VirtualRouter(oid, client);


        vrouterPool.info();

        boolean found = false;
        for(VirtualRouter temp : vrouterPool)
        {
            found = found || temp.getName().equals(name);
        }

        assertTrue( found );
    }

    @Test
    public void info()
    {
        res = vrouter.info();
        assertTrue( res.getErrorMessage(), !res.isError() );

        assertTrue( vrouter.getName().equals(name) );
    }

    @Test
    public void publish()
    {
        res = vrouter.publish();
        assertTrue( res.getErrorMessage(), !res.isError() );

        vrouter.info();
        assertTrue( vrouter.xpath("PERMISSIONS/GROUP_U").equals("1") );
    }

    @Test
    public void unpublish()
    {
        res = vrouter.unpublish();
        assertTrue( res.getErrorMessage(), !res.isError() );

        vrouter.info();
        assertTrue( vrouter.xpath("PERMISSIONS/GROUP_U").equals("0") );
    }

    @Test
    public void chmod()
    {
        res = vrouter.info();
        assertTrue( res.getErrorMessage(), !res.isError() );

        String owner_a = vrouter.xpath("PERMISSIONS/OWNER_A");
        String group_a = vrouter.xpath("PERMISSIONS/GROUP_A");

        res = vrouter.chmod(0, 1, -1, 1, 0, -1, 1, 1, 0);
        assertTrue( res.getErrorMessage(), !res.isError() );

        res = vrouter.info();
        assertTrue( res.getErrorMessage(), !res.isError() );

        assertTrue( vrouter.xpath("PERMISSIONS/OWNER_U").equals("0") );
        assertTrue( vrouter.xpath("PERMISSIONS/OWNER_M").equals("1") );
        assertTrue( vrouter.xpath("PERMISSIONS/OWNER_A").equals(owner_a) );
        assertTrue( vrouter.xpath("PERMISSIONS/GROUP_U").equals("1") );
        assertTrue( vrouter.xpath("PERMISSIONS/GROUP_M").equals("0") );
        assertTrue( vrouter.xpath("PERMISSIONS/GROUP_A").equals(group_a) );
        assertTrue( vrouter.xpath("PERMISSIONS/OTHER_U").equals("1") );
        assertTrue( vrouter.xpath("PERMISSIONS/OTHER_M").equals("1") );
        assertTrue( vrouter.xpath("PERMISSIONS/OTHER_A").equals("0") );
    }

    @Test
    public void chmod_octet()
    {
        res = vrouter.info();
        assertTrue( res.getErrorMessage(), !res.isError() );

        res = vrouter.chmod(640);
        assertTrue( res.getErrorMessage(), !res.isError() );

        res = vrouter.info();
        assertTrue( res.getErrorMessage(), !res.isError() );

        assertTrue( vrouter.xpath("PERMISSIONS/OWNER_U").equals("1") );
        assertTrue( vrouter.xpath("PERMISSIONS/OWNER_M").equals("1") );
        assertTrue( vrouter.xpath("PERMISSIONS/OWNER_A").equals("0") );
        assertTrue( vrouter.xpath("PERMISSIONS/GROUP_U").equals("1") );
        assertTrue( vrouter.xpath("PERMISSIONS/GROUP_M").equals("0") );
        assertTrue( vrouter.xpath("PERMISSIONS/GROUP_A").equals("0") );
        assertTrue( vrouter.xpath("PERMISSIONS/OTHER_U").equals("0") );
        assertTrue( vrouter.xpath("PERMISSIONS/OTHER_M").equals("0") );
        assertTrue( vrouter.xpath("PERMISSIONS/OTHER_A").equals("0") );

        res = vrouter.chmod("147");
        assertTrue( res.getErrorMessage(), !res.isError() );

        res = vrouter.info();
        assertTrue( res.getErrorMessage(), !res.isError() );

        assertTrue( vrouter.xpath("PERMISSIONS/OWNER_U").equals("0") );
        assertTrue( vrouter.xpath("PERMISSIONS/OWNER_M").equals("0") );
        assertTrue( vrouter.xpath("PERMISSIONS/OWNER_A").equals("1") );
        assertTrue( vrouter.xpath("PERMISSIONS/GROUP_U").equals("1") );
        assertTrue( vrouter.xpath("PERMISSIONS/GROUP_M").equals("0") );
        assertTrue( vrouter.xpath("PERMISSIONS/GROUP_A").equals("0") );
        assertTrue( vrouter.xpath("PERMISSIONS/OTHER_U").equals("1") );
        assertTrue( vrouter.xpath("PERMISSIONS/OTHER_M").equals("1") );
        assertTrue( vrouter.xpath("PERMISSIONS/OTHER_A").equals("1") );
    }

    @Test
    public void attributes()
    {
        res = vrouter.info();
        assertTrue( res.getErrorMessage(), !res.isError() );

        assertTrue( vrouter.xpath("NAME").equals(name) );
    }

    @Test
    public void delete()
    {
        res = vrouter.delete();
        assertTrue( res.getErrorMessage(), !res.isError() );

        res = vrouter.info();
        assertTrue( res.isError() );
    }

    @Test
    public void chown()
    {
        // Create a new User and Group
        res = User.allocate(client, "template_test_user", "password");
        assertTrue( res.getErrorMessage(), !res.isError() );

        int uid = Integer.parseInt(res.getMessage());

        res = Group.allocate(client, "template_test_group");
        assertTrue( res.getErrorMessage(), !res.isError() );

        int gid = Integer.parseInt(res.getMessage());

        res = vrouter.info();
        assertTrue( res.getErrorMessage(), !res.isError() );

        assertTrue( vrouter.uid() == 0 );
        assertTrue( vrouter.gid() == 0 );

        res = vrouter.chown(uid, gid);
        assertTrue( res.getErrorMessage(), !res.isError() );

        res = vrouter.info();
        assertTrue( res.getErrorMessage(), !res.isError() );

        assertTrue( vrouter.uid() == uid );
        assertTrue( vrouter.gid() == gid );

        res = vrouter.chgrp(0);

        res = vrouter.info();
        assertTrue( res.getErrorMessage(), !res.isError() );

        assertTrue( vrouter.uid() == uid );
        assertTrue( vrouter.gid() == 0 );
    }

    @Test
    public void instantiate()
    {
        VirtualMachinePool vmPool = new VirtualMachinePool(client);

        res = vmPool.info();
        assertTrue( res.getErrorMessage(), !res.isError() );

        assertTrue( vmPool.getLength() == 0 );

        String tmpl_str =
            "NAME = vrtemplate\n"+
            "CPU = 0.1\n"+
            "MEMORY = 64\n";

        res = Template.allocate(client, tmpl_str);
        assertTrue( res.getErrorMessage(), !res.isError() );

        int tmplid = Integer.parseInt(res.getMessage());

        res = vrouter.instantiate(3, tmplid);
        assertTrue( res.getErrorMessage(), !res.isError() );

        res = vmPool.info();
        assertTrue( res.getErrorMessage(), !res.isError() );

        assertTrue( vmPool.getLength() == 3 );
    }
}
