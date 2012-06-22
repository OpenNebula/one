import org.opennebula.client.Client;
import org.opennebula.client.OneResponse;
import org.opennebula.client.document.Document;
import org.w3c.dom.Node;

public class GenericObjA extends Document
{
    private static final int TYPE = 200;

    public GenericObjA(int id, Client client)
    {
        super(id, client);
    }

    public GenericObjA(Node xmlElement, Client client)
    {
        super(xmlElement, client);
    }


    public static OneResponse allocate(Client client, String description)
    {
        return Document.allocate(client, description, TYPE);
    }
}