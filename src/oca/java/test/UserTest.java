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
import static org.junit.Assert.*;

import javax.xml.xpath.XPath;
import javax.xml.xpath.XPathExpressionException;
import javax.xml.xpath.XPathFactory;

import org.junit.After;
import org.junit.AfterClass;
import org.junit.Before;
import org.junit.BeforeClass;
import org.junit.Test;
import org.opennebula.client.Client;
import org.opennebula.client.OneResponse;
import org.opennebula.client.OneSystem;
import org.opennebula.client.user.User;
import org.opennebula.client.user.UserPool;
import org.opennebula.client.group.Group;
import org.w3c.dom.Node;

public class UserTest
{

    private static User     user;
    private static UserPool userPool;

    private static Client client;

    private static OneResponse  res;
    private static String       name      = "new_test_user";
    private static String       password  = "new_test_password";

    /**
     * @throws java.lang.Exception
     */
    @BeforeClass
    public static void setUpBeforeClass() throws Exception
    {
        client      = new Client();
        userPool    = new UserPool(client);
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
        res = User.allocate(client, name, password);

        assertTrue( res.getErrorMessage(), !res.isError() );

        int uid = Integer.parseInt(res.getMessage());
        user    = new User(uid, client);
    }

    /**
     * @throws java.lang.Exception
     */
    @After
    public void tearDown() throws Exception
    {
        user.delete();
    }


    @Test
    public void allocate()
    {
        userPool.info();

        boolean found = false;
        for(User u : userPool)
        {
            found = found || u.getName().equals(name);
        }

        assertTrue( found );
    }

    @Test
    public void allocateInGroup()
    {
        user.delete();

        res = Group.allocate(client, "group_a");
        assertTrue( res.getErrorMessage(), !res.isError() );
        int group_a_id = Integer.parseInt(res.getMessage());
        Group group_a = new Group(group_a_id, client);

        res = Group.allocate(client, "group_b");
        assertTrue( res.getErrorMessage(), !res.isError() );
        int group_b_id = Integer.parseInt(res.getMessage());
        Group group_b = new Group(group_b_id, client);

        res = Group.allocate(client, "group_c");
        assertTrue( res.getErrorMessage(), !res.isError() );
        int group_c_id = Integer.parseInt(res.getMessage());
        Group group_c = new Group(group_c_id, client);

        Integer[] gids = {group_b_id, group_a_id};
        res = User.allocate(client, "test_user_in_group", "pass", "", gids);

        assertTrue( res.getErrorMessage(), !res.isError() );

        user = new User(Integer.parseInt(res.getMessage()), client);

        res = user.info();
        assertTrue( res.getErrorMessage(), !res.isError() );

        assertTrue( user.gid() == group_b_id );

        group_a.info();
        group_b.info();
        group_c.info();

        assertTrue( group_a.contains(user.id()) );
        assertTrue( group_b.contains(user.id()) );
        assertFalse( group_c.contains(user.id()) );
    }

    @Test
    public void info()
    {
        res = user.info();
        assertTrue( res.getErrorMessage(), !res.isError() );

        assertTrue( user.id() >= 0 );
        assertTrue( user.getName().equals(name) );
    }

    @Test
    public void attributes()
    {
        res = user.info();
        assertTrue( res.getErrorMessage(), !res.isError() );

        assertTrue( user.xpath("NAME").equals(name) );
        assertTrue( user.xpath("ENABLED").equals("1") );
    }

    @Test
    public void chauth()
    {
        res = user.info();
        assertTrue( res.getErrorMessage(), !res.isError() );

        assertTrue( user.xpath("AUTH_DRIVER").equals("core") );

        res = user.chauth("new_driver", password);

        res = user.info();
        assertTrue( res.getErrorMessage(), !res.isError() );

        assertTrue( user.xpath("AUTH_DRIVER").equals("new_driver") );
    }

    @Test
    public void update()
    {
        String new_template =  "ATT2 = NEW_VAL\n" +
                "ATT3 = VAL3";

        res = user.update(new_template);
        assertTrue( res.getErrorMessage(), !res.isError() );

        res = user.info();
        assertTrue( res.getErrorMessage(), !res.isError() );
        assertTrue( user.xpath("TEMPLATE/ATT1").equals( "" ) );
        assertTrue( user.xpath("TEMPLATE/ATT2").equals( "NEW_VAL" ) );
        assertTrue( user.xpath("TEMPLATE/ATT3").equals( "VAL3" ) );
    }

    @Test
    public void delete()
    {
        res = user.info();
        assertTrue( res.getErrorMessage(), !res.isError() );
        assertTrue( user.isEnabled() );

        res = user.delete();
        assertTrue( res.getErrorMessage(), !res.isError() );

        res = user.info();
        assertTrue( res.getErrorMessage(), res.isError() );
    }

    @Test
    public void defaultqutoas()
    {
        OneSystem system = new OneSystem(client);

        res = system.getUserQuotas();
        assertTrue( res.getErrorMessage(), !res.isError() );

        res = system.setUserQuotas("VM = [ VMS = 7, MEMORY = 0, CPU = 3, SYSTEM_DISK_SIZE = 1 ]");
        assertTrue( res.getErrorMessage(), !res.isError() );

        Node node = system.getUserQuotasXML();
        XPathFactory factory = XPathFactory.newInstance();
        XPath xpath = factory.newXPath();

        try
        {
            assertTrue( xpath.evaluate("VM_QUOTA/VM/VMS", node).equals("7") );
        } catch (XPathExpressionException e)
        {
            assertTrue(e.getMessage(), false);
        }
    }
}
