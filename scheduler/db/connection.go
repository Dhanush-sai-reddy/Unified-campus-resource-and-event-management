package db

import (
	"context"
	"fmt"
	"os"

	"github.com/jackc/pgx/v5/pgxpool"
)

var pool *pgxpool.Pool

func Connect() error {
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		dbURL = "postgresql://postgres:postgres@timescaledb:5432/campus_db"
	}

	var err error
	pool, err = pgxpool.New(context.Background(), dbURL)
	if err != nil {
		return fmt.Errorf("unable to connect to database: %w", err)
	}

	 
	if err := pool.Ping(context.Background()); err != nil {
		return fmt.Errorf("unable to ping database: %w", err)
	}

	 
	if err := initTables(); err != nil {
		return fmt.Errorf("failed to initialize tables: %w", err)
	}

	fmt.Println("Connected to TimescaleDB")
	return nil
}

func Close() {
	if pool != nil {
		pool.Close()
	}
}

func GetPool() *pgxpool.Pool {
	return pool
}

func initTables() error {
	ctx := context.Background()

	 
	_, err := pool.Exec(ctx, `
		CREATE TABLE IF NOT EXISTS resources (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			name VARCHAR(255) NOT NULL,
			type VARCHAR(50) NOT NULL,
			capacity INT,
			status VARCHAR(50) DEFAULT 'AVAILABLE',
			created_at TIMESTAMPTZ DEFAULT NOW(),
			updated_at TIMESTAMPTZ DEFAULT NOW()
		)
	`)
	if err != nil {
		return err
	}

	 
	_, err = pool.Exec(ctx, `
		CREATE TABLE IF NOT EXISTS bookings (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			resource_id UUID NOT NULL,
			user_id VARCHAR(255) NOT NULL,
			user_name VARCHAR(255) NOT NULL,
			event_name VARCHAR(255) NOT NULL,
			start_time TIMESTAMPTZ NOT NULL,
			end_time TIMESTAMPTZ NOT NULL,
			status VARCHAR(50) DEFAULT 'PENDING',
			created_at TIMESTAMPTZ DEFAULT NOW()
		)
	`)
	if err != nil {
		return err
	}

	 
	 
	pool.Exec(ctx, `SELECT create_hypertable('bookings', 'start_time', if_not_exists => TRUE)`)

	return nil
}
