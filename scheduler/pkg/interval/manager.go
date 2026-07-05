package interval

import (
	"context"
	"log"
	"sync"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

// Manager handles concurrent access to interval trees, one per resource
type Manager struct {
	trees map[string]*Tree // map[ResourceID]*Tree
	mu    sync.RWMutex
	pool  *pgxpool.Pool
}

// NewManager creates a new Interval Manager
func NewManager(pool *pgxpool.Pool) *Manager {
	return &Manager{
		trees: make(map[string]*Tree),
		pool:  pool,
	}
}

// LoadFromDB populates the trees from the database
func (m *Manager) LoadFromDB() error {
	m.mu.Lock()
	defer m.mu.Unlock()

	// Reset trees
	m.trees = make(map[string]*Tree)

	log.Println("Loading bookings into Interval Manager...")

	query := `
		SELECT id, resource_id, start_time, end_time, status
		FROM bookings
		WHERE status IN ('APPROVED', 'PENDING')
	`

	rows, err := m.pool.Query(context.Background(), query)
	if err != nil {
		return err
	}
	defer rows.Close()

	count := 0
	for rows.Next() {
		var id, resourceID, status string
		var start, end time.Time

		if err := rows.Scan(&id, &resourceID, &start, &end, &status); err != nil {
			log.Printf("Error scanning booking: %v", err)
			continue
		}

		if _, exists := m.trees[resourceID]; !exists {
			m.trees[resourceID] = NewTree()
		}

		m.trees[resourceID].Insert(Interval{
			Start: start.Unix(),
			End:   end.Unix(),
			ID:    id,
			Data:  status,
		})
		count++
	}

	log.Printf("Loaded %d bookings into memory.", count)
	return nil
}

// HasConflict checks if the time range overlaps with any existing interval for a resource
func (m *Manager) HasConflict(resourceID string, start, end time.Time) bool {
	m.mu.RLock()
	defer m.mu.RUnlock()

	tree, exists := m.trees[resourceID]
	if !exists {
		return false
	}

	overlaps := tree.Query(start, end)
	return len(overlaps) > 0
}

// AddBooking adds a booking to the in-memory tree (called after DB insert)
func (m *Manager) AddBooking(resourceID, bookingID, status string, start, end time.Time) {
	m.mu.Lock()
	defer m.mu.Unlock()

	if _, exists := m.trees[resourceID]; !exists {
		m.trees[resourceID] = NewTree()
	}

	m.trees[resourceID].Insert(Interval{
		Start: start.Unix(),
		End:   end.Unix(),
		ID:    bookingID,
		Data:  status,
	})
}

// RemoveBooking removes a booking from the in-memory tree
func (m *Manager) RemoveBooking(resourceID, bookingID string, start, end time.Time) {
	m.mu.Lock()
	defer m.mu.Unlock()

	if tree, exists := m.trees[resourceID]; exists {
		tree.Delete(start.Unix(), end.Unix(), bookingID)
	}
}
