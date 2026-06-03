#!/usr/bin/env python
"""
Legacy compatibility wrapper.

The original sample-data script used old model fields and should not be used
directly. The maintained, idempotent demo seed script is seed_demo_data.py.
"""

from seed_demo_data import main


if __name__ == "__main__":
    main()
