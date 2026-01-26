package main

import (
	"log"
	"os"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/joho/godotenv"

	"campus-scheduler/db"
	"campus-scheduler/handlers"
)

func main() {
	// Load env
	godotenv.Load()

	// Connect to database
	if err := db.Connect(); err != nil {
		log.Fatal("Failed to connect to database:", err)
	}
	defer db.Close()

	// Create Fiber app
	app := fiber.New(fiber.Config{
		AppName: "Campus Scheduler API",
	})

	// Middleware
	app.Use(logger.New())
	app.Use(cors.New())

	// Health check
	app.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"status":  "ok",
			"service": "campus-scheduler",
		})
	})

	// API routes
	api := app.Group("/api")

	// Resources
	resources := api.Group("/resources")
	resources.Get("/", handlers.GetResources)
	resources.Get("/:id", handlers.GetResource)
	resources.Post("/", handlers.CreateResource)
	resources.Put("/:id", handlers.UpdateResource)
	resources.Delete("/:id", handlers.DeleteResource)

	// Bookings
	bookings := api.Group("/bookings")
	bookings.Get("/", handlers.GetBookings)
	bookings.Get("/:id", handlers.GetBooking)
	bookings.Post("/", handlers.CreateBooking)
	bookings.Put("/:id/status", handlers.UpdateBookingStatus)
	bookings.Delete("/:id", handlers.CancelBooking)
	bookings.Get("/conflicts", handlers.CheckConflicts)

	// Analytics
	analytics := api.Group("/analytics")
	analytics.Get("/overview", handlers.GetOverview)
	analytics.Get("/resource-usage", handlers.GetResourceUsage)
	analytics.Get("/event-trends", handlers.GetEventTrends)
	analytics.Get("/export/csv", handlers.ExportCSV)

	// Start server
	port := os.Getenv("PORT")
	if port == "" {
		port = "5001"
	}

	log.Printf("🚀 Campus Scheduler running on port %s", port)
	log.Fatal(app.Listen(":" + port))
}
