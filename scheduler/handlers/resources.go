package handlers

import (
	"context"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"

	"campus-scheduler/db"
)

type Resource struct {
	ID        string `json:"id"`
	Name      string `json:"name"`
	Type      string `json:"type"`
	Capacity  *int   `json:"capacity,omitempty"`
	Status    string `json:"status"`
	CreatedAt string `json:"created_at"`
}

func GetResources(c *fiber.Ctx) error {
	pool := db.GetPool()
	rows, err := pool.Query(context.Background(), `
		SELECT id, name, type, capacity, status, created_at 
		FROM resources ORDER BY name
	`)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to fetch resources"})
	}
	defer rows.Close()

	var resources []Resource
	for rows.Next() {
		var r Resource
		var capacity *int
		rows.Scan(&r.ID, &r.Name, &r.Type, &capacity, &r.Status, &r.CreatedAt)
		r.Capacity = capacity
		resources = append(resources, r)
	}

	if resources == nil {
		resources = []Resource{}
	}

	return c.JSON(resources)
}

func GetResource(c *fiber.Ctx) error {
	id := c.Params("id")
	pool := db.GetPool()

	var r Resource
	var capacity *int
	err := pool.QueryRow(context.Background(), `
		SELECT id, name, type, capacity, status, created_at 
		FROM resources WHERE id = $1
	`, id).Scan(&r.ID, &r.Name, &r.Type, &capacity, &r.Status, &r.CreatedAt)

	if err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Resource not found"})
	}

	r.Capacity = capacity
	return c.JSON(r)
}

type CreateResourceInput struct {
	Name     string `json:"name"`
	Type     string `json:"type"`
	Capacity *int   `json:"capacity"`
}

func CreateResource(c *fiber.Ctx) error {
	var input CreateResourceInput
	if err := c.BodyParser(&input); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid input"})
	}

	id := uuid.New().String()
	pool := db.GetPool()

	_, err := pool.Exec(context.Background(), `
		INSERT INTO resources (id, name, type, capacity) 
		VALUES ($1, $2, $3, $4)
	`, id, input.Name, input.Type, input.Capacity)

	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to create resource"})
	}

	return c.Status(201).JSON(fiber.Map{
		"id":     id,
		"name":   input.Name,
		"type":   input.Type,
		"status": "AVAILABLE",
	})
}

func UpdateResource(c *fiber.Ctx) error {
	id := c.Params("id")
	var input struct {
		Name     string `json:"name"`
		Status   string `json:"status"`
		Capacity *int   `json:"capacity"`
	}
	if err := c.BodyParser(&input); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid input"})
	}

	pool := db.GetPool()
	_, err := pool.Exec(context.Background(), `
		UPDATE resources SET name = $1, status = $2, capacity = $3, updated_at = NOW()
		WHERE id = $4
	`, input.Name, input.Status, input.Capacity, id)

	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to update resource"})
	}

	return c.JSON(fiber.Map{"message": "Resource updated"})
}

func DeleteResource(c *fiber.Ctx) error {
	id := c.Params("id")
	pool := db.GetPool()

	_, err := pool.Exec(context.Background(), `DELETE FROM resources WHERE id = $1`, id)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to delete resource"})
	}

	return c.JSON(fiber.Map{"message": "Resource deleted"})
}
