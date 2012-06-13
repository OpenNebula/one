import java.util.AbstractList;
import java.util.Iterator;

import org.opennebula.client.Client;
import org.opennebula.client.document.DocumentPool;
import org.w3c.dom.Node;


public class GenericObjAPool extends DocumentPool implements Iterable<GenericObjA>
{
    private static final int TYPE = 200;

    @Override
    protected int type()
    {
        return TYPE;
    }

    public GenericObjAPool(Client client)
    {
        super(client);
    }

    public GenericObjAPool(Client client, int filter)
    {
        super(client, filter);
    }

    @Override
    public GenericObjA factory(Node node)
    {
        return new GenericObjA(node, client);
    }

    @Override
    public Iterator<GenericObjA> iterator()
    {
        AbstractList<GenericObjA> ab = new AbstractList<GenericObjA>()
        {
            public int size()
            {
                return getLength();
            }

            public GenericObjA get(int index)
            {
                return (GenericObjA) item(index);
            }
        };

        return ab.iterator();
    }
}
