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
import org.opennebula.client.secgroup.*;
import org.opennebula.client.user.User;




public class SecurityGroupTest
{

    private static SecurityGroup sg;
    private static SecurityGroupPool pool;

    private static Client client;

    private static OneResponse res;
    private static String name = "new_test_sg";


    private static String template_str =
        "NAME = \"" + name + "\"\n" +
        "DESCRIPTION  = \"test security group\"\n"+
        "ATT1 = \"VAL1\"\n" +
        "ATT2 = \"VAL2\"";

    /**
     * @throws java.lang.Exception
     */
    @BeforeClass
    public static void setUpBeforeClass() throws Exception
    {
        client  = new Client();
        pool    = new SecurityGroupPool(client);
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
        res = SecurityGroup.allocate(client, template_str);

        int oid = res.isError() ? -1 : Integer.parseInt(res.getMessage());
        sg = new SecurityGroup(oid, client);
    }

    /**
     * @throws java.lang.Exception
     */
    @After
    public void tearDown() throws Exception
    {
        sg.delete();
    }

    @Test
    public void allocate()
    {
        sg.delete();

        res = SecurityGroup.allocate(client, template_str);
        assertTrue( res.getErrorMessage(), !res.isError() );

        int oid = res.isError() ? -1 : Integer.parseInt(res.getMessage());
        sg = new SecurityGroup(oid, client);


        pool.info();

        boolean found = false;
        for(SecurityGroup temp : pool)
        {
            found = found || temp.getName().equals(name);
        }

        assertTrue( found );
    }

    @Test
    public void info()
    {
        res = sg.info();
        assertTrue( res.getErrorMessage(), !res.isError() );

        assertTrue( sg.getName().equals(name) );
    }

    @Test
    public void update()
    {
        res = sg.info();
        assertTrue( res.getErrorMessage(), !res.isError() );

        assertTrue( sg.xpath("TEMPLATE/ATT1").equals( "VAL1" ) );
        assertTrue( sg.xpath("TEMPLATE/ATT2").equals( "VAL2" ) );

        String new_sg =   "ATT2 = NEW_VAL\n" +
                                "ATT3 = VAL3";

        res = sg.update(new_sg);
        assertTrue( res.getErrorMessage(), !res.isError() );


        res = sg.info();
        assertTrue( res.getErrorMessage(), !res.isError() );
        assertTrue( sg.xpath("TEMPLATE/ATT1").equals( "" ) );
        assertTrue( sg.xpath("TEMPLATE/ATT2").equals( "NEW_VAL" ) );
        assertTrue( sg.xpath("TEMPLATE/ATT3").equals( "VAL3" ) );
    }

    @Test
    public void chmod()
    {
        res = sg.info();
        assertTrue( res.getErrorMessage(), !res.isError() );

        String owner_a = sg.xpath("PERMISSIONS/OWNER_A");
        String group_a = sg.xpath("PERMISSIONS/GROUP_A");

        res = sg.chmod(0, 1, -1, 1, 0, -1, 1, 1, 0);
        assertTrue( res.getErrorMessage(), !res.isError() );

        res = sg.info();
        assertTrue( res.getErrorMessage(), !res.isError() );

        assertTrue( sg.xpath("PERMISSIONS/OWNER_U").equals("0") );
        assertTrue( sg.xpath("PERMISSIONS/OWNER_M").equals("1") );
        assertTrue( sg.xpath("PERMISSIONS/OWNER_A").equals(owner_a) );
        assertTrue( sg.xpath("PERMISSIONS/GROUP_U").equals("1") );
        assertTrue( sg.xpath("PERMISSIONS/GROUP_M").equals("0") );
        assertTrue( sg.xpath("PERMISSIONS/GROUP_A").equals(group_a) );
        assertTrue( sg.xpath("PERMISSIONS/OTHER_U").equals("1") );
        assertTrue( sg.xpath("PERMISSIONS/OTHER_M").equals("1") );
        assertTrue( sg.xpath("PERMISSIONS/OTHER_A").equals("0") );
    }

