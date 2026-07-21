import os
import subprocess
import argparse
import shutil
import logging

# --- ANSI màu --- 
class LogColors:
    RESET = "\033[0m"
    RED = "\033[31m"
    GREEN = "\033[32m"
    YELLOW = "\033[33m"
    CYAN = "\033[36m"

# --- Cấu hình logging ---
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)

def log_info(msg):
    logging.info(f"{LogColors.GREEN}{msg}{LogColors.RESET}")

def log_warn(msg):
    logging.warning(f"{LogColors.YELLOW}{msg}{LogColors.RESET}")

def log_error(msg):
    logging.error(f"{LogColors.RED}{msg}{LogColors.RESET}")

# --- Thư mục và file ---
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CERT_DIR = os.path.join(BASE_DIR, "certs")
DEMO_CA_DIR = os.path.join(BASE_DIR, "demoCA")
CONFIG_DIR = os.path.join(BASE_DIR, "config")
CLIENT_EXT = os.path.join(CONFIG_DIR, "client_ext.cnf")
OPENSSL_CNF = os.path.join(CONFIG_DIR, "openssl.cnf")
SCAN_EXT = os.path.join(CONFIG_DIR, "scan_ext.cnf")

# --- Utility function ---
def run(cmd):
    log_info(f"[RUN] {cmd}")
    subprocess.run(cmd, shell=True, check=True)

def ensure_dirs():
    for d in [CERT_DIR, DEMO_CA_DIR, CONFIG_DIR]:
        os.makedirs(d, exist_ok=True)
    for file_name in ["openssl.cnf", "client_ext.cnf", "scan_ext.cnf"]:
        src_path = os.path.join(os.getcwd(), file_name)
        dest_path = os.path.join(CONFIG_DIR, file_name)
        if os.path.exists(src_path):
            shutil.copy2(src_path, dest_path)
            log_info(f"Copied {file_name} -> {CONFIG_DIR}")
        else:
            log_warn(f"File not found: {file_name}")

def init_demoCA():
    os.makedirs(os.path.join(DEMO_CA_DIR, "newcerts"), exist_ok=True)
    os.makedirs(os.path.join(DEMO_CA_DIR, "crl"), exist_ok=True)
    os.makedirs(os.path.join(DEMO_CA_DIR, "private"), exist_ok=True)
    for f, default in [("index.txt",""), ("serial","1000\n"), ("crlnumber","1000\n")]:
        path = os.path.join(DEMO_CA_DIR, f)
        if not os.path.exists(path):
            with open(path, "w") as fp:
                fp.write(default)

def create_ca():
    subj = "/C=VN/ST=VinhLong/L=VinhLong/O=CongHoa/OU=IOT/CN=EMQX-CA/emailAddress=conghoa247@gmail.com"
    key = os.path.join(CERT_DIR, "rootCA.key")
    crt = os.path.join(CERT_DIR, "rootCA.crt")
    log_info("Creating Root CA...")
    run(f"openssl genrsa -des3 -out {key} 2048")
    run(f"openssl req -x509 -new -nodes -key {key} -sha256 -days 3650 -out {crt} -subj \"{subj}\"")
    init_demoCA()
    log_info(f"Root CA created: {crt}")

def create_server():
    subj = "/C=VN/ST=VinhLong/L=VinhLong/O=CongHoa/OU=IOT/CN=localhost/emailAddress=conghoa247@gmail.com"
    key = os.path.join(CERT_DIR, "server.key")
    crt = os.path.join(CERT_DIR, "server.crt")
    log_info("Creating Server certificate...")
    run(f"openssl genrsa -out {key} 2048")
    run(f"openssl req -new -key {key} -out {CERT_DIR}/server.csr -subj \"{subj}\"")
    run(f"openssl x509 -req -in {CERT_DIR}/server.csr -CA {CERT_DIR}/rootCA.crt -CAkey {CERT_DIR}/rootCA.key "
        f"-CAcreateserial -out {crt} -days 365 -sha256 -extfile {SCAN_EXT} -extensions v3_req")
    log_info(f"Server certificate created: {crt}")

def create_client(names):
    for name in names:
        subj = f"/C=VN/ST=VinhLong/L=VinhLong/O=CongHoa/OU=IOT/CN={name}/emailAddress=conghoa247@gmail.com"
        key = os.path.join(CERT_DIR, f"{name}.key")
        crt = os.path.join(CERT_DIR, f"{name}.crt")
        log_info(f"Creating Client certificate for {name}...")
        run(f"openssl genrsa -out {key} 2048")
        run(f"openssl req -new -key {key} -out {CERT_DIR}/{name}.csr -subj \"{subj}\"")
        run(f"openssl x509 -req -in {CERT_DIR}/{name}.csr -CA {CERT_DIR}/rootCA.crt -CAkey {CERT_DIR}/rootCA.key "
            f"-CAcreateserial -out {crt} -days 365 -sha256 -extfile {CLIENT_EXT} -extensions crl_ext")
        log_info(f"Client certificate created: {crt}")

def create_crl():
    crl = os.path.join(CERT_DIR, "crl.pem")
    log_info("Generating CRL...")
    run(f"openssl ca -gencrl -keyfile {CERT_DIR}/rootCA.key -cert {CERT_DIR}/rootCA.crt -out {crl} -config {OPENSSL_CNF}")
    log_info(f"CRL created at {crl}")

def revoke_cert(name):
    cert_file = os.path.join(CERT_DIR, f"{name}.crt")
    log_info(f"Revoking certificate: {cert_file}")
    run(f"openssl ca -revoke {cert_file} -keyfile {CERT_DIR}/rootCA.key -cert {CERT_DIR}/rootCA.crt -config {OPENSSL_CNF}")
    create_crl()

def check_cert_or_crl(name):
    crt_file = os.path.join(CERT_DIR, name)
    if not os.path.exists(crt_file):
        log_warn(f"File {crt_file} does not exist!")
        return
    
    if crt_file.endswith(".crt"):
        log_info(f"Checking certificate: {crt_file}")
        run(f"openssl x509 -in {crt_file} -text -noout")
    elif crt_file.endswith(".crl") or crt_file.endswith(".pem"):
        log_info(f"Checking CRL: {crt_file}")
        run(f"openssl crl -in {crt_file} -text -noout")
    else:
        log_warn(f"Unknown file type: {crt_file}")

def main():
    parser = argparse.ArgumentParser(description="Certificate Tool for EMQX with CRL")
    parser.add_argument("-init", action="store_true", help="Initialize folders only")
    parser.add_argument("-ca", action="store_true")
    parser.add_argument("-server", action="store_true")
    parser.add_argument("-client", nargs="+")
    parser.add_argument("-crl", action="store_true")
    parser.add_argument("-revoke", nargs="+")
    parser.add_argument("-check", nargs="+", help="Check client certificates")
    args = parser.parse_args()

    if args.init:
        ensure_dirs()
        init_demoCA()
        log_info("Folders initialized.")
        return

    if args.ca: create_ca()
    if args.server: create_server()
    if args.client: create_client(args.client)
    if args.crl: create_crl()
    if args.revoke:
        for cert in args.revoke:
            revoke_cert(cert)
    if args.check:
        for cert in args.check:
            check_cert_or_crl(cert)

    log_info(f"All certificates and CRL are stored in {CERT_DIR}")

if __name__ == "__main__":
    main()