from __future__ import annotations

import os
import signal
import subprocess
import time
import ctypes
from dataclasses import dataclass, field
from pathlib import Path

PR_SET_CHILD_SUBREAPER = 36
_LIBC = None
_SUBREAPER_ENABLED = False


@dataclass
class BrowserLifecycleState:
	page: object | None = None
	session: object | None = None
	browser_context_id: str | None = None
	generator: object | None = None
	owned_generator: bool = False
	owned_process: object | None = None
	owned_launcher_pid: int | None = None
	owned_root_pid: int | None = None
	owned_process_group: int | None = None
	owned_processes: list[dict[str, object]] = field(default_factory=list)
	temp_paths: list[str] = field(default_factory=list)
	diagnostics: dict[str, object] = field(default_factory=dict)


def enable_child_subreaper() -> bool:
	global _LIBC, _SUBREAPER_ENABLED
	if _SUBREAPER_ENABLED:
		return True
	try:
		if _LIBC is None:
			_LIBC = ctypes.CDLL(None, use_errno=True)
		result = _LIBC.prctl(PR_SET_CHILD_SUBREAPER, 1, 0, 0, 0)
		if result != 0:
			return False
	except Exception:
		return False
	_SUBREAPER_ENABLED = True
	return True


def _process_rows() -> list[dict[str, object]]:
	try:
		output = subprocess.check_output(
			["ps", "-eo", "pid=,ppid=,pgid=,stat=,command="],
			text=True,
		)
	except Exception:
		return []

	rows: list[dict[str, object]] = []
	for line in output.splitlines():
		parts = line.strip().split(None, 4)
		if len(parts) < 5:
			continue
		try:
			rows.append(
				{
					"pid": int(parts[0]),
					"ppid": int(parts[1]),
					"pgid": int(parts[2]),
					"state": parts[3],
					"command": parts[4],
				}
			)
		except ValueError:
			continue
	return rows


def _build_process_map(rows: list[dict[str, object]]) -> dict[int, dict[str, object]]:
	return {int(row["pid"]): row for row in rows}


def _find_descendants(root_pid: int, rows: list[dict[str, object]]) -> list[dict[str, object]]:
	process_map = _build_process_map(rows)
	children_by_parent: dict[int, list[int]] = {}
	for row in rows:
		children_by_parent.setdefault(int(row["ppid"]), []).append(int(row["pid"]))

	seen: set[int] = set()
	ordered: list[dict[str, object]] = []
	stack = list(children_by_parent.get(root_pid, []))
	while stack:
		pid = stack.pop()
		if pid in seen:
			continue
		seen.add(pid)
		row = process_map.get(pid)
		if row:
			ordered.append(row)
		stack.extend(children_by_parent.get(pid, []))
	return sorted(ordered, key=lambda row: int(row["pid"]))


def _is_process_alive(pid: int) -> bool:
	try:
		os.kill(pid, 0)
	except ProcessLookupError:
		return False
	except PermissionError:
		return True
	return True


def _terminate_pid(pid: int, sig: int) -> None:
	try:
		os.kill(pid, sig)
	except ProcessLookupError:
		return


def _wait_for_pid_exit(pid: int, timeout: float) -> bool:
	deadline = time.monotonic() + timeout
	while time.monotonic() < deadline:
		if not _is_process_alive(pid):
			return True
		time.sleep(0.1)
	return not _is_process_alive(pid)


def _wait_for_process_exit(process: object | None, timeout: float) -> bool:
	if process is None:
		return True
	try:
		process.wait(timeout=timeout)
		return True
	except Exception:
		return False


def _signal_process_group(process_group: int | None, sig: int) -> None:
	if not process_group:
		return
	try:
		os.killpg(process_group, sig)
	except ProcessLookupError:
		return


def _reap_child_pid(pid: int) -> bool:
	try:
		waited_pid, _ = os.waitpid(pid, os.WNOHANG)
	except ChildProcessError:
		return not _is_process_alive(pid)
	return waited_pid == pid or not _is_process_alive(pid)


