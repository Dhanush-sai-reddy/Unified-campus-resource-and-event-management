package handlers

import (
	"context"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"

	"campus-scheduler/db"
)

type Booking struct {
	ID         string    `json:"id"`
	ResourceID string    `json:"resource_id"`
	UserID     string    `json:"user_id"`
	UserName   string    `json:"user_name"`
	EventName  string    `json:"event_name"`
	StartTime  time.Time `json:"start_time"`
	EndTime    time.Time `json:"end_time"`
	Status     string    `json:"status"`
	CreatedAt  time.Time `json:"created_at"`
}

func GetBookings(c *fiber.Ctx) error {
	pool := db.GetPool()
	resourceID := c.Query("resource_id")
	userID := c.Query("user_id")

	query := `SELECT id, resource_id, user_id, user_name, event_name, start_time, end_time, status, created_at 
		FROM bookings WHERE 1=1`
	args := []interface{}{}
	argCount := 0

	if resourceID != "" {
		argCount++
		query += ` AND resource_id = $` + string(rune('0'+argCount))
		args = append(args, resourceID)
	}
	if userID != "" {
		argCount++
		query += ` AND user_id = $` + string(rune('0'+argCount))
		args = append(args, userID)
	}
	query += ` ORDER BY start_time DESC`

	rows, err := pool.Query(context.Background(), query, args...)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to fetch bookings"})
	}
	defer rows.Close()

	var bookings []Booking
	for rows.Next() {
		var b Booking
		rows.Scan(&b.ID, &b.ResourceID, &b.UserID, &b.UserName, &b.EventName, &b.StartTime, &b.EndTime, &b.Status, &b.CreatedAt)
		bookings = append(bookings, b)
	}

	if bookings == nil {
		bookings = []Booking{}
	}

	return c.JSON(bookings)
}

func GetBooking(c *fiber.Ctx) error {
	id := c.Params("id")
	pool := db.GetPool()

	var b Booking
	err := pool.QueryRow(context.Background(), `
		SELECT id, resource_id, user_id, user_name, event_name, start_time, end_time, status, created_at 
		FROM bookings WHERE id = $1
	`, id).Scan(&b.ID, &b.ResourceID, &b.UserID, &b.UserName, &b.EventName, &b.StartTime, &b.EndTime, &b.Status, &b.CreatedAt)

	if err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Booking not found"})
	}

	return c.JSON(b)
}

type CreateBookingInput struct {
	ResourceID string `json:"resource_id"`
	UserID     string `json:"user_id"`
	UserName   string `json:"user_name"`
	EventName  string `json:"event_name"`
	StartTime  string `json:"start_time"`
	EndTime    string `json:"end_time"`
}

func CreateBooking(c *fiber.Ctx) error {
	var input CreateBookingInput
	if err := c.BodyParser(&input); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid input"})
	}

	startTime, _ := time.Parse(time.RFC3339, input.StartTime)
	endTime, _ := time.Parse(time.RFC3339, input.EndTime)

	 
	pool := db.GetPool()
	var conflictCount int
	err := pool.QueryRow(context.Background(), `
		SELECT COUNT(*) FROM bookings 
		WHERE resource_id = $1 
		AND status != 'CANCELLED'
		AND (
			(start_time <= $2 AND end_time > $2) OR
			(start_time < $3 AND end_time >= $3) OR
			(start_time >= $2 AND end_time <= $3)
		)
	`, input.ResourceID, startTime, endTime).Scan(&conflictCount)

	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to check conflicts"})
	}

	if conflictCount > 0 {
		return c.Status(409).JSON(fiber.Map{
			"error":     "Booking conflict detected",
			"conflicts": conflictCount,
		})
	}

	 
	id := uuid.New().String()
	_, err = pool.Exec(context.Background(), `
		INSERT INTO bookings (id, resource_id, user_id, user_name, event_name, start_time, end_time, status)
		VALUES ($1, $2, $3, $4, $5, $6, $7, 'PENDING')
	`, id, input.ResourceID, input.UserID, input.UserName, input.EventName, startTime, endTime)

	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to create booking"})
	}

	return c.Status(201).JSON(fiber.Map{
		"id":          id,
		"resource_id": input.ResourceID,
		"status":      "PENDING",
		"message":     "Booking created successfully",
	})
}

func UpdateBookingStatus(c *fiber.Ctx) error {
	id := c.Params("id")
	var input struct {
		Status string `json:"status"`
	}
	if err := c.BodyParser(&input); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid input"})
	}

	pool := db.GetPool()
	_, err := pool.Exec(context.Background(), `
		UPDATE bookings SET status = $1 WHERE id = $2
	`, input.Status, id)

	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to update booking"})
	}

	return c.JSON(fiber.Map{"message": "Booking status updated"})
}

func CancelBooking(c *fiber.Ctx) error {
	id := c.Params("id")
	pool := db.GetPool()

	_, err := pool.Exec(context.Background(), `
		UPDATE bookings SET status = 'CANCELLED' WHERE id = $1
	`, id)

	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to cancel booking"})
	}

	return c.JSON(fiber.Map{"message": "Booking cancelled"})
}

func CheckConflicts(c *fiber.Ctx) error {
	resourceID := c.Query("resource_id")
	startTime := c.Query("start_time")
	endTime := c.Query("end_time")

	if resourceID == "" || startTime == "" || endTime == "" {
		return c.Status(400).JSON(fiber.Map{"error": "Missing required parameters"})
	}

	start, _ := time.Parse(time.RFC3339, startTime)
	end, _ := time.Parse(time.RFC3339, endTime)

	pool := db.GetPool()
	rows, err := pool.Query(context.Background(), `
		SELECT id, event_name, start_time, end_time 
		FROM bookings 
		WHERE resource_id = $1 
		AND status != 'CANCELLED'
		AND (
			(start_time <= $2 AND end_time > $2) OR
			(start_time < $3 AND end_time >= $3) OR
			(start_time >= $2 AND end_time <= $3)
		)
	`, resourceID, start, end)

	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to check conflicts"})
	}
	defer rows.Close()

	var conflicts []fiber.Map
	for rows.Next() {
		var id, eventName string
		var startTime, endTime time.Time
		rows.Scan(&id, &eventName, &startTime, &endTime)
		conflicts = append(conflicts, fiber.Map{
			"id":         id,
			"event_name": eventName,
			"start_time": startTime,
			"end_time":   endTime,
		})
	}

	return c.JSON(fiber.Map{
		"has_conflicts": len(conflicts) > 0,
		"conflicts":     conflicts,
	})
}
