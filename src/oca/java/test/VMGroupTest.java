/*******************************************************************************
 * Copyright 2002-2016, OpenNebula Project, OpenNebula Systems
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
import org.opennebula.client.vmgroup.*;
import org.opennebula.client.user.User;




public class VMGroupTest
{

    private static VMGroup vmg;
    private static VMGroupPool pool;

    private static Client client;

    private static OneResponse res;
    private static String name = "new_test_vmg";


    private static String template_str =
        "NAME = \"" + name + "\"\n" +
        "DESCRIPTION  = \"test vmgroup\"\n"+
        "ATT1 = \"VAL1\"\n" +
        "ATT2 = \"VAL2\"";

    /**
     * @throws java.lang.Exception
     */
    @BeforeClass
    public static void setUpBeforeClass() throws Exception
    {
        client  = new Client();
        pool    = new VMGroupPool(client);
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
        res = VMGroup.allocate(client, template_str);

        int oid = res.isError() ? -1 : Integer.parseInt(res.getMessage());
        vmg = new VMGroup(oid, client);
    }

    /**
     * @throws java.lang.Exception
     */
    @After
    public void tearDown() throws Exception
    {
        vmg.delete();
    }

    @Test
    public void allocate()
    {
        vmg.delete();

        res = VMGroup.allocate(client, template_str);
        assertTrue( res.getErrorMessage(), !res.isError() );

        int oid = res.isError() ? -1 : Integer.parseInt(res.getMessage());
        vmg = new VMGroup(oid, client);


        pool.info();

        boolean found = false;
        for(VMGroup temp : pool)
        {
            found = found || temp.getName().equals(name);
        }

        assertTrue( found );
    }

    @Test
    public void info()
    {
        res = vmg.info();
        assertTrue( res.getErrorMessage(), !res.isError() );

        assertTrue( vmg.getName().equals(name) );
    }

    @Test
    public void update()
    {
        res = vmg.info();
        assertTrue( res.getErrorMessage(), !res.isError() );

        assertTrue( vmg.xpath("TEMPLATE/ATT1").equals( "VAL1" ) );
        assertTrue( vmg.xpath("TEMPLATE/ATT2").equals( "VAL2" ) );

        String new_vmg =   "ATT2 = NEW_VAL\n" +
                                "ATT3 = VAL3";

        res = vmg.update(new_vmg);
        assertTrue( res.getErrorMessage(), !res.isError() );


        res = vmg.info();
        assertTrue( res.getErrorMessage(), !res.isError() );
        assertTrue( vmg.xpath("TEMPLATE/ATT1").equals( "" ) );
        assertTrue( vmg.xpath("TEMPLATE/ATT2").equals( "NEW_VAL" ) );
        assertTrue( vmg.xpath("TEMPLATE/ATT3").equals( "VAL3" ) );
    }

    @Test
    public void chmod()
    {
        res = vmg.info();
        assertTrue( res.getErrorMessage(), !res.isError() );

        String owner_a = vmg.xpath("PERMISSIONS/OWNER_A");
        String group_a = vmg.xpath("PERMISSIONS/GROUP_A");

        res = vmg.chmod(0, 1, -1, 1, 0, -1, 1, 1, 0);
        assertTrue( res.getErrorMessage(), !res.isError() );

        res = vmg.info();
        assertTrue( res.getErrorMessage(), !res.isError() );

        assertTrue( vmg.xpath("PERMISSIONS/OWNER_U").equals("0") );
        assertTrue( vmg.xpath("PERMISSIONS/OWNER_M").equals("1") );
        assertTrue( vmg.xpath("PERMISSIONS/OWNER_A").equals(owner_a) );
        assertTrue( vmg.xpath("PERMISSIONS/GROUP_U").equals("1") );
        assertTrue( vmg.xpath("PERMISSIONS/GROUP_M").equals("0") );
        assertTrue( vmg.xpath("PERMISSIONS/GROUP_A").equals(group_a) );
        assertTrue( vmg.xpath("PERMISSIONS/OTHER_U").equals("1") );
        assertTrue( vmg.xpath("PERMISSIONS/OTHER_M").equals("1") );
        assertTrue( vmg.xpath("PERMISSIONS/OTHER_A").equals("0") );
    }

    @Test
    public void chmod_octet()
    {
        res = vmg.info();
        assertTrue( res.getErrorMessage(), !res.isError() );

        res = vmg.chmod(640);
        assertTrue( res.getErrorMessage(), !res.isError() );

        res = vmg.info();
        assertTrue( res.getErrorMessage(), !res.isError() );

        assertTrue( vmg.xpath("PERMISSIONS/OWNER_U").equals("1") );
        assertTrue( vmg.xpath("PERMISSIONS/OWNER_M").equals("1") );
        assertTrue( vmg.xpath("PERMISSIONS/OWNER_A").equals("0") );
        assertTrue( vmg.xpath("PERMISSIONS/GROUP_U").equals("1") );
        assertTrue( vmg.xpath("PERMISSIONS/GROUP_M").equals("0") );
        assertTrue( vmg.xpath("PERMISSIONS/GROUP_A").equals("0") );
        assertTrue( vmg.xpath("PERMISSIONS/OTHER_U").equals("0") );
        assertTrue( vmg.xpath("PERMISSIONS/OTHER_M").equals("0") );
        assertTrue( vmg.xpath("PERMISSIONS/OTHER_A").equals("0") );

        res = vmg.chmod("147");
        assertTrue( res.getErrorMessage(), !res.isError() );

        res = vmg.info();
        assertTrue( res.getErrorMessage(), !res.isError() );

        assertTrue( vmg.xpath("PERMISSIONS/OWNER_U").equals("0") );
        assertTrue( vmg.xpath("PERMISSIONS/OWNER_M").equals("0") );
        assertTrue( vmg.xpath("PERMISSIONS/OWNER_A").equals("1") );
        assertTrue( vmg.xpath("PERMISSIONS/GROUP_U").equals("1") );
        assertTrue( vmg.xpath("PERMISSIONS/GROUP_M").equals("0") );
        assertTrue( vmg.xpath("PERMISSIONS/GROUP_A").equals("0") );
        assertTrue( vmg.xpath("PERMISSIONS/OTHER_U").equals("1") );
        assertTrue( vmg.xpath("PERMISSIONS/OTHER_M").equals("1") );
        assertTrue( vmg.xpath("PERMISSIONS/OTHER_A").equals("1") );
    }

    @Test
    public void attributes()
    {
        res = vmg.info();
        assertTrue( res.getErrorMessage(), !res.isError() );

//        assertTrue( vmg.xpath("ID").equals("0") );
        assertTrue( vmg.xpath("NAME").equals(name) );
    }

    @Test
    public void delete()
    {
        res = vmg.delete();
        assertTrue( res.getErrorMessage(), !res.isError() );

        res = vmg.info();
        assertTrue( res.isError() );
    }

    @Test
    public void chown()
    {
        // Create a new User and Group
        res = User.allocate(client, "vmg_test_user", "password");
        assertTrue( res.getErrorMessage(), !res.isError() );

        int uid = Integer.parseInt(res.getMessage());

        res = Group.allocate(client, "vmg_test_group");
        assertTrue( res.getErrorMessage(), !res.isError() );

        int gid = Integer.parseInt(res.getMessage());

        res = vmg.info();
        assertTrue( res.getErrorMessage(), !res.isError() );

        assertTrue( vmg.uid() == 0 );
        assertTrue( vmg.gid() == 0 );

        res = vmg.chown(uid, gid);
        assertTrue( res.getErrorMessage(), !res.isError() );

        res = vmg.info();
        assertTrue( res.getErrorMessage(), !res.isError() );

        assertTrue( vmg.uid() == uid );
        assertTrue( vmg.gid() == gid );

        res = vmg.chgrp(0);

        res = vmg.info();
        assertTrue( res.getErrorMessage(), !res.isError() );

        assertTrue( vmg.uid() == uid );
        assertTrue( vmg.gid() == 0 );
    }
}