    @Test
    public void chmod_octet()
    {
        res = sg.info();
        assertTrue( res.getErrorMessage(), !res.isError() );

        res = sg.chmod(640);
        assertTrue( res.getErrorMessage(), !res.isError() );

        res = sg.info();
        assertTrue( res.getErrorMessage(), !res.isError() );

        assertTrue( sg.xpath("PERMISSIONS/OWNER_U").equals("1") );
        assertTrue( sg.xpath("PERMISSIONS/OWNER_M").equals("1") );
        assertTrue( sg.xpath("PERMISSIONS/OWNER_A").equals("0") );
        assertTrue( sg.xpath("PERMISSIONS/GROUP_U").equals("1") );
        assertTrue( sg.xpath("PERMISSIONS/GROUP_M").equals("0") );
        assertTrue( sg.xpath("PERMISSIONS/GROUP_A").equals("0") );
        assertTrue( sg.xpath("PERMISSIONS/OTHER_U").equals("0") );
        assertTrue( sg.xpath("PERMISSIONS/OTHER_M").equals("0") );
        assertTrue( sg.xpath("PERMISSIONS/OTHER_A").equals("0") );

        res = sg.chmod("147");
        assertTrue( res.getErrorMessage(), !res.isError() );

        res = sg.info();
        assertTrue( res.getErrorMessage(), !res.isError() );

        assertTrue( sg.xpath("PERMISSIONS/OWNER_U").equals("0") );
        assertTrue( sg.xpath("PERMISSIONS/OWNER_M").equals("0") );
        assertTrue( sg.xpath("PERMISSIONS/OWNER_A").equals("1") );
        assertTrue( sg.xpath("PERMISSIONS/GROUP_U").equals("1") );
        assertTrue( sg.xpath("PERMISSIONS/GROUP_M").equals("0") );
        assertTrue( sg.xpath("PERMISSIONS/GROUP_A").equals("0") );
        assertTrue( sg.xpath("PERMISSIONS/OTHER_U").equals("1") );
        assertTrue( sg.xpath("PERMISSIONS/OTHER_M").equals("1") );
        assertTrue( sg.xpath("PERMISSIONS/OTHER_A").equals("1") );
    }

    @Test
    public void attributes()
    {
        res = sg.info();
        assertTrue( res.getErrorMessage(), !res.isError() );

//        assertTrue( sg.xpath("ID").equals("0") );
        assertTrue( sg.xpath("NAME").equals(name) );
    }

    @Test
    public void delete()
    {
        res = sg.delete();
        assertTrue( res.getErrorMessage(), !res.isError() );

        res = sg.info();
        assertTrue( res.isError() );
    }

    @Test
    public void chown()
    {
        // Create a new User and Group
        res = User.allocate(client, "sg_test_user", "password");
        assertTrue( res.getErrorMessage(), !res.isError() );

        int uid = Integer.parseInt(res.getMessage());

        res = Group.allocate(client, "sg_test_group");
        assertTrue( res.getErrorMessage(), !res.isError() );

        int gid = Integer.parseInt(res.getMessage());

        res = sg.info();
        assertTrue( res.getErrorMessage(), !res.isError() );

        assertTrue( sg.uid() == 0 );
        assertTrue( sg.gid() == 0 );

        res = sg.chown(uid, gid);
        assertTrue( res.getErrorMessage(), !res.isError() );

        res = sg.info();
        assertTrue( res.getErrorMessage(), !res.isError() );

        assertTrue( sg.uid() == uid );
        assertTrue( sg.gid() == gid );

        res = sg.chgrp(0);

        res = sg.info();
        assertTrue( res.getErrorMessage(), !res.isError() );

        assertTrue( sg.uid() == uid );
        assertTrue( sg.gid() == 0 );
    }
}
