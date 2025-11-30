namespace WebChannels.Domain;

using System.ComponentModel.DataAnnotations;

public record AddProductOrderDto(
    [Required][MinLength(3)] string Name,
    [Required][Range(1, double.MaxValue)] decimal Price,
    [Required][Range(1, int.MaxValue)] int Quantity);
