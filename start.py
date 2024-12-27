import subprocess
import os
import socket
import webbrowser
from time import sleep
import netifaces

def get_network_info():
    network_info = []
    try:
        interfaces = netifaces.interfaces()
        
        for iface in interfaces:
            addrs = netifaces.ifaddresses(iface)
            if netifaces.AF_INET in addrs:
                for addr in addrs[netifaces.AF_INET]:
                    ip = addr['addr']
                    if not ip.startswith('127.'):
                        network_info.append((iface, ip))
    except Exception as e:
        print(f"Error getting network interfaces: {e}")
    
    return network_info

def get_local_ip():
    network_info = get_network_info()
    if network_info:
        return network_info[0][1]
    return "localhost"

def main():
    network_info = get_network_info()
    local_ip = get_local_ip()
    
    os.system('clear' if os.name == 'posix' else 'cls')
    
    print(f"""
╔══════════════════════════════════════════╗
║         System Monitor Dashboard         ║
╚══════════════════════════════════════════╝
    """)
    
    print("\nAvailable Network Interfaces:")
    for iface, ip in network_info:
        print(f"Interface {iface}: {ip}")
    
    print(f"\nStarting services on {local_ip}")
    print("\nBackend API URLs:")
    print(f"http://{local_ip}:8000")
    print("\nFrontend URLs:")
    print(f"http://{local_ip}:3000")
    print("\nPress Ctrl+C to stop all services\n")

    try:
        backend_env = os.environ.copy()
        backend_env["PYTHONUNBUFFERED"] = "1"
        
        # Create a log file for backend errors
        backend_log = open('backend_error.log', 'w')
        
        os.chdir('backend')
        backend = subprocess.Popen(
            [
                "uvicorn", 
                "main:app", 
                "--host", "0.0.0.0",
                "--port", "8000", 
                "--reload", 
                "--log-level", "info"
            ],
            env=backend_env,
            stdout=backend_log,
            stderr=backend_log
        )
        os.chdir('..')

        sleep(2)

        if backend.poll() is not None:
            print("Backend failed to start! Check backend_error.log for details")
            return

        os.chdir('frontend')

        frontend_env = os.environ.copy()
        frontend_env["BROWSER"] = "none"
        frontend_env["HOST"] = "0.0.0.0"  # Set host in environment
        frontend_env["PORT"] = "3000"      # Set port in environment
        
        # Create a log file for frontend errors
        frontend_log = open('../frontend_error.log', 'w')
        frontend = subprocess.Popen(
            [
                "npm", 
                "start", 
                "--", 
                "--host", "0.0.0.0",
                "--port", "3000"
            ],
            env=frontend_env,
            stdout=frontend_log,
            stderr=frontend_log
        )

        os.chdir('..')

        print("Services are running...")
        print("\nTry accessing the dashboard using any of these URLs:")
        for iface, ip in network_info:
            print(f"http://{ip}:3000")
        
        while True:
            backend_status = backend.poll()
            frontend_status = frontend.poll()
            
            if backend_status is not None:
                print(f"\nBackend process has stopped with exit code: {backend_status}")
                print("Check backend_error.log for details")
                break
                
            if frontend_status is not None:
                print(f"\nFrontend process has stopped with exit code: {frontend_status}")
                print("Check frontend_error.log for details")
                break
                
            sleep(1)
            
    except KeyboardInterrupt:
        print("\nShutting down services...")
    finally:
        try:
            backend.terminate()
            frontend.terminate()
            backend_log.close()
            frontend_log.close()
        except:
            pass
        print("Services stopped")

if __name__ == "__main__":
    main() 
