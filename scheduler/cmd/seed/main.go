package main

import (
	"context"
	"fmt"
	"log"
	"os"

	"github.com/jackc/pgx/v5"
)

func main() {
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		dbURL = "postgresql://postgres:postgres@localhost:5434/campus_db"
	}

	conn, err := pgx.Connect(context.Background(), dbURL)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Unable to connect to database: %v\n", err)
		os.Exit(1)
	}
	defer conn.Close(context.Background())

	// Seed Resources
	resources := []struct {
		Name     string
		Type     string
		Capacity int
		Status   string
	}{
		{"Main Auditorium", "ROOM", 500, "AVAILABLE"},
		{"Lecture Hall 101", "ROOM", 120, "AVAILABLE"},
		{"Projector (HD)", "EQUIPMENT", 0, "AVAILABLE"},
		{"Computing Lab 1", "ROOM", 60, "AVAILABLE"},
	}

	fmt.Println("🌱 Seeding resources...")
	for _, r := range resources {
		var count int
		err := conn.QueryRow(context.Background(), "SELECT COUNT(*) FROM resources WHERE name=$1", r.Name).Scan(&count)
		if err != nil {
			log.Printf("Error checking resource %s: %v", r.Name, err)
			continue
		}

		if count == 0 {
			_, err := conn.Exec(context.Background(),
				"INSERT INTO resources (name, type, capacity, status) VALUES ($1, $2, $3, $4)",
				r.Name, r.Type, r.Capacity, r.Status)
			if err != nil {
				log.Printf("Error inserting resource %s: %v", r.Name, err)
			} else {
				fmt.Printf("✅ Created %s\n", r.Name)
			}
		}
	}
}
