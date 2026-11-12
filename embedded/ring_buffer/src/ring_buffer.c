#include "ring_buffer.h"

static int valid(const ring_buffer *rb)
{
    return rb != NULL && rb->storage != NULL && rb->capacity > 0 &&
           rb->head < rb->capacity && rb->tail < rb->capacity &&
           rb->count <= rb->capacity;
}

static size_t advance(size_t index, size_t capacity)
{
    return index == capacity - 1 ? 0 : index + 1;
}

rb_status rb_init(ring_buffer *rb, uint8_t *storage, size_t capacity)
{
    if (rb == NULL || storage == NULL || capacity == 0) {
        return RB_INVALID_ARGUMENT;
    }
    rb->storage = storage;
    rb->capacity = capacity;
    rb->head = 0;
    rb->tail = 0;
    rb->count = 0;
    return RB_OK;
}

rb_status rb_reset(ring_buffer *rb)
{
    if (!valid(rb)) {
        return RB_INVALID_ARGUMENT;
    }
    rb->head = 0;
    rb->tail = 0;
    rb->count = 0;
    return RB_OK;
}

rb_status rb_push(ring_buffer *rb, uint8_t value)
{
    if (!valid(rb)) {
        return RB_INVALID_ARGUMENT;
    }
    if (rb->count == rb->capacity) {
        return RB_FULL;
    }
    rb->storage[rb->head] = value;
    rb->head = advance(rb->head, rb->capacity);
    ++rb->count;
    return RB_OK;
}

rb_status rb_pop(ring_buffer *rb, uint8_t *value)
{
    if (!valid(rb) || value == NULL) {
        return RB_INVALID_ARGUMENT;
    }
    if (rb->count == 0) {
        return RB_EMPTY;
    }
    *value = rb->storage[rb->tail];
    rb->tail = advance(rb->tail, rb->capacity);
    --rb->count;
    return RB_OK;
}

rb_status rb_write(ring_buffer *rb, const uint8_t *data, size_t length)
{
    if (!valid(rb) || (length > 0 && data == NULL)) {
        return RB_INVALID_ARGUMENT;
    }
    if (length > rb->capacity - rb->count) {
        return RB_NO_SPACE;
    }
    for (size_t i = 0; i < length; ++i) {
        rb->storage[rb->head] = data[i];
        rb->head = advance(rb->head, rb->capacity);
    }
    rb->count += length;
    return RB_OK;
}

rb_status rb_read(ring_buffer *rb, uint8_t *data, size_t length)
{
    if (!valid(rb) || (length > 0 && data == NULL)) {
        return RB_INVALID_ARGUMENT;
    }
    if (length > rb->count) {
        return RB_NO_DATA;
    }
    for (size_t i = 0; i < length; ++i) {
        data[i] = rb->storage[rb->tail];
        rb->tail = advance(rb->tail, rb->capacity);
    }
    rb->count -= length;
    return RB_OK;
}
