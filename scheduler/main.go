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
	"campus-scheduler/pkg/interval"
)

func main() {

	godotenv.Load()

	if err := db.Connect(); err != nil {
		log.Fatal("Failed to connect to database:", err)
	}
	defer db.Close()

	// Initialize Interval Tree Manager
	pool := db.GetPool()
	intervalManager := interval.NewManager(pool)
	if err := intervalManager.LoadFromDB(); err != nil {
		log.Printf("Warning: Failed to load bookings into interval tree: %v", err)
	}
	handlers.SetIntervalManager(intervalManager)

	app := fiber.New(fiber.Config{
		AppName: "Campus Scheduler API",
	})

	app.Use(logger.New())
	app.Use(cors.New())

	app.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"status":  "ok",
			"service": "campus-scheduler",
		})
	})

	api := app.Group("/api")

	resources := api.Group("/resources")
	resources.Get("/", handlers.GetResources)
	resources.Get("/:id", handlers.GetResource)
	resources.Post("/", handlers.CreateResource)
	resources.Put("/:id", handlers.UpdateResource)
	resources.Delete("/:id", handlers.DeleteResource)

	bookings := api.Group("/bookings")
	bookings.Get("/", handlers.GetBookings)
	bookings.Get("/:id", handlers.GetBooking)
	bookings.Post("/", handlers.CreateBooking)
	bookings.Put("/:id/status", handlers.UpdateBookingStatus)
	bookings.Delete("/:id", handlers.CancelBooking)

	port := os.Getenv("PORT")
	if port == "" {
		port = "3002"
	}

	log.Printf("Scheduler running on port %s", port)
	app.Listen(":" + port)
}
