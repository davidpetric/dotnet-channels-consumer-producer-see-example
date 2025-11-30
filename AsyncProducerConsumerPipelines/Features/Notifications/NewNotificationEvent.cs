namespace WebChannels.Features.Notifications;

public record NewNotificationEvent(string Message, DateTime CreatedAt);
