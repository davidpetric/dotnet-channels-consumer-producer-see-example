namespace WebChannels.Features.Orders;

using System.ComponentModel.DataAnnotations;
using WebChannels.Domain;

public record AddOrderCommand([Required] List<AddProductOrderDto> Products);