def _reap_owned_descendants(descendant_pids: set[int], timeout: float) -> list[int]:
	deadline = time.monotonic() + timeout
	remaining = set(descendant_pids)
	while remaining and time.monotonic() < deadline:
		reaped_any = False
		for pid in list(remaining):
			if _reap_child_pid(pid):
				remaining.discard(pid)
				reaped_any = True
		if not remaining:
			break
		if not reaped_any:
			time.sleep(0.1)
	return sorted(pid for pid in remaining if _is_process_alive(pid))


def _classify_root_pid(launcher_pid: int, descendants: list[dict[str, object]]) -> int | None:
	for row in descendants:
		command = str(row.get("command") or "")
		if "chromium-headless-shell" in command and int(row.get("ppid") or 0) == launcher_pid:
			return int(row["pid"])
	return int(descendants[0]["pid"]) if descendants else None


def isolate_owned_process_group(state: BrowserLifecycleState) -> None:
	process = state.owned_process
	if not process:
		return

	launcher_pid = getattr(process, "pid", None)
	if not launcher_pid:
		return

	try:
		os.setpgid(launcher_pid, launcher_pid)
	except Exception:
		pass

	try:
		state.owned_process_group = os.getpgid(launcher_pid)
	except Exception:
		state.owned_process_group = None


def record_owned_process_metadata(state: BrowserLifecycleState) -> None:
	process = state.owned_process
	if not process:
		return

	launcher_pid = getattr(process, "pid", None)
	if not launcher_pid:
		return

	rows = _process_rows()
	descendants = _find_descendants(launcher_pid, rows)
	launcher_row = _build_process_map(rows).get(launcher_pid)
	state.owned_launcher_pid = launcher_pid
	state.owned_root_pid = _classify_root_pid(launcher_pid, descendants)
	state.owned_process_group = int(launcher_row["pgid"]) if launcher_row else None
	state.owned_processes = descendants


