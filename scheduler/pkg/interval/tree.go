package interval

import (
	"time"
)

// Interval represents a time range with associated data
type Interval struct {
	Start int64  // Unix timestamp
	End   int64  // Unix timestamp
	ID    string // Booking ID
	Data  interface{}
}

// Node represents a node in the Interval Tree
type Node struct {
	Interval Interval
	Max      int64 // Maximum end point in this subtree
	Left     *Node
	Right    *Node
}

// Tree represents the Interval Tree
type Tree struct {
	Root *Node
}

// NewTree creates a new Interval Tree
func NewTree() *Tree {
	return &Tree{}
}

// Insert adds a new interval to the tree
func (t *Tree) Insert(val Interval) {
	t.Root = insert(t.Root, val)
}

func insert(n *Node, val Interval) *Node {
	if n == nil {
		return &Node{
			Interval: val,
			Max:      val.End,
		}
	}

	// Insert based on start time (standard BST property)
	if val.Start < n.Interval.Start {
		n.Left = insert(n.Left, val)
	} else {
		n.Right = insert(n.Right, val)
	}

	// Update Max value for this node
	if n.Max < val.End {
		n.Max = val.End
	}

	return n
}

// Query returns all intervals that overlap with the given range [start, end)
func (t *Tree) Query(start, end time.Time) []Interval {
	var result []Interval
	s := start.Unix()
	e := end.Unix()
	query(t.Root, s, e, &result)
	return result
}

func query(n *Node, start, end int64, result *[]Interval) {
	if n == nil {
		return
	}

	// Optimization: If node's max is less than query start, no overlap possible in this subtree
	if n.Max <= start {
		return
	}

	// Check if current node overlaps
	// Overlap condition: (Node.Start < Query.End) AND (Node.End > Query.Start)
	if n.Interval.Start < end && n.Interval.End > start {
		*result = append(*result, n.Interval)
	}

	// Recurse left
	if n.Left != nil && n.Left.Max > start {
		query(n.Left, start, end, result)
	}

	// Recurse right if strictly necessary
	// We only go right if the Query.End is greater than the current Node.Start
	if n.Right != nil && n.Interval.Start < end {
		query(n.Right, start, end, result)
	}
}

// Delete removes an interval from the tree by standard BST deletion logic.
func (t *Tree) Delete(start, end int64, id string) {
	t.Root = deleteNode(t.Root, start, end, id)
}

func deleteNode(n *Node, start, end int64, id string) *Node {
	if n == nil {
		return nil
	}

	if n.Interval.Start == start && n.Interval.End == end && n.Interval.ID == id {
		if n.Left == nil {
			return n.Right
		} else if n.Right == nil {
			return n.Left
		}

		successor := n.Right
		for successor.Left != nil {
			successor = successor.Left
		}

		n.Interval = successor.Interval
		n.Right = deleteNode(n.Right, successor.Interval.Start, successor.Interval.End, successor.Interval.ID)

		n.Max = max(n.Interval.End, max(getMax(n.Left), getMax(n.Right)))
		return n
	}

	if start < n.Interval.Start {
		n.Left = deleteNode(n.Left, start, end, id)
	} else {
		n.Right = deleteNode(n.Right, start, end, id)
	}

	n.Max = max(n.Interval.End, max(getMax(n.Left), getMax(n.Right)))
	return n
}

func getMax(n *Node) int64 {
	if n == nil {
		return 0
	}
	return n.Max
}

func max(a, b int64) int64 {
	if a > b {
		return a
	}
	return b
}
