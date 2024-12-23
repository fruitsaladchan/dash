from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
import psutil
import asyncio
import json
from datetime import datetime
import platform
import distro
import socket
import subprocess
import os
import logging
import time
import netifaces
import getpass
from typing import List, Dict
import pwd
import grp
# import spwd
from psutil._common import bytes2human

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# logging
logging.getLogger("uvicorn.error").handlers = []
logging.getLogger("uvicorn.error").propagate = False

logging.getLogger("uvicorn.access").handlers = []
logging.getLogger("uvicorn.access").propagate = False

logging.getLogger("uvicorn.asgi").handlers = []
logging.getLogger("uvicorn.asgi").propagate = True

last_net_io = None
last_net_time = None
last_disk_io = None
last_disk_time = None


@app.get("/")
async def root():
    """Test endpoint to verify API is running"""
    return {"status": "running"}


async def run_power_command(command):
    if platform.system() == "Linux":
        commands = {
            "shutdown": ["shutdown", "-h", "now"],
            "restart": ["shutdown", "-r", "now"],
            "sleep": ["systemctl", "suspend"],
            "hibernate": ["systemctl", "hibernate"],
        }
    elif platform.system() == "Windows":
        commands = {
            "shutdown": ["shutdown", "/s", "/t", "0"],
            "restart": ["shutdown", "/r", "/t", "0"],
            "sleep": [
                "powercfg",
                "/hibernate",
                "off",
                "&&",
                "rundll32.exe",
                "powrprof.dll,SetSuspendState",
                "0,1,0",
            ],
            "hibernate": ["shutdown", "/h"],
        }

    if command in commands:
        try:
            subprocess.run(commands[command], check=True)
            return {"status": "success"}
        except subprocess.CalledProcessError as e:
            return {"status": "error", "message": str(e)}
    return {"status": "error", "message": "Invalid command"}


@app.post("/power/{command}")
async def power_control(command: str):
    return await run_power_command(command)


def get_open_ports():
    try:
        connections = psutil.net_connections(kind="inet")
        ports = []
        for conn in connections:
            if conn.status == "LISTEN":
                ports.append(
                    {
                        "port": conn.laddr.port,
                        "ip": conn.laddr.ip,
                        "pid": conn.pid,
                        "program": (
                            psutil.Process(conn.pid).name() if conn.pid else "Unknown"
                        ),
                    }
                )
        return sorted(ports, key=lambda x: x["port"])
    except:
        return []


def get_network_logs(lines=100):
    try:
        if platform.system() == "Linux":
            cmd = f"journalctl -n {lines} -p warning -t kernel | grep -i net"
        else:
            cmd = f"powershell Get-EventLog -LogName System -Newest {lines} | Where-Object {{'$_.Source -like \"*NET*\"'}}"

        result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
        logs = result.stdout.splitlines()
        return [
            {"timestamp": datetime.now().isoformat(), "message": log} for log in logs
        ]
    except:
        return []


def get_services() -> List[Dict]:
    try:
        if platform.system() == "Linux":
            cmd = "systemctl list-units --type=service --all --plain --no-legend"
            result = subprocess.run(cmd.split(), capture_output=True, text=True)
            services = []

            for line in result.stdout.splitlines():
                parts = line.split()
                if len(parts) >= 4:
                    service_name = parts[0].replace(".service", "")
                    status = parts[2]  # active/inactive
                    state = parts[3]  # running/dead/failed

                    enabled_cmd = f"systemctl is-enabled {service_name}"
                    enabled_result = subprocess.run(
                        enabled_cmd.split(), capture_output=True, text=True
                    )
                    enabled = enabled_result.stdout.strip()

                    services.append(
                        {
                            "name": service_name,
                            "status": status,
                            "state": state,
                            "enabled": enabled == "enabled",
                        }
                    )

            return sorted(services, key=lambda x: x["name"].lower())

        elif platform.system() == "Windows":
            # Windows services using owerShell
            cmd = "powershell Get-Service | Select-Object Name,Status,StartType"
            result = subprocess.run(cmd, capture_output=True, text=True, shell=True)
            services = []

            for line in result.stdout.splitlines()[3:]:
                if line.strip():
                    parts = line.strip().split()
                    if len(parts) >= 2:
                        name = parts[0]
                        status = parts[1]
                        start_type = parts[2] if len(parts) > 2 else "Unknown"

                        services.append(
                            {
                                "name": name,
                                "status": status,
                                "state": status,
                                "enabled": start_type.lower() in ["automatic", "auto"],
                            }
                        )

            return sorted(services, key=lambda x: x["name"].lower())

        return []
    except Exception as e:
        print(f"Error getting services: {e}")
        return []


