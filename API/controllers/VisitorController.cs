using Microsoft.AspNetCore.Mvc;

namespace API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class VisitorController : ControllerBase
    {
        [HttpGet]
        public IActionResult GetVisitors()
        {
            var visitors = new List<string>
            {
                "Nguyen Van A",
                "Tran Thi B",
                "Le Van C"
            };

            return Ok(visitors);
        }
    }
}