FROM golang:1.21-alpine AS builder

WORKDIR /app

# Copy source code
COPY . .

# Tidy dependencies (generates go.sum and fixes missing requirements)
RUN go mod tidy

# Build
RUN CGO_ENABLED=0 GOOS=linux go build -o scheduler .

# Production image
FROM alpine:latest

WORKDIR /app
COPY --from=builder /app/scheduler .

EXPOSE 3002

CMD ["./scheduler"]