def get_system_accounts():
    try:
        users = []
        for user in pwd.getpwall():
            try:
                last_login = "Never"
                cmd = f"lastlog -u {user.pw_name}"
                result = subprocess.run(cmd.split(), capture_output=True, text=True)
                if result.stdout and not "**Never logged in**" in result.stdout:
                    login_info = result.stdout.split("\n")[1]
                    if login_info:
                        last_login = login_info.split()[2:5]
                        last_login = " ".join(last_login)
            except:
                last_login = "Unknown"

            users.append(
                {
                    "name": user.pw_name,
                    "uid": user.pw_uid,
                    "gid": user.pw_gid,
                    "home": user.pw_dir,
                    "shell": user.pw_shell,
                    "last_login": last_login,
                }
            )

        groups = []
        for group in grp.getgrall():
            groups.append(
                {"name": group.gr_name, "gid": group.gr_gid, "members": group.gr_mem}
            )

        return {"users": users, "groups": groups}
    except Exception as e:
        print(f"Error getting system accounts: {e}")
        return {"users": [], "groups": []}


def get_disk_io():
    try:
        disk_io = psutil.disk_io_counters()
        return {
            "read_bytes": disk_io.read_bytes,
            "write_bytes": disk_io.write_bytes,
            "read_speed": 0,
            "write_speed": 0,
        }
    except:
        return None


def get_battery_info():
    try:
        battery = psutil.sensors_battery()
        if battery:
            return {
                "percent": battery.percent,
                "power_plugged": battery.power_plugged,
                "seconds_left": battery.secsleft if battery.secsleft != -1 else None,
            }
        return None
    except:
        return None


def get_system_logs(priority=None, time_filter=None, search_term=None):
    try:
        cmd = ["journalctl"]

        if priority and priority != "all":
            cmd.extend(["-p", priority])

        if time_filter:
            if time_filter == "current-boot":
                cmd.append("-b")
            elif time_filter == "previous-boot":
                cmd.extend(["-b", "-1"])
            elif time_filter == "24h":
                cmd.append("--since='24 hours ago'")
            elif time_filter == "7d":
                cmd.append("--since='7 days ago'")

        cmd.extend(["-o", "json"])

        result = subprocess.run(" ".join(cmd), shell=True, capture_output=True, text=True)

        logs = []
        for line in result.stdout.splitlines():
            try:
                log_entry = json.loads(line)
                message = str(log_entry.get("MESSAGE", ""))  
                if not search_term or (isinstance(message, str) and search_term.lower() in message.lower()):
                    logs.append({
                        "timestamp": log_entry.get("__REALTIME_TIMESTAMP", ""),
                        "priority": log_entry.get("PRIORITY", ""),
                        "unit": log_entry.get("_SYSTEMD_UNIT", ""),
                        "message": message
                    })
            except json.JSONDecodeError:
                continue
            except AttributeError:
                continue  

        return logs
    except Exception as e:
        print(f"Error getting system logs: {e}")
        return [] 


def get_system_type():
    try:
        battery = psutil.sensors_battery()
        if battery:
            return "Laptop"

        if platform.system() == "Linux":
            cmd = "dmidecode -s chassis-type"
            result = subprocess.run(cmd.split(), capture_output=True, text=True)
            chassis_type = result.stdout.strip().lower()
            if any(t in chassis_type for t in ["laptop", "notebook", "portable"]):
                return "Laptop"
        return "Desktop"
    except:
        return "Unknown"


def get_cpu_info():
    try:
        if platform.system() == "Linux":
            with open("/proc/cpuinfo") as f:
                cpu_info = f.readlines()

            model_name = next(
                (
                    line.split(":")[1].strip()
                    for line in cpu_info
                    if "model name" in line
                ),
                "Unknown",
            )
            cores = len([line for line in cpu_info if "processor" in line])
            return {
                "model": model_name,
                "cores": cores,
                "architecture": platform.machine(),
            }
        return {
            "model": platform.processor(),
            "cores": psutil.cpu_count(),
            "architecture": platform.machine(),
        }
    except:
        return None


def get_bios_info():
    try:
        if platform.system() == "Linux":
            bios_info = {}
            cmd = "dmidecode -t bios"
            result = subprocess.run(cmd.split(), capture_output=True, text=True)
            for line in result.stdout.splitlines():
                if "Vendor:" in line:
                    bios_info["vendor"] = line.split(":")[1].strip()
                elif "Version:" in line:
                    bios_info["version"] = line.split(":")[1].strip()
                elif "Release Date:" in line:
                    bios_info["date"] = line.split(":")[1].strip()
            return bios_info
        return None
    except:
        return None


