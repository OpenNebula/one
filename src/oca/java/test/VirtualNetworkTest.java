/*******************************************************************************
 * Copyright 2002-2010, OpenNebula Project Leads (OpenNebula.org)
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
import org.opennebula.client.vnet.VirtualNetwork;
import org.opennebula.client.vnet.VirtualNetworkPool;

public class VirtualNetworkTest
{

    private static VirtualNetwork     vnet;
    private static VirtualNetworkPool vnetPool;

    private static Client client;

    private static OneResponse  res;
    private static String       name      = "new_test_vnet";


    private static String template =
                        "NAME = " + name + "\n"+
                        "TYPE = RANGED\n" +
                        "PUBLIC = NO\n" +
                        "BRIDGE = vbr0\n" +
                        "NETWORK_SIZE    = C\n" +
                        "NETWORK_ADDRESS = 192.168.0.0\n";

    /**
     * @throws java.lang.Exception
     */
    @BeforeClass
    public static void setUpBeforeClass() throws Exception
    {
        client      = new Client();
        vnetPool    = new VirtualNetworkPool(client);
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
        res = VirtualNetwork.allocate(client, template);

        int vnid = !res.isError() ? Integer.parseInt(res.getMessage()) : -1;
        vnet     = new VirtualNetwork(vnid, client);
    }

    /**
     * @throws java.lang.Exception
     */
    @After
    public void tearDown() throws Exception
    {
        vnet.delete();
    }


    @Test
    public void allocate()
    {
//        String template =   "NAME = " + name + "\n"+
//                            "TYPE = RANGED\n" +
//                            "PUBLIC = NO\n" +
//                            "BRIDGE = vbr0\n" +
//                            "NETWORK_SIZE    = C\n" +
//                            "NETWORK_ADDRESS = 192.168.0.0\n";
//
//        res = VirtualNetwork.allocate(client, template);
//        assertTrue( !res.isError() );
//        assertTrue( res.getMessage().equals("0") );

        vnetPool.info();

        boolean found = false;
        for(VirtualNetwork vn : vnetPool)
        {
            found = found || vn.getName().equals(name);
        }

        assertTrue( found );
    }

    @Test
    public void update()
    {
        res = vnet.info();
        assertTrue( !res.isError() );

//        assertTrue( vnet.getId().equals("0") );
//        assertTrue( vnet.id() == 0 );
        assertTrue( vnet.getName().equals(name) );
    }

    @Test
    public void attributes()
    {
        res = vnet.info();
        assertTrue( !res.isError() );

//        assertTrue( vnet.xpath("ID").equals("0") );
        assertTrue( vnet.xpath("NAME").equals(name) );
        assertTrue( vnet.xpath("BRIDGE").equals("vbr0") );
        assertTrue( vnet.xpath("TEMPLATE/NETWORK_ADDRESS").equals("192.168.0.0") );
        assertTrue( vnet.xpath("TEMPLATE/TYPE").equals("RANGED") );
    }

    @Test
    public void delete()
    {
        res = vnet.delete();
        assertTrue( !res.isError() );

        res = vnet.info();
        assertTrue( res.isError() );
    }
}
