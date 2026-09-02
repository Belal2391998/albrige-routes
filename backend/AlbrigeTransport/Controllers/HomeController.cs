using Microsoft.AspNetCore.Mvc;

namespace AlbrigeTransport.Controllers;

public class HomeController : Controller
{
    public IActionResult Index() => Content("Albrige Transport API — backend ready.");

    [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
    public IActionResult Error() => Problem("An unexpected error occurred.");
}
