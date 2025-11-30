using Microsoft.AspNetCore.Mvc;
using System.ComponentModel.DataAnnotations;

namespace WebChannels.Features.Orders;

[ApiController]
[Route("[controller]")]
public class OrdersController(OrderService orderService) : ControllerBase
{
    [HttpPost(Name = "AddOrder")]
    public async Task<IActionResult> AddOrderAsync(
        [FromBody][Required] AddOrderCommand requestBody)
    {
        await orderService.CreateOrderAsync(requestBody);

        return Accepted();
    }
}