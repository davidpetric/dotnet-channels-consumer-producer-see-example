using System.Threading.Channels;

namespace WebChannels.Features.Orders;

public class OrderService(Channel<AddOrderCommand> addOrderChannel)
{
    public async Task CreateOrderAsync(AddOrderCommand cmd)
    {
        // validations
        await addOrderChannel.Writer.WriteAsync(cmd);
    }
}