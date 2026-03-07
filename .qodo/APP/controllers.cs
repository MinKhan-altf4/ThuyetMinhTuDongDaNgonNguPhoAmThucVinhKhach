using Microsoft.AspNetCore.Mvc;

namespace VisitorAPI.Controllers
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
                "Tran Van B",
                "Le Thi C"
            };

            return Ok(visitors);
        }
    }
}