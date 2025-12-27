import json
import re
# ... інші імпорти

class Config:
    # ... інші змінні ...
    
    @staticmethod
    def validate_ssid_format(ssid):
        """Перевіряє чи SSID у правильному форматі"""
        if not ssid:
            return False, "SSID порожній"
        
        # Перевірка формату
        pattern = r'^42\["auth",\{.*\}\]$'
        if not re.match(pattern, ssid):
            return False, f"Неправильний формат SSID. Має бути: 42[\"auth\",{{\"session\":\"...\",...}}]"
        
        return True, "SSID валідний"
    
    @classmethod
    def get_validated_ssid(cls):
        """Повертає валідований SSID"""
        ssid = cls.POCKET_SSID
        
        # Якщо SSID не у повному форматі, конвертуємо
        if ssid and not ssid.startswith('42["auth"'):
            logger.warning("SSID не у повному форматі, конвертую...")
            ssid = f'42["auth",{{"session":"{ssid}","isDemo":1,"uid":100000,"platform":1}}]'
        
        is_valid, message = cls.validate_ssid_format(ssid)
        if not is_valid:
            logger.error(f"Помилка валідації SSID: {message}")
        
        return ssid
