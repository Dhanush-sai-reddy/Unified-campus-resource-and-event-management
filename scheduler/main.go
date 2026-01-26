package main

import (
	"context"
	"log"
	"os"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/joho/godotenv"

	"campus-scheduler/db"
	"campus-scheduler/handlers"

	amqp "github.com/rabbitmq/amqp091-go"
	"github.com/segmentio/kafka-go"
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

	// Start Consumers in background
	go startRabbitConsumer()
	go startKafkaConsumer()

	port := os.Getenv("PORT")
	if port == "" {
		port = "3002" // Changed default to 3002 to match Dockerfile
	}

	log.Printf("Scheduler running on port %s", port)
	app.Listen(":" + port)
}

func startRabbitConsumer() {
	url := os.Getenv("RABBITMQ_URL")
	if url == "" {
		url = "amqp://guest:guest@localhost:5672"
	}

	conn, err := amqp.Dial(url)
	if err != nil {
		log.Printf("Failed to connect to RabbitMQ: %s", err)
		return
	}
	defer conn.Close()

	ch, err := conn.Channel()
	if err != nil {
		log.Printf("Failed to open a channel: %s", err)
		return
	}
	defer ch.Close()

	q, err := ch.QueueDeclare(
		"announcements", // name
		true,            // durable
		false,           // delete when unused
		false,           // exclusive
		false,           // no-wait
		nil,             // arguments
	)
	if err != nil {
		log.Printf("Failed to declare a queue: %s", err)
		return
	}

	msgs, err := ch.Consume(
		q.Name, // queue
		"",     // consumer
		true,   // auto-ack
		false,  // exclusive
		false,  // no-local
		false,  // no-wait
		nil,    // args
	)
	if err != nil {
		log.Printf("Failed to register a consumer: %s", err)
		return
	}

	log.Println(" [*] Waiting for announcements. To exit press CTRL+C")

	for d := range msgs {
		log.Printf(" [x] Received Announcement: %s", d.Body)
	}
}

func startKafkaConsumer() {
	broker := os.Getenv("KAFKA_BROKER")
	if broker == "" {
		broker = "localhost:9092"
	}

	r := kafka.NewReader(kafka.ReaderConfig{
		Brokers:  []string{broker},
		Topic:    "events",
		GroupID:  "scheduler-group",
		MinBytes: 10e3, // 10KB
		MaxBytes: 10e6, // 10MB
	})

	log.Println(" [*] Waiting for events from Kafka")

	for {
		m, err := r.ReadMessage(context.Background())
		if err != nil {
			log.Printf("Kafka Read error: %v", err)
			break
		}
		log.Printf(" [K] Received Event: %s", string(m.Value))
	}

	if err := r.Close(); err != nil {
		log.Fatal("failed to close reader:", err)
	}
}
