use sha2::{Sha256, Digest};
use mac_address::get_mac_address;
use tauri::command;
use keyring::Entry;
use hostname::get;

#[command]
pub fn get_machine_hash() -> Result<String, String> {
    let mac = get_mac_address()
        .map_err(|e| format!("Failed to get MAC: {}", e))?
        .ok_or("No MAC address found".to_string())?
        .to_string();
    
    let hostname = get()
        .map_err(|e| format!("Failed to get hostname: {}", e))?
        .to_string_lossy()
        .to_string();
    println!("Host Name: {}", hostname);

    let motherboard = get_motherboard_serial().unwrap_or_default();
    let os_id = get_os_install_id().unwrap_or_default();

    let combined = format!("{}|{}|{}", mac, motherboard, os_id);

    let mut hasher = Sha256::new();
    hasher.update(combined);

    Ok(format!("{:x}", hasher.finalize()))
}

fn get_motherboard_serial() -> Result<String, Box<dyn std::error::Error>> {
    #[cfg(target_os = "windows")]
    {
        use winreg::RegKey;
        use winreg::enums::HKEY_LOCAL_MACHINE;
        let hklm = RegKey::predef(HKEY_LOCAL_MACHINE);
        let key = hklm.open_subkey("HARDWARE\\DESCRIPTION\\System\\BIOS")?;
        let serial: String = key.get_value("BaseBoardSerialNumber")?;
        Ok(serial)
    }
    #[cfg(target_os = "linux")]
    {
        let content = std::fs::read_to_string("/sys/class/dmi/id/board_serial")?;
        Ok(content.trim().to_string())
    }
    #[cfg(target_os = "macos")]
    {
        let output = std::process::Command::new("ioreg")
            .args(&["-l", "-c", "IOPlatformExpertDevice"])
            .output()?;
        let stdout = String::from_utf8_lossy(&output.stdout);
        for line in stdout.lines() {
            if line.contains("board-id") {
                let parts: Vec<&str> = line.split('"').collect();
                if parts.len() >= 2 {
                    return Ok(parts[1].to_string());
                }
            }
        }
        Ok(String::new())
    }
    #[cfg(not(any(target_os = "windows", target_os = "linux", target_os = "macos")))]
    { Ok(String::new()) }
}

fn get_os_install_id() -> Result<String, Box<dyn std::error::Error>> {
    #[cfg(target_os = "windows")]
    {
        use winreg::RegKey;
        use winreg::enums::HKEY_LOCAL_MACHINE;
        let hklm = RegKey::predef(HKEY_LOCAL_MACHINE);
        let key = hklm.open_subkey("SOFTWARE\\Microsoft\\Cryptography")?;
        let guid: String = key.get_value("MachineGuid")?;
        Ok(guid)
    }
    #[cfg(target_os = "linux")]
    {
        let paths = ["/var/lib/dbus/machine-id", "/etc/machine-id"];
        for p in paths {
            if Path::new(p).exists() {
                return Ok(fs::read_to_string(p)?.trim().to_string());
            }
        }
        Ok(String::new())
    }
    #[cfg(target_os = "macos")]
    {
        let output = std::process::Command::new("ioreg")
            .args(&["-l", "-c", "IOPlatformExpertDevice"])
            .output()?;
        let stdout = String::from_utf8_lossy(&output.stdout);
        for line in stdout.lines() {
            if line.contains("IOPlatformUUID") {
                let parts: Vec<&str> = line.split('"').collect();
                if parts.len() >= 2 {
                    return Ok(parts[1].to_string());
                }
            }
        }
        Ok(String::new())
    }
    #[cfg(not(any(target_os = "windows", target_os = "linux", target_os = "macos")))]
    { Ok(String::new()) }
}

#[command]
pub fn store_secure(key: String, value: String) -> Result<(), String> {
    let entry = Entry::new("com.moelsgroup.front-tellar-tauri", &key).map_err(|e| e.to_string())?;
    entry.set_password(&value).map_err(|e| e.to_string())
}

#[command]
pub fn get_secure(key: String) -> Result<String, String> {
    let entry = Entry::new("com.moelsgroup.front-tellar-tauri", &key).map_err(|e| e.to_string())?;
    entry.get_password().map_err(|e| e.to_string())
}

#[command]
pub fn delete_secure(key: String) -> Result<(), String> {
    let entry = Entry::new("com.moelsgroup.front-tellar-tauri", &key).map_err(|e| e.to_string())?;
    entry.delete_password().map_err(|e| e.to_string())
}