CC = gcc
GCOV ?= gcov
LCOV ?= lcov
GENHTML ?= genhtml
CPPFLAGS += -Iinclude
CFLAGS ?= -std=c11 -Wall -Wextra -Wpedantic -Werror -O0 -g
COVERAGE_FLAGS = --coverage -fprofile-abs-path
BUILD = build
REPORT = coverage

.PHONY: all test coverage clean
all: $(BUILD)/test_ring_buffer

$(BUILD):
	mkdir -p $@

$(BUILD)/ring_buffer.o: src/ring_buffer.c include/ring_buffer.h | $(BUILD)
	$(CC) $(CPPFLAGS) $(CFLAGS) $(COVERAGE_FLAGS) -c $< -o $@

$(BUILD)/test_ring_buffer.o: tests/test_ring_buffer.c include/ring_buffer.h | $(BUILD)
	$(CC) $(CPPFLAGS) $(CFLAGS) $(COVERAGE_FLAGS) -c $< -o $@

$(BUILD)/test_ring_buffer: $(BUILD)/ring_buffer.o $(BUILD)/test_ring_buffer.o
	$(CC) $(LDFLAGS) $(COVERAGE_FLAGS) $^ $(LDLIBS) -o $@

test: $(BUILD)/test_ring_buffer
	./$(BUILD)/test_ring_buffer

coverage:
	$(MAKE) clean
	$(MAKE) all
	mkdir -p $(REPORT)
	./$(BUILD)/test_ring_buffer
	cd $(REPORT) && $(GCOV) -b -c -o ../$(BUILD) ../src/ring_buffer.c
	$(LCOV) --capture --directory $(BUILD) --gcov-tool $(GCOV) --branch-coverage --output-file $(REPORT)/all.info
	$(LCOV) --extract $(REPORT)/all.info '*/src/ring_buffer.c' --branch-coverage --output-file $(REPORT)/lcov.info
	$(GENHTML) $(REPORT)/lcov.info --branch-coverage --output-directory $(REPORT)/html
	$(LCOV) --summary $(REPORT)/lcov.info --branch-coverage

clean:
	$(RM) -r $(BUILD) $(REPORT)
