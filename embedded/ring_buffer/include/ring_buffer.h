#ifndef RING_BUFFER_H
#define RING_BUFFER_H

#include <stddef.h>
#include <stdint.h>

typedef enum {
    RB_OK = 0,
    RB_INVALID_ARGUMENT,
    RB_FULL,
    RB_EMPTY,
    RB_NO_SPACE,
    RB_NO_DATA
} rb_status;

/* Initialize to {0} before first use. Fields are private to this implementation.
 * Storage must remain valid for the lifetime of the buffer. No heap allocation.
 * Not thread-safe: callers must serialize task/interrupt access.
 */
typedef struct {
    uint8_t *storage;
    size_t capacity;
    size_t head;
    size_t tail;
    size_t count;
} ring_buffer;

rb_status rb_init(ring_buffer *rb, uint8_t *storage, size_t capacity);
rb_status rb_reset(ring_buffer *rb);
rb_status rb_push(ring_buffer *rb, uint8_t value);
rb_status rb_pop(ring_buffer *rb, uint8_t *value);

/* All-or-nothing transfers: errors leave state and output unchanged.
 * Input/output memory must not overlap the ring's storage or control structure.
 * For length zero, data may be NULL; the ring must still be initialized.
 */
rb_status rb_write(ring_buffer *rb, const uint8_t *data, size_t length);
rb_status rb_read(ring_buffer *rb, uint8_t *data, size_t length);

#endif
