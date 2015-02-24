/*******************************************************************************
 * Copyright 2002-2015, OpenNebula Project (OpenNebula.org), C12G Labs
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
                        "BRIDGE = vbr0\n" +
                        "NETWORK_ADDRESS = 192.168.0.0\n"+
                        "AR = [ TYPE = IP4, IP = 192.168.0.1, SIZE = 254 ]\n";

    private static String second_template =
                        "NAME   = \"Net number one\"\n" +
                        "BRIDGE = br1\n" +
                        "AR = [ TYPE = IP4, IP=130.10.0.1, SIZE = 1]";

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
        vnetPool.info();

        boolean found = false;
        for(VirtualNetwork vn : vnetPool)
        {
            found = found || vn.getName().equals(name);
        }

        assertTrue( found );
    }

    @Test
    public void info()
    {
        res = vnet.info();
        assertTrue( res.getErrorMessage(), !res.isError() );
        assertTrue( vnet.getName().equals(name) );
    }

    @Test
    public void attributes()
    {
        res = vnet.info();
        assertTrue( res.getErrorMessage(), !res.isError() );

        assertTrue( vnet.xpath("NAME").equals(name) );
        assertTrue( vnet.xpath("BRIDGE").equals("vbr0") );
    }

    @Test
    public void delete()
    {
        res = vnet.delete();
        assertTrue( res.getErrorMessage(), !res.isError() );

        res = vnet.info();
        assertTrue( res.isError() );
    }

    @Test
    public void addAr()
    {
        res = VirtualNetwork.allocate(client, second_template);
        assertTrue( res.getErrorMessage(), !res.isError() );

        VirtualNetwork second_vnet =
            new VirtualNetwork(Integer.parseInt(res.getMessage()), client);

        res = second_vnet.addAr("AR = [IP = 130.10.0.5, SIZE = 1, TYPE = IP4]");
        assertTrue( res.getErrorMessage(), !res.isError() );

        res = second_vnet.addAr("AR = [IP = 130.10.0.6, MAC = 50:20:20:20:20:20, SIZE = 1, TYPE = IP4]");
        assertTrue( res.getErrorMessage(), !res.isError() );

        res = second_vnet.addAr("130.10.0.6");
        assertTrue( res.isError() );

        second_vnet.delete();
    }

    @Test
    public void rmAr()
    {
        res = VirtualNetwork.allocate(client, second_template);
        assertTrue( res.getErrorMessage(), !res.isError() );

        VirtualNetwork second_vnet =
            new VirtualNetwork(Integer.parseInt(res.getMessage()), client);

        res = second_vnet.rmAr(0);
        assertTrue( res.getErrorMessage(), !res.isError() );

        res = second_vnet.rmAr(0);
        assertTrue( res.isError() );

        second_vnet.delete();
    }

    @Test
    public void updateAr()
    {
        String new_template = 
            "AR = [ AR_ID = 0, ATT2 = NEW_VAL, ATT3 = VAL3 ]";

        res = vnet.updateAr(new_template);
        assertTrue( res.getErrorMessage(), !res.isError() );

        res = vnet.info();
        assertTrue( res.getErrorMessage(), !res.isError() );
        assertTrue( vnet.xpath("AR_POOL/AR[AR_ID=0]/ATT1").equals( "" ) );
        assertTrue( vnet.xpath("AR_POOL/AR[AR_ID=0]/ATT2").equals( "NEW_VAL" ) );
        assertTrue( vnet.xpath("AR_POOL/AR[AR_ID=0]/ATT3").equals( "VAL3" ) );
    }

    @Test
    public void hold()
    {
        res = vnet.hold("192.168.0.10");
        assertTrue( res.getErrorMessage(), !res.isError() );

        res = vnet.hold("192.168.0.11", 0);
        assertTrue( res.getErrorMessage(), !res.isError() );

        res = vnet.hold("192.168.100.1");
        assertTrue( res.isError() );

        res = vnet.release("192.168.0.10");
        assertTrue( res.getErrorMessage(), !res.isError() );

        res = vnet.release("192.168.0.11", 0);
        assertTrue( res.getErrorMessage(), !res.isError() );

        res = vnet.release("192.168.0.10");
        assertTrue( res.getErrorMessage(), !res.isError() );

        vnet.delete();
    }

    @Test
    public void update()
    {
        String new_template =  "ATT2 = NEW_VAL\n" +
                "ATT3 = VAL3";

        res = vnet.update(new_template);
        assertTrue( res.getErrorMessage(), !res.isError() );

        res = vnet.info();
        assertTrue( res.getErrorMessage(), !res.isError() );
        assertTrue( vnet.xpath("TEMPLATE/ATT1").equals( "" ) );
        assertTrue( vnet.xpath("TEMPLATE/ATT2").equals( "NEW_VAL" ) );
        assertTrue( vnet.xpath("TEMPLATE/ATT3").equals( "VAL3" ) );
    }

    // TODO: reserve, free

}
