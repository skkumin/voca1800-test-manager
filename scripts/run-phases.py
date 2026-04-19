#!/usr/bin/env python3
import json
import sys
from pathlib import Path

def load_task_index(task_dir):
    index_path = Path("tasks") / task_dir / "index.json"
    with open(index_path, "r", encoding="utf-8") as f:
        return json.load(f)

def get_next_pending_phase(task_index):
    for phase in task_index.get("phases", []):
        if phase["status"] == "pending":
            return phase["phase"]
    return None

def main():
    if len(sys.argv) < 2:
        print("Usage: python3 scripts/run-phases.py <task-dir>")
        sys.exit(1)

    task_dir = sys.argv[1]
    
    try:
        task_index = load_task_index(task_dir)
    except FileNotFoundError:
        print(f"❌ Task directory not found: tasks/{task_dir}")
        sys.exit(1)

    next_phase = get_next_pending_phase(task_index)

    if next_phase is None:
        print(f"✅ Task {task_dir}: All phases completed!")
        sys.exit(0)

    print(f"⏳ Task {task_dir}, Phase {next_phase} ready")
    print(f"📄 Instructions: tasks/{task_dir}/phase{next_phase}.md")

if __name__ == "__main__":
    main()
