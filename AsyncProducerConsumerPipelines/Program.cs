using System.Threading.Channels;
using WebChannels.Features.Notifications;
using WebChannels.Features.Orders;

WebApplicationBuilder? builder = WebApplication.CreateBuilder(args);

builder.Logging.AddJsonConsole();

builder.Services.AddControllers();

builder.Services.AddOpenApi();

builder.Services.AddHostedService<OrderProcessor>();
builder.Services.AddScoped<OrderService>();

builder.Services
       .AddSingleton<Channel<AddOrderCommand>>(
           implementationFactory: _ => Channel.CreateUnbounded<AddOrderCommand>(
               options: new UnboundedChannelOptions
               {
                   SingleReader = true,
                   AllowSynchronousContinuations = false
               }));

builder.Services
       .AddSingleton<Channel<NewNotificationEvent>>(
           implementationFactory: _ => Channel.CreateUnbounded<NewNotificationEvent>(
               options: new UnboundedChannelOptions
               {
                   SingleReader = false,
                   AllowSynchronousContinuations = false
               }));

WebApplication? app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();

    app.UseSwaggerUI(opt =>
    {
        opt.SwaggerEndpoint("/openapi/v1.json", "v1");
        opt.InjectJavascript("/swagger-sse-support.js");
    });
}

app.UseHttpsRedirection();

app.UseStaticFiles();

app.UseAuthorization();

app.MapControllers();

app.Run();