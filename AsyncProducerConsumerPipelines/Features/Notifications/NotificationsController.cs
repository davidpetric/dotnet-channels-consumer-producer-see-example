namespace WebChannels.Features.Notifications;

using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using System.Runtime.CompilerServices;
using System.Threading.Channels;

[ApiController]
[Route("[controller]")]
public class NotificationsController(
    Channel<NewNotificationEvent> newNotificationChannel,
    ILogger<NotificationsController> logger) : Controller
{
    [HttpGet(Name = "SendNotifications")]
    [Produces("text/event-stream")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public IResult NotifyUsers(CancellationToken cancellationToken)
    {
        try
        {
            return TypedResults.ServerSentEvents(NotifyAsync(cancellationToken), "new-order");
        }
        catch (OperationCanceledException)
        {
            logger.LogInformation("Connection lost");
            return TypedResults.NoContent();
        }
    }

    private async IAsyncEnumerable<NewNotificationEvent> NotifyAsync(
        [EnumeratorCancellation] CancellationToken cancellationToken)
    {
        while (await newNotificationChannel.Reader.WaitToReadAsync(cancellationToken))
        {
            while (newNotificationChannel.Reader.TryRead(out var newNotificationEvent))
            {
                yield return newNotificationEvent;
            }
        }
    }
}
