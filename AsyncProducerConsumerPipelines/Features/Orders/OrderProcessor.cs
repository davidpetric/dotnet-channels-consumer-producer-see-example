using System.Threading.Channels;
using WebChannels.Features.Notifications;

namespace WebChannels.Features.Orders;

public class OrderProcessor(
    Channel<AddOrderCommand> addOrderChannel,
    Channel<NewNotificationEvent> newNotificationChannel,
    ILogger<OrderProcessor> logger
    )
    : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        try
        {
            while (await addOrderChannel.Reader.WaitToReadAsync(stoppingToken))
            {
                AddOrderCommand cmd = await addOrderChannel.Reader.ReadAsync(stoppingToken);

                var orderSummary = cmd.Products
                    .Select(p => $"{p.Name} x {p.Quantity}, at {p.Price} ")
                    .Aggregate((a, b) => $"{a}, {b}");

                NewNotificationEvent newNotificationEvent = new($"New order, Summary: {orderSummary}", DateTime.UtcNow);

                if (logger.IsEnabled(LogLevel.Information))
                {
                    logger.LogInformation("{NewNotificationEvent}", newNotificationChannel);
                }

                await newNotificationChannel.Writer.WriteAsync(newNotificationEvent, stoppingToken);
            }
        }
        catch (OperationCanceledException)
        {
            logger.LogInformation("OrderProcessor stopped");
        }
    }
}