def get_pci_devices():
    try:
        if platform.system() == "Linux":
            devices = []
            cmd = "lspci -vmm"
            result = subprocess.run(cmd.split(), capture_output=True, text=True)

            current_device = {}
            for line in result.stdout.splitlines():
                if line.strip():
                    if ":" in line:
                        key, value = line.split(":", 1)
                        key = key.strip()
                        value = value.strip()

                        if key == "Class":
                            current_device["class"] = value
                        elif key == "Vendor":
                            current_device["vendor"] = value
                        elif key == "Device":
                            current_device["model"] = value
                else:
                    if current_device:  
                        devices.append(current_device)
                        current_device = {}

            if current_device:
                devices.append(current_device)

            return sorted(devices, key=lambda x: x.get("class", ""))
        return []
    except:
        return []


def get_memory_info():
    try:
        if platform.system() == "Linux":
            cmd = "dmidecode -t memory"
            result = subprocess.run(cmd.split(), capture_output=True, text=True)
            memory_modules = []
            current_module = {}
            
            for line in result.stdout.splitlines():
                line = line.strip()
                if "Memory Device" in line:
                    if current_module:
                        memory_modules.append(current_module)
                    current_module = {}
                elif ":" in line:
                    key, value = line.split(":", 1)
                    key = key.strip()
                    value = value.strip()
                    
                    if key == "Size":
                        if "No Module Installed" in value:
                            current_module = {}
                            continue
                        current_module["size"] = value
                    elif key == "Type":
                        current_module["type"] = value
                    elif key == "Speed":
                        current_module["speed"] = value
                    elif key == "Manufacturer":
                        current_module["manufacturer"] = value
                    elif key == "Memory Technology":
                        current_module["technology"] = value
                    elif key == "Part Number":
                        current_module["id"] = value

            if current_module:
                memory_modules.append(current_module)
                
            return [module for module in memory_modules if module]
        return []
    except:
        return []