def cleanup_browser_lifecycle(state: BrowserLifecycleState) -> dict[str, object]:
	initial_descendants = list(state.owned_processes)
	diagnostics = {
		"page_closed": False,
		"browser_context_disposed": False,
		"socket_disconnected": False,
		"generator_closed": False,
		"owned_launcher_pid": state.owned_launcher_pid,
		"owned_root_pid": state.owned_root_pid,
		"owned_process_group": state.owned_process_group,
		"owned_processes_before_cleanup": initial_descendants,
		"owned_processes_after_cleanup": [],
		"owned_processes_remaining": [],
		"owned_defunct_processes": [],
		"temp_paths_removed": [],
		"cleanup_errors": [],
		"errors": [],
	}
	if state.page is not None:
		try:
			state.page.close()
			diagnostics["page_closed"] = True
		except Exception as error:  # noqa: BLE001
			diagnostics["cleanup_errors"].append(f"page_close:{error}")
	if state.browser_context_id and state.session is not None:
		try:
			state.session.send("Target.disposeBrowserContext", {"browserContextId": state.browser_context_id})
			diagnostics["browser_context_disposed"] = True
		except Exception as error:  # noqa: BLE001
			diagnostics["cleanup_errors"].append(f"context_dispose:{error}")
	if state.session is not None:
		try:
			state.session.disconnect()
			diagnostics["socket_disconnected"] = True
		except Exception as error:  # noqa: BLE001
			diagnostics["cleanup_errors"].append(f"socket_disconnect:{error}")

	process = state.owned_process
	launcher_pid = state.owned_launcher_pid
	process_group = state.owned_process_group
	current_process_group = os.getpgrp()
	if process and launcher_pid:
		group_isolated = bool(process_group and process_group != current_process_group)
		descendant_pids = {int(row["pid"]) for row in initial_descendants}

		if state.generator is not None and state.owned_generator:
			try:
				state.generator._close_browser()
				diagnostics["generator_closed"] = True
			except Exception as error:  # noqa: BLE001
				diagnostics["cleanup_errors"].append(f"generator_close:{error}")

		launcher_exited = _wait_for_process_exit(process, timeout=5.0)
		if not launcher_exited and _is_process_alive(launcher_pid):
			_terminate_pid(launcher_pid, signal.SIGTERM)
			launcher_exited = _wait_for_process_exit(process, timeout=5.0)
		if not launcher_exited and group_isolated:
			_signal_process_group(process_group, signal.SIGTERM)
			launcher_exited = _wait_for_process_exit(process, timeout=3.0)
		if not launcher_exited and _is_process_alive(launcher_pid):
			_terminate_pid(launcher_pid, signal.SIGKILL)
			launcher_exited = _wait_for_process_exit(process, timeout=2.0)
		if not launcher_exited and group_isolated:
			_signal_process_group(process_group, signal.SIGKILL)
			_wait_for_process_exit(process, timeout=2.0)
		unreaped_descendants = _reap_owned_descendants(descendant_pids, timeout=5.0)
		if unreaped_descendants and group_isolated:
			_signal_process_group(process_group, signal.SIGKILL)
			unreaped_descendants = _reap_owned_descendants(descendant_pids, timeout=2.0)
		if unreaped_descendants:
			diagnostics["cleanup_errors"].append(
				"owned_descendants_unreaped:" + ",".join(str(pid) for pid in unreaped_descendants)
			)
	elif state.generator is not None and state.owned_generator:
		try:
			state.generator._close_browser()
			diagnostics["generator_closed"] = True
		except Exception as error:  # noqa: BLE001
			diagnostics["cleanup_errors"].append(f"generator_close:{error}")

	remaining_pids = {int(row["pid"]) for row in initial_descendants}
	if launcher_pid:
		rows_now = _process_rows()
		remaining_pids.update(int(row["pid"]) for row in _find_descendants(launcher_pid, rows_now))

	live_rows: list[dict[str, object]] = []
	for pid in sorted(remaining_pids):
		if not _is_process_alive(pid):
			continue
		row = _build_process_map(_process_rows()).get(pid)
		if row:
			live_rows.append(row)

	for row in live_rows:
		try:
			_terminate_pid(int(row["pid"]), signal.SIGTERM)
		except Exception as error:  # noqa: BLE001
			diagnostics["cleanup_errors"].append(f"pid_term:{row['pid']}:{error}")

	time.sleep(1.0)
	rows_after_term = _process_rows()
	process_map_after_term = _build_process_map(rows_after_term)
	still_live = [
		process_map_after_term[pid]
		for pid in sorted(remaining_pids)
		if pid in process_map_after_term and _is_process_alive(pid)
	]
	for row in still_live:
		try:
			_terminate_pid(int(row["pid"]), signal.SIGKILL)
		except Exception as error:  # noqa: BLE001
			diagnostics["cleanup_errors"].append(f"pid_kill:{row['pid']}:{error}")

	time.sleep(1.0)
	final_rows = _process_rows()
	final_process_map = _build_process_map(final_rows)
	final_live_rows = [
		final_process_map[pid]
		for pid in sorted(remaining_pids)
		if pid in final_process_map and _is_process_alive(pid)
	]
	diagnostics["owned_processes_after_cleanup"] = [
		final_process_map[pid]
		for pid in sorted(remaining_pids)
		if pid in final_process_map
	]
	diagnostics["owned_processes_remaining"] = [
		row for row in final_live_rows if "Z" not in str(row.get("state") or "")
	]
	diagnostics["owned_defunct_processes"] = [
		row for row in final_live_rows if "Z" in str(row.get("state") or "")
	]
	for temp_path in state.temp_paths:
		try:
			Path(temp_path).unlink(missing_ok=True)
			diagnostics["temp_paths_removed"].append(temp_path)
		except Exception as error:  # noqa: BLE001
			diagnostics["cleanup_errors"].append(f"temp_remove:{error}")
	diagnostics["errors"] = diagnostics["cleanup_errors"]
	return diagnostics
