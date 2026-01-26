package handlers

import (
	"bytes"
	"context"
	"encoding/csv"
	"time"

	"github.com/gofiber/fiber/v2"

	"campus-scheduler/db"
)

func GetOverview(c *fiber.Ctx) error {
	pool := db.GetPool()

	var totalResources, totalBookings, pendingBookings, approvedBookings int

	pool.QueryRow(context.Background(), `SELECT COUNT(*) FROM resources`).Scan(&totalResources)
	pool.QueryRow(context.Background(), `SELECT COUNT(*) FROM bookings`).Scan(&totalBookings)
	pool.QueryRow(context.Background(), `SELECT COUNT(*) FROM bookings WHERE status = 'PENDING'`).Scan(&pendingBookings)
	pool.QueryRow(context.Background(), `SELECT COUNT(*) FROM bookings WHERE status = 'APPROVED'`).Scan(&approvedBookings)

	return c.JSON(fiber.Map{
		"total_resources":   totalResources,
		"total_bookings":    totalBookings,
		"pending_bookings":  pendingBookings,
		"approved_bookings": approvedBookings,
	})
}

func GetResourceUsage(c *fiber.Ctx) error {
	pool := db.GetPool()
	days := c.QueryInt("days", 30)

	rows, err := pool.Query(context.Background(), `
		SELECT r.name, COUNT(b.id) as booking_count
		FROM resources r
		LEFT JOIN bookings b ON r.id = b.resource_id 
			AND b.start_time >= NOW() - INTERVAL '1 day' * $1
		GROUP BY r.id, r.name
		ORDER BY booking_count DESC
		LIMIT 10
	`, days)

	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to fetch usage data"})
	}
	defer rows.Close()

	var usage []fiber.Map
	for rows.Next() {
		var name string
		var count int
		rows.Scan(&name, &count)
		usage = append(usage, fiber.Map{
			"resource": name,
			"bookings": count,
		})
	}

	return c.JSON(usage)
}

func GetEventTrends(c *fiber.Ctx) error {
	pool := db.GetPool()

	// Get bookings per day for last 30 days
	rows, err := pool.Query(context.Background(), `
		SELECT DATE(start_time) as date, COUNT(*) as count
		FROM bookings
		WHERE start_time >= NOW() - INTERVAL '30 days'
		GROUP BY DATE(start_time)
		ORDER BY date
	`)

	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to fetch trends"})
	}
	defer rows.Close()

	var trends []fiber.Map
	for rows.Next() {
		var date time.Time
		var count int
		rows.Scan(&date, &count)
		trends = append(trends, fiber.Map{
			"date":  date.Format("2006-01-02"),
			"count": count,
		})
	}

	return c.JSON(trends)
}

func ExportCSV(c *fiber.Ctx) error {
	pool := db.GetPool()
	dataType := c.Query("type", "bookings")

	var buf bytes.Buffer
	writer := csv.NewWriter(&buf)

	if dataType == "bookings" {
		writer.Write([]string{"ID", "Resource ID", "User", "Event", "Start Time", "End Time", "Status"})

		rows, _ := pool.Query(context.Background(), `
			SELECT id, resource_id, user_name, event_name, start_time, end_time, status 
			FROM bookings ORDER BY start_time DESC
		`)
		defer rows.Close()

		for rows.Next() {
			var id, resourceID, userName, eventName, status string
			var startTime, endTime time.Time
			rows.Scan(&id, &resourceID, &userName, &eventName, &startTime, &endTime, &status)
			writer.Write([]string{id, resourceID, userName, eventName, startTime.String(), endTime.String(), status})
		}
	} else if dataType == "resources" {
		writer.Write([]string{"ID", "Name", "Type", "Capacity", "Status"})

		rows, _ := pool.Query(context.Background(), `
			SELECT id, name, type, capacity, status FROM resources ORDER BY name
		`)
		defer rows.Close()

		for rows.Next() {
			var id, name, resType, status string
			var capacity *int
			rows.Scan(&id, &name, &resType, &capacity, &status)
			capStr := ""
			if capacity != nil {
				capStr = string(rune(*capacity))
			}
			writer.Write([]string{id, name, resType, capStr, status})
		}
	}

	writer.Flush()

	c.Set("Content-Type", "text/csv")
	c.Set("Content-Disposition", "attachment; filename="+dataType+"_export.csv")

	return c.Send(buf.Bytes())
}