async def get_system_stats():
    try:
        global last_net_io, last_net_time, last_disk_io, last_disk_time
        current_net_io = psutil.net_io_counters()
        current_time = time.time()
        current_disk_io = get_disk_io()

        if last_net_io and last_net_time:
            time_elapsed = current_time - last_net_time
            upload_speed = (
                current_net_io.bytes_sent - last_net_io.bytes_sent
            ) / time_elapsed
            download_speed = (
                current_net_io.bytes_recv - last_net_io.bytes_recv
            ) / time_elapsed
        else:
            upload_speed = 0
            download_speed = 0

        if last_disk_io and last_disk_time and current_disk_io:
            time_elapsed = current_time - last_disk_time
            read_speed = (
                current_disk_io["read_bytes"] - last_disk_io["read_bytes"]
            ) / time_elapsed
            write_speed = (
                current_disk_io["write_bytes"] - last_disk_io["write_bytes"]
            ) / time_elapsed
            current_disk_io["read_speed"] = read_speed
            current_disk_io["write_speed"] = write_speed

        last_disk_io = current_disk_io
        last_disk_time = current_time

        last_net_io = current_net_io
        last_net_time = current_time

        # hostname
        hostname = socket.gethostname()

        # active users
        users = []
        for user in psutil.users():
            users.append(
                {
                    "name": user.name,
                    "terminal": user.terminal,
                    "host": user.host,
                    "started": datetime.fromtimestamp(user.started).strftime(
                        "%Y-%m-%d %I:%M"
                    ),
                }
            )

        # fan speeds
        try:
            fans = psutil.sensors_fans()
            fan_speeds = [
                {"label": label, "speed": fan.current}
                for label, fans in fans.items()
                for fan in fans
            ]
        except:
            fan_speeds = []

        
        processes = []
        max_processes = 20  # Default value
        for proc in sorted(
            psutil.process_iter(["pid", "name", "cpu_percent", "memory_percent"]),
            key=lambda x: (x.info["cpu_percent"] or 0),
            reverse=True,
        )[
            :max_processes
        ]:  
            try:
                processes.append(
                    {
                        "pid": proc.info["pid"],
                        "name": proc.info["name"],
                        "cpu_percent": proc.info["cpu_percent"],
                        "memory_percent": proc.info["memory_percent"],
                    }
                )
            except (psutil.NoSuchProcess, psutil.AccessDenied):
                pass

        boot_time = datetime.fromtimestamp(psutil.boot_time())
        uptime = datetime.now() - boot_time

        
        if platform.system() == "Linux":
            os_info = {
                "name": distro.name(pretty=True),
                "version": distro.version(pretty=True),
                "codename": distro.id(),
            }
        else:
            os_info = {
                "name": platform.system(),
                "version": platform.version(),
                "release": platform.release(),
            }

        network_interfaces = []
        for interface in netifaces.interfaces():
            try:
                addrs = netifaces.ifaddresses(interface)
                if netifaces.AF_INET in addrs:
                    ipv4_info = addrs[netifaces.AF_INET][0]
                    if netifaces.AF_LINK in addrs:
                        mac_info = addrs[netifaces.AF_LINK][0]
                    else:
                        mac_info = {"addr": "N/A"}

                    network_interfaces.append(
                        {
                            "name": interface,
                            "ip": ipv4_info.get("addr", "N/A"),
                            "netmask": ipv4_info.get("netmask", "N/A"),
                            "broadcast": ipv4_info.get("broadcast", "N/A"),
                            "mac": mac_info.get("addr", "N/A"),
                        }
                    )
            except Exception as e:
                print(f"Error getting info for interface {interface}: {e}")

        # username
        username = getpass.getuser()

        stats = {
            "timestamp": datetime.now().isoformat(),
            "date": datetime.now().strftime("%Y-%m-%d"),
            "time": datetime.now().strftime("%I:%M %p"),
            "hostname": hostname,
            "username": username,
            "uptime": {
                "days": uptime.days,
                "hours": uptime.seconds // 3600,
                "minutes": (uptime.seconds % 3600) // 60,
            },
            "cpu": {
                "percent": psutil.cpu_percent(interval=0.5),
                "temperature": True,
                "frequency": {
                    "current": (
                        psutil.cpu_freq().current
                        if hasattr(psutil.cpu_freq(), "current")
                        else None
                    ),
                    "min": (
                        psutil.cpu_freq().min
                        if hasattr(psutil.cpu_freq(), "min")
                        else None
                    ),
                    "max": (
                        psutil.cpu_freq().max
                        if hasattr(psutil.cpu_freq(), "max")
                        else None
                    ),
                },
            },
            "memory": {
                "total": psutil.virtual_memory().total,
                "available": psutil.virtual_memory().available,
                "percent": psutil.virtual_memory().percent,
                "used": psutil.virtual_memory().used,
            },
            "disk": {
                "total": psutil.disk_usage("/").total,
                "used": psutil.disk_usage("/").used,
                "free": psutil.disk_usage("/").free,
                "percent": psutil.disk_usage("/").percent,
                "io": current_disk_io,
            },
            "network": {
                "bytes_sent": current_net_io.bytes_sent,
                "bytes_recv": current_net_io.bytes_recv,
                "upload_speed": upload_speed,
                "download_speed": download_speed,
                "packets_sent": current_net_io.packets_sent,
                "packets_recv": current_net_io.packets_recv,
                "open_ports": get_open_ports(),
                "logs": get_network_logs(),
            },
            "system_info": {
                "os": os_info,
                "platform": platform.system(),
                "type": get_system_type(),
                "processor": get_cpu_info(),
                "bios": get_bios_info(),
                "architecture": platform.machine(),
                "network_interfaces": network_interfaces,
            },
            "top_processes": processes,
            "active_users": users,
            "fan_speeds": fan_speeds,
            "services": get_services(),
            "accounts": get_system_accounts(),
            "battery": get_battery_info(),
            "log_priorities": [
                {"value": "all", "label": "All Priorities"},
                {"value": "0", "label": "Emergency"},
                {"value": "1", "label": "Alert"},
                {"value": "2", "label": "Critical"},
                {"value": "3", "label": "Error"},
                {"value": "4", "label": "Warning"},
                {"value": "5", "label": "Notice"},
                {"value": "6", "label": "Info"},
                {"value": "7", "label": "Debug"},
            ],
            "pci_devices": get_pci_devices(),
            "memory_modules": get_memory_info(),
        }

        return stats
    except Exception as e:
        print(f"Error getting system stats: {e}")
        raise


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    # print("New WebSocket connection attempting to connect")  # Debug logging
    await websocket.accept()
    # print("WebSocket connection accepted")  # Debug logging

    try:
        while True:
            stats = await get_system_stats()
            await websocket.send_json(stats)
            await asyncio.sleep(2)
    except Exception as e:
        print(f"WebSocket error: {e}")
        try:
            await websocket.close()
        except:
            pass


# Add this new endpoint
@app.get("/logs")
async def get_logs(priority: str = None, time_filter: str = None, search: str = None):
    try:
        logs = get_system_logs(priority, time_filter, search)
        return logs
    except Exception as e:
        print(f"Error getting logs: {e}")
        return []


if __name__ == "__main__":
    import uvicorn
    host = "0.0.0.0"  # Listen on all interfaces
    uvicorn.run("main:app", host=host, port=8000, log_level="critical")
