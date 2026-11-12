#include "ring_buffer.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define CHECK(condition) do { \
    if (!(condition)) { \
        fprintf(stderr, "%s:%d: %s\n", __FILE__, __LINE__, #condition); \
        exit(EXIT_FAILURE); \
    } \
} while (0)

static void initialization(void)
{
    uint8_t storage[16];
    ring_buffer rb = {0};
    CHECK(rb_init(&rb, storage, sizeof storage) == RB_OK);
    CHECK(rb.count == 0);
    CHECK(rb.capacity == sizeof storage);
}

static void byte_fifo(void)
{
    uint8_t storage[16], value = 0;
    ring_buffer rb = {0};
    CHECK(rb_init(&rb, storage, sizeof storage) == RB_OK);
    CHECK(rb_push(&rb, 0x12) == RB_OK);
    CHECK(rb_push(&rb, 0x34) == RB_OK);
    CHECK(rb_pop(&rb, &value) == RB_OK);
    CHECK(value == 0x12);
    CHECK(rb_pop(&rb, &value) == RB_OK);
    CHECK(value == 0x34);
    CHECK(rb.count == 0);
}

static void bulk_fifo(void)
{
    uint8_t storage[16], output[4] = {0};
    const uint8_t input[] = {0x00, 0x27, 0x80, 0xff};
    ring_buffer rb = {0};
    CHECK(rb_init(&rb, storage, sizeof storage) == RB_OK);
    CHECK(rb_write(&rb, input, sizeof input) == RB_OK);
    CHECK(rb.count == sizeof input);
    CHECK(rb_read(&rb, output, sizeof output) == RB_OK);
    CHECK(memcmp(input, output, sizeof input) == 0);
    CHECK(rb.count == 0);
}

static void reset_and_reuse(void)
{
    uint8_t storage[16], value = 0;
    ring_buffer rb = {0};
    CHECK(rb_init(&rb, storage, sizeof storage) == RB_OK);
    CHECK(rb_push(&rb, 0x11) == RB_OK);
    CHECK(rb_reset(&rb) == RB_OK);
    CHECK(rb.count == 0);
    CHECK(rb_push(&rb, 0x55) == RB_OK);
    CHECK(rb_pop(&rb, &value) == RB_OK);
    CHECK(value == 0x55);
}

int main(void)
{
    initialization();
    byte_fifo();
    bulk_fifo();
    reset_and_reuse();
    puts("PASS: 4 ring buffer tests");
    return EXIT_SUCCESS;
}
